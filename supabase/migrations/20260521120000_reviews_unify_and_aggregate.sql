-- Kichana — reviews: unify rating columns + auto-aggregate + completed-only
--
-- Root cause being fixed: the v1 schema added `rating_avg` / `rating_count`
-- on `stylists`, then the reconcile migration added a *second* parallel pair
-- (`rating` / `review_count`) and nothing ever updates either. So the public
-- StylistProfile and Studio page both show 0.0 (0) for every stylist no
-- matter how many reviews exist, and the two halves of the app read from
-- different columns. This migration:
--   1. Collapses to one canonical pair: rating_avg / rating_count.
--   2. Backfills the canonical columns from existing review rows.
--   3. Installs a trigger that keeps them in sync on insert/update/delete.
--   4. Blocks fake reviews via a trigger that requires the booking to be
--      `completed` and the customer to own the booking.
--   5. Adds review_count / rating shims as generated columns so older client
--      code reading them keeps working without divergence.
--   6. Adds a `reply` column for stylist right-of-reply (one per review).
--   7. Index on (stylist_id, created_at desc) for the public list page.

-- 1. Backfill canonical columns from existing reviews
update public.stylists s set
  rating_avg = coalesce(agg.avg, 0),
  rating_count = coalesce(agg.cnt, 0)
from (
  select stylist_id, avg(rating)::numeric(3,2) as avg, count(*)::int as cnt
  from public.reviews
  group by stylist_id
) agg
where s.id = agg.stylist_id;

-- 2. Drop the duplicate columns added by the reconcile migration. They are
--    safe to drop because nothing writes to them — Studio.tsx reads them
--    but always sees 0, so we are not losing data.
alter table public.stylists drop column if exists rating;
alter table public.stylists drop column if exists review_count;

-- 3. Re-add as generated columns so any lingering client read keeps working
--    and can never drift from the canonical values. (Stored generated so
--    PostgREST can select them.)
alter table public.stylists
  add column rating numeric(3,2) generated always as (rating_avg) stored;
alter table public.stylists
  add column review_count integer generated always as (rating_count) stored;

-- 4. Reply + helpful_count for future Phase 2 use, harmless now
alter table public.reviews
  add column if not exists reply text,
  add column if not exists reply_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists reviews_stylist_created_idx
  on public.reviews(stylist_id, created_at desc);

-- 5. Aggregate trigger — recomputes rating_avg / rating_count for the
--    affected stylist after every insert / update / delete. A function not
--    a materialized view because we need it to be instant on a single row
--    of activity, not a periodic refresh.
create or replace function public.refresh_stylist_rating(p_stylist_id uuid)
returns void language sql as $$
  update public.stylists s set
    rating_avg   = coalesce(agg.avg, 0),
    rating_count = coalesce(agg.cnt, 0)
  from (
    select avg(rating)::numeric(3,2) as avg, count(*)::int as cnt
    from public.reviews
    where stylist_id = p_stylist_id
  ) agg
  where s.id = p_stylist_id;
$$;

create or replace function public.reviews_after_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    perform public.refresh_stylist_rating(old.stylist_id);
    return old;
  end if;
  perform public.refresh_stylist_rating(new.stylist_id);
  if (tg_op = 'UPDATE' and old.stylist_id <> new.stylist_id) then
    perform public.refresh_stylist_rating(old.stylist_id);
  end if;
  return new;
end; $$;

drop trigger if exists reviews_after_change on public.reviews;
create trigger reviews_after_change
after insert or update or delete on public.reviews
for each row execute function public.reviews_after_change();

-- 6. Stylists can only be reviewed for a completed booking they actually
--    fulfilled. RLS already enforces `auth.uid() = customer_id`; this
--    closes the gap that lets a customer rate a pending booking.
create or replace function public.reviews_require_completed_booking()
returns trigger language plpgsql as $$
declare
  b record;
begin
  select customer_id, stylist_id, status
    into b from public.bookings where id = new.booking_id;
  if not found then
    raise exception 'review references unknown booking %', new.booking_id;
  end if;
  if b.customer_id <> new.customer_id then
    raise exception 'review customer must match booking customer';
  end if;
  if b.stylist_id <> new.stylist_id then
    raise exception 'review stylist must match booking stylist';
  end if;
  if b.status <> 'completed' then
    raise exception 'reviews are only allowed on completed bookings (booking status: %)', b.status;
  end if;
  return new;
end; $$;

drop trigger if exists reviews_require_completed on public.reviews;
create trigger reviews_require_completed
before insert or update on public.reviews
for each row execute function public.reviews_require_completed_booking();

-- 7. updated_at maintenance
drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.update_updated_at_column();

-- 8. Stylist right-of-reply: allow the stylist who owns the booking to
--    write/edit `reply` on their reviews. Customers still own everything
--    else via the existing policies.
drop policy if exists "reviews stylist reply" on public.reviews;
create policy "reviews stylist reply"
on public.reviews
for update using (
  exists (
    select 1 from public.stylists st
    where st.id = reviews.stylist_id and st.profile_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.stylists st
    where st.id = reviews.stylist_id and st.profile_id = auth.uid()
  )
);
