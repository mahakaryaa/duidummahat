alter table public.project_profiles
  add column if not exists profile_visible boolean not null default true,
  add column if not exists contributions_visible boolean not null default true;
