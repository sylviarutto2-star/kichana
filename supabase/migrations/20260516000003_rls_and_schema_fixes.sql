-- 1. Safety: nullify orphaned group_id references before re-applying FK.
--    This prevents migration 20260516000002's FK constraint from failing on
--    a non-empty database that has dangling group_id values.
update public.bookings
set group_id = null
where group_id is not null
  and not exists (select 1 from public.group_bookings where id = bookings.group_id);

-- Re-apply FK idempotently (in case 20260516000002 failed earlier)
alter table public.bookings drop constraint if exists bookings_group_id_fkey;
alter table public.bookings
  add constraint bookings_group_id_fkey
  foreign key (group_id) references public.group_bookings(id) on delete set null;

-- 2. Fix bookings UPDATE RLS: the old combined policy allowed customers to
--    directly UPDATE payment_status/status, bypassing M-Pesa entirely.
--    Payment status updates for customers now happen exclusively through
--    the mpesa-stk and mpesa-callback Edge Functions (service role key).
--    Stylists still need UPDATE to mark bookings in_progress / completed.
drop policy if exists "bookings update participant" on public.bookings;

create policy "bookings stylist update" on public.bookings for update
  using (
    exists (
      select 1 from public.stylists s
      where s.id = bookings.stylist_id and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stylists s
      where s.id = bookings.stylist_id and s.profile_id = auth.uid()
    )
  );

-- 3. To enable automatic feed post pruning, run this once after enabling
--    the pg_cron extension in your Supabase dashboard (Paid plans only):
--
--    create extension if not exists pg_cron schema extensions;
--    select cron.schedule(
--      'prune-feed-posts',
--      '0 3 * * *',
--      $$select public.prune_expired_feed_posts()$$
--    );
--
--    On the free plan, trigger pruning manually or via a Supabase Edge
--    Function scheduled webhook instead.
