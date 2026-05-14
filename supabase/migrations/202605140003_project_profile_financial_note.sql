alter table public.project_profiles
  add column if not exists financial_note text not null default '';
