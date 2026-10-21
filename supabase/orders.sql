-- Run this file once in the Supabase SQL Editor after schema.sql and catalog.sql.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text not null,
  region text not null,
  city text not null,
  address text not null,
  landmark text not null default '',
  notes text not null default '',
  payment_method text not null check (payment_method in ('momo', 'delivery')),
  status text not null default 'Confirmation pending'
    check (status in ('Confirmation pending', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled')),
  inventory_released boolean not null default false,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  type text not null default '',
  size text not null default '',
  image_url text not null default '',
  card_color text not null default '#d7d8d4',
  price numeric(10, 2) not null check (price >= 0),
  quantity integer not null check (quantity > 0)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.orders to authenticated;
grant update on public.orders to authenticated;
grant select on public.order_items to authenticated;

create policy "Customers can view their orders"
on public.orders for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Admins can update orders"
on public.orders for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Customers can view their order items"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders
    where public.orders.id = order_items.order_id
      and (public.orders.user_id = auth.uid() or public.is_admin())
  )
);

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

create trigger restore_stock_when_order_is_cancelled
before update of status on public.orders
for each row
execute function public.restore_stock_on_order_cancellation();

create or replace function public.place_order(
  p_customer jsonb,
  p_payment_method text,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_order public.orders;
  item jsonb;
  ordered_quantity integer;
  product_record public.products%rowtype;
  calculated_subtotal numeric(10, 2) := 0;
  new_reference text;
begin
  if p_payment_method not in ('momo', 'delivery') then
    raise exception 'Invalid payment method';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'An order must contain between 1 and 50 items';
  end if;

  if coalesce(trim(p_customer ->> 'first_name'), '') = ''
    or coalesce(trim(p_customer ->> 'last_name'), '') = ''
    or coalesce(trim(p_customer ->> 'email'), '') = ''
    or coalesce(trim(p_customer ->> 'phone'), '') = ''
    or coalesce(trim(p_customer ->> 'region'), '') = ''
    or coalesce(trim(p_customer ->> 'city'), '') = ''
    or coalesce(trim(p_customer ->> 'address'), '') = '' then
    raise exception 'Required customer details are missing';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as expanded(value)
    group by expanded.value ->> 'id'
    having count(*) > 1
  ) then
    raise exception 'Each product may only appear once in an order';
  end if;

  for item in
    select value
    from jsonb_array_elements(p_items)
    order by value ->> 'id'
  loop
    if coalesce(trim(item ->> 'id'), '') = ''
      or coalesce(item ->> 'quantity', '') !~ '^[1-9][0-9]*$' then
      raise exception 'Invalid order item';
    end if;

    ordered_quantity := (item ->> 'quantity')::integer;

    select * into product_record
    from public.products
    where id = item ->> 'id'
      and active = true
    for update;

    if not found then
      raise exception 'A product in your bag is no longer available';
    end if;

    if product_record.stock < ordered_quantity then
      raise exception '% only has % remaining in stock', product_record.name, product_record.stock;
    end if;

    calculated_subtotal := calculated_subtotal
      + (product_record.price * ordered_quantity);
  end loop;

  new_reference := 'APA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into public.orders (
    reference,
    user_id,
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    region,
    city,
    address,
    landmark,
    notes,
    payment_method,
    subtotal
  ) values (
    new_reference,
    auth.uid(),
    trim(p_customer ->> 'first_name'),
    trim(p_customer ->> 'last_name'),
    lower(trim(p_customer ->> 'email')),
    trim(p_customer ->> 'phone'),
    trim(p_customer ->> 'region'),
    trim(p_customer ->> 'city'),
    trim(p_customer ->> 'address'),
    coalesce(trim(p_customer ->> 'landmark'), ''),
    coalesce(trim(p_customer ->> 'notes'), ''),
    p_payment_method,
    calculated_subtotal
  ) returning * into new_order;

  for item in select value from jsonb_array_elements(p_items)
  loop
    ordered_quantity := (item ->> 'quantity')::integer;

    select * into product_record
    from public.products
    where id = item ->> 'id';

    insert into public.order_items (
      order_id, product_id, name, type, size, image_url, card_color, price, quantity
    ) values (
      new_order.id,
      product_record.id,
      product_record.name,
      product_record.type,
      product_record.size,
      product_record.image_url,
      product_record.card_color,
      product_record.price,
      ordered_quantity
    );

    update public.products
    set
      stock = stock - ordered_quantity,
      updated_at = now()
    where id = product_record.id;
  end loop;

  return new_order;
end;
$$;

revoke all on function public.place_order(jsonb, text, jsonb) from public;
revoke execute on function public.place_order(jsonb, text, jsonb) from anon;
grant execute on function public.place_order(jsonb, text, jsonb) to authenticated;
