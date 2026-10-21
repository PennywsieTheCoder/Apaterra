-- Run once in the Supabase SQL Editor.
-- Browsing remains public; placing an order requires a signed-in customer.

revoke execute on function public.place_order(jsonb, text, jsonb) from anon;
grant execute on function public.place_order(jsonb, text, jsonb) to authenticated;
