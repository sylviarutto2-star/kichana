-- Track the Daraja MerchantRequestID alongside the checkout/receipt id.
alter table public.bookings
  add column if not exists mpesa_merchant_request_id text;
