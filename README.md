# Kichana

Hair, brilliantly booked. A Nairobi-first booking platform for hairstylists and the women who love them — with a community feed, Hair Vault, Paystack deposits, group bookings, and a stylist studio.

## Stack

- **Vite + React 18 + TypeScript** — fast, lean, no framework bloat.
- **Tailwind CSS** — custom Kichana design system (terracotta + cream + aubergine).
- **Supabase** — auth, Postgres + RLS, Storage (4 buckets), Edge Functions (Paystack).
- **TanStack Query**, **react-router**, **sonner**, **lucide-react**, **date-fns**.

## What's in here

### App surfaces
- `/` Landing — public marketing page
- `/auth` Sign up / sign in
- `/onboarding` Customer **or** stylist setup (multi-step)
- `/home` Community feed (hair posts, save to vault, jump to booking)
- `/discover` Browse stylists by Nairobi neighbourhood + service category
- `/stylist/:id` Stylist profile, services, portfolio, group-booking entry
- `/book/:stylistId` 3-step wizard (service → date/place → Paystack deposit)
- `/bookings` Customer's upcoming + past bookings
- `/vault` Saved hair inspirations (the "show your stylist exactly what you want" tool)
- `/profile` Customer profile (hair type, allergies — travels with every booking) + loyalty
- `/studio` Stylist dashboard: today's bookings, services manager, settings
- `/post` Upload a feed post (photos auto-expire after 90 days)
- `/group/:stylistId` Create a group booking + invite code

### Database (`supabase/migrations/20260509120000_kichana_v1.sql`)
- `profiles` (1:1 with `auth.users`, role + Nairobi area + language + loyalty + hair history)
- `stylists`, `services`, `availability_slots`
- `bookings` (Paystack deposit tracking)
- `reviews`, `portfolio_items` (verified after-service photos)
- `feed_posts` + `feed_reactions` + `feed_comments` (90-day TTL via `expires_at`)
- `vault_items`, `follows`
- `group_bookings`
- Storage buckets: `avatars`, `feed`, `portfolio`, `vault`
- Full RLS, plus a `prune_expired_feed_posts()` SQL function for the 90-day cleanup cron.

### Edge functions
- `paystack-initialize` — creates a Paystack transaction and returns the hosted-checkout URL. **Falls back to "simulated success" if `PAYSTACK_SECRET_KEY` isn't set**, so the app is fully usable end-to-end in dev without merchant credentials. Reads the deposit amount from the database, never from the client.
- `paystack-verify` — verifies a transaction by reference (called from the `/payment/callback` page) and confirms the booking.
- `paystack-webhook` — handles the `charge.success` webhook (HMAC-SHA512 signature verified) as an idempotent backstop to the verify call.

## Setup

### 1. Install
```bash
npm install
```

### 2. Apply the migration to Supabase
The project is already wired to your existing Supabase project via `.env`. Apply the migration in the SQL editor (or `supabase db push` if you have the CLI):

```bash
# from project root, with supabase CLI installed
supabase link --project-ref dpzdltvxgbwepxbjpqnz
supabase db push
```

### 3. Deploy edge functions
```bash
supabase functions deploy paystack-initialize
supabase functions deploy paystack-verify
supabase functions deploy paystack-webhook
```

### 4. Paystack (when ready to take real money)
1. Set the secret key as a Supabase function secret (use `sk_test_...` first, then `sk_live_...` to go live):
   ```
   PAYSTACK_SECRET_KEY
   ```
2. In the Paystack Dashboard → **Settings → API Keys & Webhooks**, set the Webhook URL to:
   ```
   https://dpzdltvxgbwepxbjpqnz.supabase.co/functions/v1/paystack-webhook
   ```
   Paystack has separate **Test** and **Live** webhook fields — set the Test one while using `sk_test_`, and the Live one before going live.

Until `PAYSTACK_SECRET_KEY` is set, the app silently falls back to **demo mode** (instant simulated success) so you can keep testing the full flow. Customers pay the deposit by M-Pesa or card on Paystack's hosted checkout.

### 5. Run
```bash
npm run dev   # http://localhost:8080
npm run build # production bundle
```

## Pre-launch demo data

When `stylists` is empty, the app shows curated demo stylists from `src/lib/demoData.ts` so first-time visitors don't see an empty marketplace. As soon as real stylists onboard via `/studio`, demo entries disappear automatically.

## Cron: prune expired feed posts

Schedule a daily call to `select public.prune_expired_feed_posts();` via Supabase scheduled functions or pg_cron. Storage objects under `feed/` for deleted posts can be cleaned by the same job (extend the SQL function with a Storage admin call when ready).

## Brand

- **Display:** Fraunces (warm modern serif)
- **Body:** Plus Jakarta Sans
- **Palette:** terracotta (`#C4663F`), cream (`#FBF6EE`), aubergine (`#3F2233`), gold (`#BC8A38`), sage (`#8FA486`)

## Roadmap (next sprints)

- WhatsApp Business API for booking confirmations and post-appointment review prompts (start the BSP approval today — it takes 7–14 days).
- Push notifications via Capacitor wrapper for the app stores.
- Stylist availability calendar (slot-based instead of generic time grid).
- Loyalty redemption flow (current loyalty is accumulating but not yet redeemable).
- Pre-appointment consultation form (auto-sent 48h before via WhatsApp).
- Kichana for Events (B2B group bookings).
