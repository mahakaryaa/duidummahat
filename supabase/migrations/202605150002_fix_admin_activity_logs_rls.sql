drop policy if exists "Admins can insert activity logs" on public.admin_activity_logs;
create policy "Admins can insert activity logs"
  on public.admin_activity_logs
  for insert
  to authenticated
  with check (
    lower(actor_email) = lower(coalesce(auth.email(), ''))
    and exists (
      select 1
      from public.admin_roles ar
      where lower(ar.email) = lower(coalesce(auth.email(), ''))
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
      where lower(ar.email) = lower(coalesce(auth.email(), ''))
        and ar.project = 'all'
    )
  );
