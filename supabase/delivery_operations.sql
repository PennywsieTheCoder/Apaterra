-- Run after delivery_settings.sql in the Supabase SQL Editor.
-- Adds assignment and dispatch milestones for the admin delivery workflow.

alter table public.orders
  add column if not exists delivery_rider text not null default '',
  add column if not exists rider_assigned_at timestamptz,
  add column if not exists dispatched_at timestamptz,
  add column if not exists delivered_at timestamptz;

create or replace function public.track_order_delivery_milestones()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.delivery_rider is distinct from old.delivery_rider then
    new.delivery_rider := trim(coalesce(new.delivery_rider, ''));
    new.rider_assigned_at := case when new.delivery_rider = '' then null else now() end;
  end if;

  if new.status = 'Dispatched' and old.status is distinct from 'Dispatched' then
    new.dispatched_at := now();
  end if;

  if new.status = 'Delivered' and old.status is distinct from 'Delivered' then
    new.delivered_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists track_order_delivery_milestones on public.orders;
create trigger track_order_delivery_milestones
before update on public.orders
for each row
execute function public.track_order_delivery_milestones();
