-- Run this file in the Supabase SQL Editor after orders.sql.
-- Creates in-app notifications for new orders and customer status updates.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  kind text not null check (kind in ('order_received', 'new_order', 'order_status')),
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

revoke all on public.notifications from anon;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "Users can view their notifications" on public.notifications;
create policy "Users can view their notifications"
on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can mark their notifications as read" on public.notifications;
create policy "Users can mark their notifications as read"
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, order_id, kind, title, message)
  select
    role_record.user_id,
    new.id,
    'new_order',
    'New order ' || new.reference,
    new.customer_first_name || ' ' || new.customer_last_name || ' placed an order worth GH₵' || trim(to_char(new.subtotal, 'FM999999990.00')) || '.'
  from public.user_roles as role_record
  where role_record.role = 'admin';

  if new.user_id is not null then
    insert into public.notifications (user_id, order_id, kind, title, message)
    values (
      new.user_id,
      new.id,
      'order_received',
      'Order ' || new.reference || ' received',
      'Your order request is confirmed and awaiting preparation.'
    );
  end if;

  return new;
end;
$$;

create or replace function public.notify_order_status_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  status_message text;
begin
  if new.status = old.status or new.user_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = new.user_id and order_alerts = true
  ) then
    return new;
  end if;

  status_message := case new.status
    when 'Preparing' then 'Your order is now being prepared.'
    when 'Dispatched' then 'Your order has been dispatched and is on its way.'
    when 'Delivered' then 'Your order has been marked as delivered.'
    when 'Cancelled' then 'Your order was cancelled. Reserved items have been returned to stock.'
    else 'Your order status changed to ' || new.status || '.'
  end;

  insert into public.notifications (user_id, order_id, kind, title, message)
  values (
    new.user_id,
    new.id,
    'order_status',
    'Order ' || new.reference || ': ' || new.status,
    status_message
  );

  return new;
end;
$$;

drop trigger if exists notify_when_order_is_created on public.orders;
create trigger notify_when_order_is_created
after insert on public.orders
for each row
execute function public.notify_order_created();

drop trigger if exists notify_when_order_status_changes on public.orders;
create trigger notify_when_order_status_changes
after update of status on public.orders
for each row
execute function public.notify_order_status_changed();
