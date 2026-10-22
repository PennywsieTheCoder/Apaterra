-- Run once in the Supabase SQL Editor to enable per-user product favorites.

create table if not exists public.product_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists product_favorites_user_created_idx
on public.product_favorites (user_id, created_at desc);

alter table public.product_favorites enable row level security;

revoke all on public.product_favorites from anon;
grant select, insert, delete on public.product_favorites to authenticated;

drop policy if exists "Users can view their favorites" on public.product_favorites;
create policy "Users can view their favorites"
on public.product_favorites for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can add their favorites" on public.product_favorites;
create policy "Users can add their favorites"
on public.product_favorites for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can remove their favorites" on public.product_favorites;
create policy "Users can remove their favorites"
on public.product_favorites for delete to authenticated
using (user_id = auth.uid());
