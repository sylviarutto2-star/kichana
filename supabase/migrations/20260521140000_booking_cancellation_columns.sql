-- Kichana — booking cancellation audit columns
--
-- Root cause: when a booking moves to 'cancelled' or 'no_show' the app has
-- no idea WHEN that happened or WHO did it, so we can't render an honest
-- audit trail to either side. These two columns are additive and unblock
-- the customer-cancel + stylist-mark-no-show flows.

alter table public.bookings
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text check (cancelled_by in ('customer','stylist','system'));

create index if not exists bookings_cancelled_at_idx on public.bookings(cancelled_at);
