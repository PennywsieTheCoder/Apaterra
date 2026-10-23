-- Run after order_notifications.sql.
-- Lets signed-in users permanently remove only their own read notifications.

grant delete on public.notifications to authenticated;

drop policy if exists "Users can clear their read notifications" on public.notifications;
create policy "Users can clear their read notifications"
on public.notifications for delete to authenticated
using (
  user_id = auth.uid()
  and read_at is not null
);
