create table if not exists public.admin_roles (
  email text primary key,
  project text not null
);

delete from public.admin_roles
where lower(email) = 'poncokusumomaf@gmail.com';

insert into public.admin_roles (email, project)
values ('poncokusumomaf@gmail.com', 'all');
