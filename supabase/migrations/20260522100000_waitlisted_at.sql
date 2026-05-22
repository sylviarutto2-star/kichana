-- Track when a signed-up user joined the pre-launch waitlist. Gates them
-- out of /home and /studio until we open the app to them.
alter table public.profiles
  add column if not exists waitlisted_at timestamptz;
