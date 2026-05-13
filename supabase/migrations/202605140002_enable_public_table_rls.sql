create or replace function public.current_admin_project()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ar.project
  from public.admin_roles ar
  where lower(ar.email) = lower(coalesce(auth.email(), ''))
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'authenticated'
    and public.current_admin_project() is not null
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_project() = 'all'
$$;

create or replace function public.can_manage_project(project_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    and (
      public.current_admin_project() = 'all'
      or lower(public.current_admin_project()) = lower(coalesce(project_key, ''))
    )
$$;

create or replace function public.get_my_admin_role()
returns table(email text, project text)
language sql
stable
security definer
set search_path = public
as $$
  select ar.email, ar.project
  from public.admin_roles ar
  where lower(ar.email) = lower(coalesce(auth.email(), ''))
  limit 1
$$;

create table if not exists public.admin_roles (
  email text primary key,
  project text not null
);

update public.admin_roles
set project = 'all'
where lower(email) in (
  'harimau.jawaaa@gmail.com',
  'harimau.jawi@gmail.com',
  'poncokusumomaf@gmail.com'
);

insert into public.admin_roles (email, project)
select email, 'all'
from (
  values
    ('harimau.jawaaa@gmail.com'),
    ('harimau.jawi@gmail.com'),
    ('poncokusumomaf@gmail.com')
) as superadmins(email)
where not exists (
  select 1
  from public.admin_roles ar
  where lower(ar.email) = superadmins.email
);

alter table public.admin_roles enable row level security;
alter table public.project_profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.volunteers enable row level security;

drop policy if exists "Admins can read own role and superadmins can read all roles" on public.admin_roles;
create policy "Admins can read own role and superadmins can read all roles"
  on public.admin_roles
  for select
  to authenticated
  using (
    lower(email) = lower(auth.email())
    or public.is_superadmin()
  );

drop policy if exists "Superadmins can insert admin roles" on public.admin_roles;
create policy "Superadmins can insert admin roles"
  on public.admin_roles
  for insert
  to authenticated
  with check (public.is_superadmin());

drop policy if exists "Superadmins can update admin roles" on public.admin_roles;
create policy "Superadmins can update admin roles"
  on public.admin_roles
  for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

drop policy if exists "Superadmins can delete admin roles" on public.admin_roles;
create policy "Superadmins can delete admin roles"
  on public.admin_roles
  for delete
  to authenticated
  using (public.is_superadmin());

drop policy if exists "Public can read project profiles" on public.project_profiles;
create policy "Public can read project profiles"
  on public.project_profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage assigned project profiles" on public.project_profiles;
create policy "Admins can manage assigned project profiles"
  on public.project_profiles
  for all
  to authenticated
  using (public.can_manage_project(project_key))
  with check (public.can_manage_project(project_key));

drop policy if exists "Public can read transactions" on public.transactions;
create policy "Public can read transactions"
  on public.transactions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage assigned project transactions" on public.transactions;
create policy "Admins can manage assigned project transactions"
  on public.transactions
  for all
  to authenticated
  using (public.can_manage_project(project))
  with check (public.can_manage_project(project));

drop policy if exists "Public can submit volunteer applications" on public.volunteers;
create policy "Public can submit volunteer applications"
  on public.volunteers
  for insert
  to anon, authenticated
  with check (project in ('Resik', 'Hadeyya', 'Siyar', 'Haru'));

drop policy if exists "Admins can read assigned project volunteers" on public.volunteers;
create policy "Admins can read assigned project volunteers"
  on public.volunteers
  for select
  to authenticated
  using (public.can_manage_project(project));

drop policy if exists "Admins can manage assigned project volunteers" on public.volunteers;
create policy "Admins can manage assigned project volunteers"
  on public.volunteers
  for update
  to authenticated
  using (public.can_manage_project(project))
  with check (public.can_manage_project(project));

drop policy if exists "Admins can delete assigned project volunteers" on public.volunteers;
create policy "Admins can delete assigned project volunteers"
  on public.volunteers
  for delete
  to authenticated
  using (public.can_manage_project(project));
