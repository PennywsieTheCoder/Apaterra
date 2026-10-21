-- Run this file once in the Supabase SQL Editor after supabase/schema.sql.

create table public.products (
  id text primary key,
  name text not null,
  type text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  size text not null,
  needs jsonb not null default '[]'::jsonb,
  badge text not null default 'New',
  image_url text not null,
  image_path text not null,
  description text not null,
  ingredients text not null default '',
  directions text not null default '',
  benefits jsonb not null default '[]'::jsonb,
  card_color text not null default '#d7d8d4',
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

create policy "Public can view active products"
on public.products for select to anon, authenticated
using (active = true);

create policy "Admins can view all products"
on public.products for select to authenticated
using (public.is_admin());

create policy "Admins can add products"
on public.products for insert to authenticated
with check (public.is_admin());

create policy "Admins can update products"
on public.products for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete products"
on public.products for delete to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Admins can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());
