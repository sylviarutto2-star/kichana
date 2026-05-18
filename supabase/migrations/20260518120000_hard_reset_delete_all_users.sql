-- Kichana — hard reset
-- Deletes every user account and all data derived from it.
--
-- public.profiles.id references auth.users(id) ON DELETE CASCADE, and every
-- other public table cascades from profiles/stylists, so removing the auth
-- users alone clears profiles, stylists, services, bookings, reviews, posts,
-- portfolio images, availability, promotions and the rest.

delete from auth.users;
