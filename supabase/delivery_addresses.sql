-- Run this in the Supabase SQL Editor after schema.sql.
-- It adds customer-managed saved delivery addresses.

create table if not exists public.delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Delivery address',
  recipient_name text not null default '',
  phone text not null default '',
  region text not null default '',
  city text not null default '',
  address text not null default '',
  landmark text not null default '',
  postal_code text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_addresses_user_id_idx
on public.delivery_addresses (user_id, is_default desc, created_at asc);

alter table public.delivery_addresses enable row level security;
revoke all on public.delivery_addresses from anon;
grant select, insert, update, delete on public.delivery_addresses to authenticated;

drop policy if exists "Users can manage their delivery addresses" on public.delivery_addresses;
create policy "Users can manage their delivery addresses"
on public.delivery_addresses for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Keep existing profile delivery data available as a first saved address.
insert into public.delivery_addresses (
  user_id, label, recipient_name, phone, region, city, address, postal_code, is_default
)
select
  p.id,
  'Home',
  trim(concat_ws(' ', p.first_name, p.last_name)),
  p.phone,
  p.region,
  p.city,
  p.address,
  p.postal_code,
  true
from public.profiles p
where p.address <> ''
  and not exists (
    select 1 from public.delivery_addresses a where a.user_id = p.id
  );
