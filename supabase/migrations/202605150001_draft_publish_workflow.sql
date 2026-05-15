create table if not exists public.project_profile_drafts (
  project_key text primary key,
  vision text,
  missions jsonb,
  agenda jsonb,
  join_enabled boolean not null default true,
  financial_note text not null default '',
  profile_visible boolean not null default true,
  contributions_visible boolean not null default true,
  team jsonb,
  contributions jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.transaction_drafts (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  date date not null,
  type text not null,
  description text not null,
  amount numeric not null,
  category text,
  note text,
  source_import_id uuid references public.imports(id) on delete set null,
  berat_kg numeric,
  tanggal date,
  jenis text check (jenis is null or jenis in ('pemasukan', 'pengeluaran')),
  uraian text,
  nominal numeric,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.imports
  drop constraint if exists imports_source_type_check;

alter table public.imports
  add constraint imports_source_type_check check (source_type in ('pdf', 'image'));

insert into public.project_profile_drafts (
  project_key,
  vision,
  missions,
  agenda,
  join_enabled,
  financial_note,
  profile_visible,
  contributions_visible,
  team,
  contributions,
  updated_at,
  published_at
)
select
  project_key,
  vision,
  to_jsonb(coalesce(missions, array[]::text[])),
  to_jsonb(coalesce(agenda, array[]::text[])),
  join_enabled,
  coalesce(financial_note, ''),
  coalesce(profile_visible, true),
  coalesce(contributions_visible, true),
  team,
  contributions,
  coalesce(updated_at, now()),
  now()
from public.project_profiles
on conflict (project_key) do nothing;

insert into public.transaction_drafts (
  id,
  project,
  date,
  type,
  description,
  amount,
  category,
  note,
  source_import_id,
  berat_kg,
  tanggal,
  jenis,
  uraian,
  nominal,
  catatan,
  created_at,
  updated_at
)
select
  id,
  project,
  date,
  type,
  description,
  amount,
  category,
  note,
  source_import_id,
  berat_kg,
  tanggal,
  jenis,
  uraian,
  nominal,
  catatan,
  coalesce(created_at, now()),
  now()
from public.transactions
on conflict (id) do nothing;

create index if not exists transaction_drafts_project_date_idx
  on public.transaction_drafts(project, date desc);

alter table public.project_profile_drafts enable row level security;
alter table public.transaction_drafts enable row level security;

drop policy if exists "Admins can manage assigned project profile drafts" on public.project_profile_drafts;
create policy "Admins can manage assigned project profile drafts"
  on public.project_profile_drafts
  for all
  to authenticated
  using (public.can_manage_project(project_key))
  with check (public.can_manage_project(project_key));

drop policy if exists "Admins can manage assigned transaction drafts" on public.transaction_drafts;
create policy "Admins can manage assigned transaction drafts"
  on public.transaction_drafts
  for all
  to authenticated
  using (public.can_manage_project(project))
  with check (public.can_manage_project(project));
