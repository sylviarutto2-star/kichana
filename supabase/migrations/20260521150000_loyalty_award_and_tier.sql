-- Kichana — loyalty: actually award points and compute tiers
--
-- Root cause: profiles.loyalty_points existed but nothing ever
-- incremented it, and customers had no tier at all (loyalty_tier was
-- only on stylists, where it actually means commission band — different
-- concept). FAQ promised "1 point per KES 100 spent" but it was vapour.
--
-- This:
--   1. Adds profiles.loyalty_tier with the same enum the stylist side uses.
--   2. Defines tier breakpoints in one SQL function so the client can
--      mirror them safely.
--   3. Awards floor(amount_kes / 100) points to the customer when a
--      booking moves to status='completed', and recomputes their tier.
--      Idempotent via a check that old.status was not already 'completed'.

alter table public.profiles
  add column if not exists loyalty_tier text not null default 'bronze'
    check (loyalty_tier in ('bronze','silver','gold','platinum'));

create or replace function public.loyalty_tier_for_points(p int)
returns text language sql immutable as $$
  select case
    when p >= 500 then 'platinum'
    when p >= 200 then 'gold'
    when p >= 50  then 'silver'
    else 'bronze'
  end;
$$;

create or replace function public.award_loyalty_on_completion()
returns trigger language plpgsql as $$
declare
  awarded int;
  new_total int;
begin
  -- Only fire on the pending -> completed transition. Idempotent against
  -- successive UPDATEs that don't change status.
  if (old.status is distinct from new.status) and new.status = 'completed' then
    awarded := greatest(0, floor(coalesce(new.amount_kes, 0) / 100.0)::int);
    if awarded > 0 then
      update public.profiles
        set loyalty_points = coalesce(loyalty_points, 0) + awarded
        where id = new.customer_id
        returning loyalty_points into new_total;
      update public.profiles
        set loyalty_tier = public.loyalty_tier_for_points(new_total)
        where id = new.customer_id;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists bookings_award_loyalty on public.bookings;
create trigger bookings_award_loyalty
after update on public.bookings
for each row execute function public.award_loyalty_on_completion();

-- Backfill any already-completed bookings exactly once. Safe to re-run:
-- it resets every customer's points to the floor(sum/100) of their
-- completed bookings rather than incrementing.
with totals as (
  select customer_id, sum(floor(amount_kes / 100.0))::int as pts
  from public.bookings
  where status = 'completed'
  group by customer_id
)
update public.profiles p set
  loyalty_points = coalesce(t.pts, 0),
  loyalty_tier = public.loyalty_tier_for_points(coalesce(t.pts, 0))
from totals t
where p.id = t.customer_id;
