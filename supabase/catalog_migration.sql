-- Run this file once in the Supabase SQL Editor after supabase/catalog.sql.

create table public.catalog_settings (
  id text primary key,
  starter_catalog_imported boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.catalog_settings enable row level security;

grant select on public.catalog_settings to anon, authenticated;
grant insert, update on public.catalog_settings to authenticated;

create policy "Anyone can read catalogue settings"
on public.catalog_settings for select to anon, authenticated
using (true);

create policy "Admins can add catalogue settings"
on public.catalog_settings for insert to authenticated
with check (public.is_admin());

create policy "Admins can update catalogue settings"
on public.catalog_settings for update to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.catalog_settings (id, starter_catalog_imported)
values ('main', false)
on conflict (id) do nothing;
