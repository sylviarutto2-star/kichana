alter table public.bookings
  add column if not exists paystack_reference text;
