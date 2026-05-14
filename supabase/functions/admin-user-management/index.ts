import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AdminRole = {
  email: string;
  project: string;
};

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

const assertSuperadmin = async (authHeader: string) => {
  if (!authHeader) throw new Error('Admin belum login.');

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
  if (roleError || !role || role.project !== 'all') {
    throw new Error('Hanya superadmin yang bisa mengatur password admin.');
  }

  return { adminClient, actorEmail: email };
};

const findUserByEmail = async (adminClient: ReturnType<typeof createClient>, email: string) => {
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
};

const normalizeEmail = (email: unknown) => String(email || '').trim().toLowerCase();
const normalizePassword = (password: unknown) => String(password || '');
const normalizeProject = (project: unknown) => String(project || '').trim();
const allowedProjects = new Set(['all', 'Resik', 'Hadeyya', 'Siyar', 'Haru']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const { adminClient, actorEmail } = await assertSuperadmin(authHeader);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);
    const project = normalizeProject(body.project);

    if (!['list_admins', 'upsert_admin', 'set_password'].includes(action)) {
      return jsonResponse({ error: 'Aksi tidak dikenal.' });
    }

    if (action === 'list_admins') {
      const { data, error } = await adminClient
        .from('admin_roles')
        .select('email, project')
        .order('email', { ascending: true });
      if (error) throw error;
      return jsonResponse({ ok: true, admins: data || [] });
    }

    if (!email || !email.includes('@')) {
      return jsonResponse({ error: 'Email admin tidak valid.' });
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password admin minimal 8 karakter.' });
    }

    if (action === 'upsert_admin' && !allowedProjects.has(project)) {
      return jsonResponse({ error: 'Project admin tidak valid.' });
    }

    const existingUser = await findUserByEmail(adminClient, email);
    if (existingUser) {
      const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password,
      });
      if (error) throw error;
    } else {
      const { error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
    }

    if (action === 'upsert_admin') {
      const { error } = await adminClient
        .from('admin_roles')
        .upsert({ email, project }, { onConflict: 'email' });
      if (error) throw error;
    }

    await adminClient.from('admin_activity_logs').insert({
      actor_email: actorEmail,
      project: action === 'upsert_admin' ? project : 'all',
      action: action === 'upsert_admin' ? 'admin_user_upserted' : 'admin_password_updated',
      description: action === 'upsert_admin'
        ? `Membuat atau memperbarui admin ${email} untuk akses ${project}.`
        : `Memperbarui password admin ${email}.`,
      metadata: { email, project: action === 'upsert_admin' ? project : null },
    });

    return jsonResponse({ ok: true, email, project: action === 'upsert_admin' ? project : undefined });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengatur admin.';
    return jsonResponse({ error: message });
  }
});
