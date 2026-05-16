-- 1. Index on bookings.mpesa_receipt so the callback lookup isn't a full table scan
create index if not exists bookings_mpesa_receipt_idx
  on public.bookings(mpesa_receipt)
  where mpesa_receipt is not null;

-- 2. Foreign key on bookings.group_id to prevent orphaned/junk references
alter table public.bookings
  add constraint bookings_group_id_fkey
  foreign key (group_id) references public.group_bookings(id) on delete set null;

-- 3. Restrict group_bookings read to authenticated users only (was using (true),
--    which let unauthenticated requests enumerate all invite codes via the anon key)
drop policy if exists "group public read" on public.group_bookings;
create policy "group public read" on public.group_bookings
  for select to authenticated using (true);
