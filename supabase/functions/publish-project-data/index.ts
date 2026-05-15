import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AdminRole = {
  email: string;
  project: string;
};

const allowedProjects = new Set(['Resik', 'Hadeyya', 'Siyar', 'Haru']);

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

const getSupabaseClients = (authHeader: string) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Konfigurasi Supabase Edge Function belum lengkap.');
  }

  return {
    userClient: createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    }),
    adminClient: createClient(supabaseUrl, serviceKey),
  };
};

const assertAdmin = async (authHeader: string, project: string) => {
  if (!authHeader) throw new Error('Admin belum login.');
  if (!allowedProjects.has(project)) throw new Error('Pilih project tertentu untuk publish.');

  const { userClient, adminClient } = getSupabaseClients(authHeader);
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const email = userData?.user?.email?.toLowerCase();

  if (userError || !email) throw new Error('Sesi admin tidak valid.');

  const { data: roleData, error: roleError } = await adminClient
    .from('admin_roles')
    .select('email, project')
    .ilike('email', email)
    .maybeSingle();

  const role = roleData as AdminRole | null;
  if (roleError || !role) throw new Error('Email ini tidak punya akses admin.');
  if (role.project !== 'all' && role.project !== project) {
    throw new Error('Admin tidak punya akses publish project ini.');
  }

  return { adminClient, actorEmail: email, role };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const project = String(body.project || '').trim();
    const { adminClient, actorEmail } = await assertAdmin(req.headers.get('Authorization') || '', project);

    const { data: draftProfile, error: profileError } = await adminClient
      .from('project_profile_drafts')
      .select('*')
      .eq('project_key', project)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!draftProfile) throw new Error('Draft profil project belum tersedia.');

    const publishedAt = new Date().toISOString();
    const { error: upsertProfileError } = await adminClient
      .from('project_profiles')
      .upsert({
        project_key: project,
        vision: draftProfile.vision,
        missions: draftProfile.missions || [],
        agenda: draftProfile.agenda || [],
        join_enabled: draftProfile.join_enabled !== false,
        financial_note: draftProfile.financial_note || '',
        profile_visible: draftProfile.profile_visible !== false,
        contributions_visible: draftProfile.contributions_visible !== false,
        team: draftProfile.team || [],
        contributions: draftProfile.contributions || [],
        updated_at: publishedAt,
      }, { onConflict: 'project_key' });

    if (upsertProfileError) throw upsertProfileError;

    const { data: draftTransactions, error: draftTxError } = await adminClient
      .from('transaction_drafts')
      .select('*')
      .eq('project', project)
      .order('date', { ascending: true });

    if (draftTxError) throw draftTxError;

    const { error: deleteTxError } = await adminClient
      .from('transactions')
      .delete()
      .eq('project', project);

    if (deleteTxError) throw deleteTxError;

    if (draftTransactions?.length) {
      const rows = draftTransactions.map((row: Record<string, unknown>) => ({
        id: row.id,
        project: row.project,
        date: row.date,
        type: row.type,
        description: row.description,
        amount: row.amount,
        category: row.category,
        note: row.note,
        source_import_id: row.source_import_id,
        berat_kg: row.berat_kg,
        tanggal: row.tanggal,
        jenis: row.jenis,
        uraian: row.uraian,
        nominal: row.nominal,
        catatan: row.catatan,
        created_at: row.created_at,
      }));
      const { error: insertTxError } = await adminClient.from('transactions').insert(rows);
      if (insertTxError) throw insertTxError;
    }

    await adminClient
      .from('project_profile_drafts')
      .update({ published_at: publishedAt })
      .eq('project_key', project);

    await adminClient.from('admin_activity_logs').insert({
      actor_email: actorEmail,
      project,
      action: 'project_published',
      description: `Publish perubahan project ${project}.`,
      metadata: { project, transaction_count: draftTransactions?.length || 0 },
    });

    return jsonResponse({
      ok: true,
      project,
      publishedAt,
      transactionCount: draftTransactions?.length || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal publish project.';
    return jsonResponse({ error: message });
  }
});
