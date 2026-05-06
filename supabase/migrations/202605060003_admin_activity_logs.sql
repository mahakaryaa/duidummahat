create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  project text not null,
  action text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_at_idx
  on public.admin_activity_logs(created_at desc);

create index if not exists admin_activity_logs_actor_email_idx
  on public.admin_activity_logs(actor_email);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "Admins can insert activity logs" on public.admin_activity_logs;
create policy "Admins can insert activity logs"
  on public.admin_activity_logs
  for insert
  to authenticated
  with check (
    actor_email = auth.email()
    and exists (
      select 1
      from public.admin_roles ar
      where ar.email = auth.email()
    )
  );

drop policy if exists "Superadmins can read activity logs" on public.admin_activity_logs;
create policy "Superadmins can read activity logs"
  on public.admin_activity_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_roles ar
      where ar.email = auth.email()
        and ar.project = 'all'
    )
  );
