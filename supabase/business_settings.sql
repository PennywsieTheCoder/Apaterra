-- Public business contact details, maintained by administrators.
-- Run after schema.sql so public.is_admin() is available.

create table if not exists public.business_settings (
  id text primary key default 'main' check (id = 'main'),
  support_email text not null default '',
  support_phone text not null default '',
  whatsapp_number text not null default '',
  business_address text not null default '',
  operating_hours text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  youtube_url text not null default '',
  facebook_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id)
values ('main')
on conflict (id) do nothing;

alter table public.business_settings enable row level security;

grant select on public.business_settings to anon, authenticated;
grant insert, update on public.business_settings to authenticated;

drop policy if exists "Public can view business settings" on public.business_settings;
create policy "Public can view business settings"
on public.business_settings for select to anon, authenticated
using (id = 'main');

drop policy if exists "Admins can add business settings" on public.business_settings;
create policy "Admins can add business settings"
on public.business_settings for insert to authenticated
with check (id = 'main' and public.is_admin());

drop policy if exists "Admins can update business settings" on public.business_settings;
create policy "Admins can update business settings"
on public.business_settings for update to authenticated
using (id = 'main' and public.is_admin())
with check (id = 'main' and public.is_admin());
