-- Privacy-safe storefront funnel analytics.
-- Run once in the Supabase SQL Editor before enabling VITE_ENABLE_ANALYTICS.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in (
    'product_view',
    'add_to_cart',
    'favorite_added',
    'favorite_removed',
    'checkout_started',
    'checkout_failed',
    'order_completed'
  )),
  session_id text not null check (char_length(session_id) between 16 and 80),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  path text not null default '' check (char_length(path) <= 160),
  product_id text check (product_id is null or char_length(product_id) <= 120),
  metadata jsonb not null default '{}'::jsonb check (octet_length(metadata::text) <= 1024),
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_name_idx
on public.analytics_events (event_name, created_at desc);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;

drop policy if exists "Visitors can record safe analytics events" on public.analytics_events;
create policy "Visitors can record safe analytics events"
on public.analytics_events for insert to anon, authenticated
with check (user_id is not distinct from auth.uid());

drop policy if exists "Admins can view analytics events" on public.analytics_events;
create policy "Admins can view analytics events"
on public.analytics_events for select to authenticated
using (public.is_admin());
