create table if not exists public.admin_roles (
  email text primary key,
  project text not null
);

delete from public.admin_roles
where lower(email) in (
  'harimau.jawaaa@gmail.com',
  'harimau.jawi@gmail.com',
  'poncokusumomaf@gmail.com'
);

insert into public.admin_roles (email, project)
values
  ('harimau.jawaaa@gmail.com', 'all'),
  ('harimau.jawi@gmail.com', 'all'),
  ('poncokusumomaf@gmail.com', 'all');
