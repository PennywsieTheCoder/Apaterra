-- Run this once in the Supabase SQL Editor after schema.sql.
-- It adds private profile avatars and a safe newsletter sign-up endpoint.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view profile avatars" on storage.objects;
drop policy if exists "Users can view their profile avatar" on storage.objects;
create policy "Users can view their profile avatar"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can upload their profile avatar" on storage.objects;
create policy "Users can upload their profile avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Convert previously stored public avatar URLs to private object paths.
update public.profiles
set photo_url = regexp_replace(
  regexp_replace(photo_url, '^.*/profile-avatars/', ''),
  '\?.*$',
  ''
)
where photo_url like '%/profile-avatars/%';

drop policy if exists "Users can replace their profile avatar" on storage.objects;
create policy "Users can replace their profile avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'footer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;

create or replace function public.subscribe_to_newsletter(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
begin
  if normalized_email = ''
    or length(normalized_email) > 254
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address';
  end if;

  insert into public.newsletter_subscribers (email, status, source)
  values (normalized_email, 'subscribed', 'footer')
  on conflict (email) do update set
    status = 'subscribed',
    source = 'footer',
    updated_at = now();
end;
$$;

revoke all on function public.subscribe_to_newsletter(text) from public;
grant execute on function public.subscribe_to_newsletter(text) to anon, authenticated;
