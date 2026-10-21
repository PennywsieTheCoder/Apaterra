-- Run this file in the Supabase SQL Editor after stock_automation.sql.
-- Cancelling an order restores its stock exactly once and makes cancellation terminal.

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('Confirmation pending', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'));

alter table public.orders
  add column if not exists inventory_released boolean not null default false;

create or replace function public.restore_stock_on_order_cancellation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'Cancelled' and new.status <> 'Cancelled' then
    raise exception 'Cancelled orders cannot be reopened';
  end if;

  if new.status = 'Cancelled' and old.status <> 'Cancelled' then
    if not old.inventory_released then
      update public.products as product
      set
        stock = product.stock + cancelled_items.quantity,
        updated_at = now()
      from (
        select product_id, sum(quantity)::integer as quantity
        from public.order_items
        where order_id = old.id
        group by product_id
      ) as cancelled_items
      where product.id = cancelled_items.product_id;
    end if;

    new.inventory_released := true;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists restore_stock_when_order_is_cancelled on public.orders;

create trigger restore_stock_when_order_is_cancelled
before update of status on public.orders
for each row
execute function public.restore_stock_on_order_cancellation();
