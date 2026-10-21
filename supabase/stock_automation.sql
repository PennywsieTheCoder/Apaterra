-- Run this file in the Supabase SQL Editor to enable transactional stock
-- validation and deduction for both guest and signed-in checkout.

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

  -- Lock every requested product while validating it. Concurrent checkouts
  -- therefore cannot both purchase the same final unit.
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
