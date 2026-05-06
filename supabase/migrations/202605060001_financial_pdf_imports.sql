create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  source_type text not null default 'pdf' check (source_type in ('pdf')),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'approved', 'failed')),
  raw_result_json jsonb,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table public.transactions
  add column if not exists source_import_id uuid references public.imports(id) on delete set null,
  add column if not exists berat_kg numeric,
  add column if not exists tanggal date,
  add column if not exists jenis text check (jenis is null or jenis in ('pemasukan', 'pengeluaran')),
  add column if not exists uraian text,
  add column if not exists nominal numeric,
  add column if not exists catatan text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists transactions_source_import_id_idx
  on public.transactions(source_import_id);

alter table public.imports enable row level security;

drop policy if exists "Admin can read imports" on public.imports;
create policy "Admin can read imports"
  on public.imports
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_roles ar
      where ar.email = auth.email()
    )
  );

drop policy if exists "Only service role can write imports" on public.imports;
create policy "Only service role can write imports"
  on public.imports
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
