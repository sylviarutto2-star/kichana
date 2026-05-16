-- Enable Supabase Realtime for the bookings table so clients
-- can subscribe to postgres_changes for live payment-status updates.
alter publication supabase_realtime add table public.bookings;
