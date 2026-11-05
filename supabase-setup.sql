-- Exécuter dans Supabase > SQL Editor, une seule fois.
create table if not exists public.properties (
 id text primary key,
 name text not null check (char_length(name) between 1 and 160),
 type text not null,
 area text not null,
 price numeric not null check (price >= 0),
 surface numeric not null check (surface >= 0),
 photo text not null default '',
 description text not null default ''
);
alter table public.properties enable row level security;
drop policy if exists "Everyone reads properties" on public.properties;
create policy "Everyone reads properties" on public.properties for select to anon, authenticated using (true);
-- Admins are manually allowlisted by their Supabase Auth user ID.
create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
drop policy if exists "Admins can insert properties" on public.properties;
drop policy if exists "Admins can update properties" on public.properties;
drop policy if exists "Admins can delete properties" on public.properties;
create policy "Admins can insert properties" on public.properties for insert to authenticated
 with check (exists(select 1 from public.admin_users where user_id=auth.uid()));
create policy "Admins can update properties" on public.properties for update to authenticated
 using (exists(select 1 from public.admin_users where user_id=auth.uid()))
 with check (exists(select 1 from public.admin_users where user_id=auth.uid()));
create policy "Admins can delete properties" on public.properties for delete to authenticated
 using (exists(select 1 from public.admin_users where user_id=auth.uid()));
-- Après création de ton utilisateur dans Authentication > Users :
-- insert into public.admin_users(user_id) values ('COLLER_ICI_UUID_ADMIN');
