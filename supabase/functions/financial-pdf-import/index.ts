import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_PROMPT = `Baca laporan keuangan dari PDF ini.

Tugasmu:
1. Ambil hanya baris yang benar-benar transaksi.
2. Abaikan judul, header tabel, footer, subtotal, total akhir, saldo berjalan, catatan periode, dan teks dekoratif.
3. Jika ada angka dengan satuan kg, masukkan ke field berat_kg, bukan nominal.
4. Jika ada angka saldo berjalan, jangan jadikan transaksi baru.
5. Tanggal wajib diubah ke format ISO YYYY-MM-DD.
6. Jika tanggal ambigu, beri status perlu_review.
7. Jika nominal tidak jelas, beri status perlu_review.
8. Jika baris bukan transaksi, masukkan ke ignored_rows dengan alasan.
9. Output harus JSON valid saja, tanpa penjelasan tambahan.

Format JSON:
{
  "summary": {
    "total_rows_detected": 0,
    "valid_transactions": 0,
    "need_review": 0,
    "ignored_rows": 0
  },
  "transactions": [
    {
      "tanggal": "YYYY-MM-DD",
      "jenis": "pemasukan/pengeluaran",
      "uraian": "...",
      "nominal": 0,
      "berat_kg": null,
      "catatan": "...",
      "confidence": 0.0,
      "status": "valid/perlu_review"
    }
  ],
  "ignored_rows": [
    {
      "raw_text": "...",
      "reason": "..."
    }
  ],
  "warnings": []
}`;

const DAILY_PROJECT_IMPORT_LIMIT = 1;

type AdminRole = {
  email: string;
  project: string;
};

type GeminiTransaction = {
  tanggal: string;
  jenis: 'pemasukan' | 'pengeluaran';
  uraian: string;
  nominal: number;
  berat_kg: number | null;
  catatan: string;
  confidence: number;
  status: 'valid' | 'perlu_review';
  review_acknowledged?: boolean;
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

const assertAdmin = async (authHeader: string, project: string): Promise<AdminRole> => {
  if (!authHeader) {
    throw new Error('Admin belum login.');
  }

  const { userClient, adminClient } = getSupabaseClients(authHeader);
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const email = userData?.user?.email?.toLowerCase();

  if (userError || !email) {
    throw new Error('Sesi admin tidak valid.');
  }

  const { data: roleData, error: roleError } = await adminClient
    .from('admin_roles')
    .select('email, project')
    .eq('email', email)
    .single();

  if (roleError || !roleData) {
    throw new Error('Email ini tidak punya akses admin.');
  }

  const role = roleData as AdminRole;
  if (role.project !== 'all' && role.project !== project) {
    throw new Error('Admin tidak punya akses ke project ini.');
  }

  return role;
};

const normalizeGeminiJson = (rawText: string) => {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned);
  const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
  const ignoredRows = Array.isArray(parsed.ignored_rows) ? parsed.ignored_rows : [];
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];

  const normalizedTransactions = transactions
    .map((item: Record<string, unknown>) => {
      const jenis = String(item.jenis || '').toLowerCase() === 'pengeluaran' ? 'pengeluaran' : 'pemasukan';
      const status = String(item.status || '').toLowerCase() === 'perlu_review' ? 'perlu_review' : 'valid';
      const nominal = Number(item.nominal || 0);
      const beratKgRaw = item.berat_kg;
      const beratKg = beratKgRaw === null || beratKgRaw === undefined || beratKgRaw === ''
        ? null
        : Number(beratKgRaw);

      return {
        tanggal: String(item.tanggal || ''),
        jenis,
        uraian: String(item.uraian || '').trim(),
        nominal: Number.isFinite(nominal) ? nominal : 0,
        berat_kg: Number.isFinite(beratKg as number) ? beratKg : null,
        catatan: String(item.catatan || 'Import dari PDF').trim(),
        confidence: typeof item.confidence === 'number' ? item.confidence : 0,
        status,
      };
    })
    .filter((item: GeminiTransaction) => item.status === 'perlu_review' || (item.uraian && item.nominal > 0));

  const summary = parsed.summary && typeof parsed.summary === 'object'
    ? parsed.summary
    : {
        total_rows_detected: normalizedTransactions.length + ignoredRows.length,
        valid_transactions: normalizedTransactions.filter((item: GeminiTransaction) => item.status === 'valid').length,
        need_review: normalizedTransactions.filter((item: GeminiTransaction) => item.status === 'perlu_review').length,
        ignored_rows: ignoredRows.length,
      };

  return {
    summary,
    transactions: normalizedTransactions,
    ignored_rows: ignoredRows,
    warnings,
  };
};

const callGemini = async (text: string) => {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum diset di Supabase Edge Function secrets.');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${GEMINI_PROMPT}\n\nTEKS PDF:\n${text}` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini gagal membaca PDF: ${message}`);
  }

  const payload = await response.json();
  const rawText = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();

  if (!rawText) {
    throw new Error('Gemini tidak mengembalikan JSON.');
  }

  return normalizeGeminiJson(rawText);
};

const handleParse = async (req: Request, body: Record<string, unknown>) => {
  const project = String(body.project || '');
  const fileName = String(body.fileName || 'import.pdf');
  const text = String(body.text || '');

  await assertAdmin(req.headers.get('Authorization') || '', project);
  const { adminClient } = getSupabaseClients(req.headers.get('Authorization') || '');

  if (!project || project === 'Semua') {
    throw new Error('Pilih project tertentu sebelum import PDF.');
  }
  if (!text.trim()) {
    throw new Error('PDF tidak berisi teks yang bisa dibaca.');
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: dailyProjectImportCount, error: countError } = await adminClient
    .from('imports')
    .select('id', { count: 'exact', head: true })
    .eq('source_type', 'pdf')
    .contains('raw_result_json', { project })
    .gte('created_at', dayAgo);

  if (countError) {
    throw new Error(countError.message);
  }
  if ((dailyProjectImportCount || 0) >= DAILY_PROJECT_IMPORT_LIMIT) {
    throw new Error(`Batas import PDF project ${project} sudah tercapai (${DAILY_PROJECT_IMPORT_LIMIT}x per hari). Coba lagi besok atau input manual.`);
  }

  const { data: importData, error: importError } = await adminClient
    .from('imports')
    .insert({
      file_name: fileName,
      source_type: 'pdf',
      status: 'draft',
      raw_result_json: { project },
    })
    .select('id')
    .single();

  if (importError) {
    throw new Error(importError.message);
  }

  try {
    const result = await callGemini(text);
    const { error: updateError } = await adminClient
      .from('imports')
      .update({ status: 'reviewed', raw_result_json: { ...result, project } })
      .eq('id', importData.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return jsonResponse({ importId: importData.id, result });
  } catch (err) {
    await adminClient
      .from('imports')
      .update({
        status: 'failed',
        raw_result_json: { error: err instanceof Error ? err.message : 'Gagal membaca PDF.' },
      })
      .eq('id', importData.id);
    throw err;
  }
};

const validateApproveRows = (rows: GeminiTransaction[]) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Pilih minimal satu transaksi valid untuk diinput.');
  }

  rows.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.tanggal || '')) {
      throw new Error(`Transaksi #${index + 1} belum punya tanggal valid.`);
    }
    if (!['pemasukan', 'pengeluaran'].includes(row.jenis)) {
      throw new Error(`Transaksi #${index + 1} punya jenis tidak valid.`);
    }
    if (!row.uraian?.trim()) {
      throw new Error(`Transaksi #${index + 1} belum punya uraian.`);
    }
    if (!Number.isFinite(Number(row.nominal)) || Number(row.nominal) <= 0) {
      throw new Error(`Transaksi #${index + 1} belum punya nominal valid.`);
    }
    if (row.status === 'perlu_review' && !row.review_acknowledged) {
      throw new Error(`Transaksi #${index + 1} perlu review dan belum dicentang manual.`);
    }
  });
};

const handleApprove = async (req: Request, body: Record<string, unknown>) => {
  const project = String(body.project || '');
  const importId = body.importId ? String(body.importId) : null;
  const rows = (Array.isArray(body.transactions) ? body.transactions : []) as GeminiTransaction[];

  await assertAdmin(req.headers.get('Authorization') || '', project);
  validateApproveRows(rows);

  const { adminClient } = getSupabaseClients(req.headers.get('Authorization') || '');
  const approvedRows = rows.map((row) => {
    const type = row.jenis === 'pengeluaran' ? 'Keluar' : 'Masuk';
    return {
      id: crypto.randomUUID(),
      project,
      date: row.tanggal,
      type,
      description: row.uraian.trim(),
      amount: Number(row.nominal),
      category: type === 'Masuk' ? 'Pemasukan' : 'Pengeluaran',
      note: row.catatan?.trim() || 'Import dari PDF',
      source_import_id: importId,
      berat_kg: row.berat_kg,
      tanggal: row.tanggal,
      jenis: row.jenis,
      uraian: row.uraian.trim(),
      nominal: Number(row.nominal),
      catatan: row.catatan?.trim() || 'Import dari PDF',
    };
  });

  const { data: insertedRows, error: insertError } = await adminClient
    .from('transactions')
    .insert(approvedRows)
    .select('*');

  if (insertError) {
    throw new Error(insertError.message);
  }

  if (importId) {
    await adminClient
      .from('imports')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', importId);
  }

  return jsonResponse({ transactions: insertedRows || [] });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'parse') return await handleParse(req, body);
    if (action === 'approve') return await handleApprove(req, body);

    return jsonResponse({ error: 'Action tidak dikenal.' }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan import PDF.';
    return jsonResponse({ error: message }, 400);
  }
});
