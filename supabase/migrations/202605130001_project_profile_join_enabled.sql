alter table public.project_profiles
  add column if not exists join_enabled boolean not null default true;
