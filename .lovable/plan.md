# Kichana — Path to "best beauty marketplace on the planet"

Phased plan. You approve each phase before I start it. Nothing ships in this message — this is the map.

## Guiding principles (apply to every phase)
- Mobile-first stays, but every screen gets a real desktop layout (≥1024px) — multi-column, denser, more content visible.
- Role-aware shell: customers see Discover / Bookings / Feed / Vault / Me. Stylists see Today / Calendar / Clients / Marketing / Earnings / Studio. Role detected from `profiles.role` + `stylists` row.
- Promotions = "Both" model: birthday/anniversary auto-fire on vendor preset, flash/event/seasonal campaigns surface as one-tap drafts the vendor approves.
- Customer marketing = opt-in only *after* first completed booking, per-stylist toggle. Default OFF. Stored in a new `marketing_consents` table.
- Analytics depth = essentials + cohort/retention (new vs returning, repeat rate, no-show %, LTV, busiest hours heatmap, service margin).
- Research baked in: StyleSeat (portfolio-led discovery, instant rebook), Booksy (waitlist, no-show fee, loyalty stamps), Fresha (free pro tools, marketing automation), Treatwell (last-minute deals, gifting), GlamSquad (live ETA, surge), Square Appointments (client notes, deposits), Airbnb (Superhost-style tier, response rate), Shopify Email (templated campaigns, segments).

---

## Phase 1 — Responsive shell + Discover overhaul + Feed bigger on desktop
Goal: make the app feel like a real product on a 1440px laptop without breaking mobile.

- Introduce a responsive `AppShell`: BottomNav on `<lg`, left SideNav on `≥lg`. Content area widens to `max-w-7xl` on desktop.
- `Home` feed: 1 col mobile, 2 col tablet, 3 col desktop masonry. Bigger imagery, sticky right rail with "Trending stylists" + "Book again".
- `Discover` rebuild:
  - Desktop: split view — filters left rail, results grid centre (3–4 col cards), map right rail (sticky, syncs to results).
  - Filters (organised in collapsible groups): **Service** (category, sub-service, hair type, length), **Price** (range slider, deposit %), **Location** (area, radius, travels to me), **Availability** (today, tomorrow, weekend, specific date+time), **Trust** (verified, Superstylist, ≥4.7★, ≥50 completed), **Experience** (years), **Language** (EN/SW), **Vibe** (kid-friendly, quiet, music, wheelchair access).
  - Saved filter sets ("My Saturday braids"). URL-synced so filters are shareable.
  - Sort: relevance, rating, nearest, next-available, price low→high.
- `StylistCard` desktop variant: portfolio image hero (4:5), face as 32px chip overlay, trust stack (verified · 4.9 (213) · 92% repeat · responds <1h), next-available pill ("Today 3pm").
- Smaller cards on mobile stay; desktop cards get more breathing room.

Risk/scope: medium. ~1 day equivalent diff. No DB changes.

---

## Phase 2 — Stylist Studio: services, pricing, portfolio, profile (the gap you flagged)
Goal: a stylist can fully run their storefront natively — no admin, no support ticket.

New `/studio` becomes a real workspace with sub-tabs:

- **Profile**: display name, bio, years exp, languages, specialties (multi-select chips), service areas, travels toggle + transport fee, deposit %, buffer minutes, cover image picker.
- **Services**: CRUD list. Each service: name, category, sub-category, description, duration, price, deposit override, hair-type tags, up to 5 reference images, active toggle, "intro offer for new clients" toggle (auto-applies 15% for first-time bookings).
- **Portfolio**: grid manager. Upload to `portfolio` bucket. Drag-reorder. Mark one as "cover" → drives `StylistCard` hero. Tag each piece with the service it represents so it auto-links from the service detail.
- **Availability**: weekly recurring schedule + date overrides + blocked slots. Feeds the existing `get_available_slots` function.
- **Policies**: cancellation window, no-show fee (uses existing deposit), late grace, kid-friendly toggle, etc.

DB additions (Phase 2 migration):
- `services`: add `subcategory`, `deposit_override`, `hair_type_tags text[]`, `intro_offer_active boolean`, `intro_offer_percent int`.
- `portfolio_images`: add `service_id uuid null`, `is_cover boolean`, `sort_order int`, `caption text`.
- New `stylist_availability` (weekly rules) + `stylist_schedule_overrides` (date-specific).
- New `stylist_policies` (1:1 with stylists).

Storage: confirm `portfolio` bucket policies allow stylist-owned writes (already public read).

Risk/scope: large. Highest leverage for vendors.

---

## Phase 3 — Vendor Business Suite: Today, Calendar, Inbox, Earnings, Analytics
Goal: stylists open the app and instantly see money, schedule, and what to do next.

- **Today**: next appointment with client photo + service + prep notes, day timeline, quick actions (mark complete, message, no-show), today's revenue.
- **Calendar**: week/month view, drag to reschedule (respects buffer + conflicts via existing `check_booking_conflict`), block time, recurring blocks.
- **Inbox**: existing messages, threaded by client, photo upload in-chat, quick replies, unread badge.
- **Earnings**: this week / month / all-time, pending payouts, completed payouts, transaction list with M-PESA receipt, downloadable CSV.
- **Analytics (essentials + cohort/retention)**:
  - Revenue trend, bookings trend, AOV, completion rate.
  - Top services by revenue + by volume.
  - New vs returning customers (stacked bars).
  - Repeat-rate cohort table (Jan cohort returned by month).
  - No-show & cancellation rate.
  - Busiest hours/days heatmap.
  - Customer LTV (avg + top 10 list).
  - Service-level margin (price − transport − platform fee).

DB additions:
- View `v_stylist_earnings_daily`, `v_stylist_cohort_retention`, `v_stylist_service_performance` (security-definer functions to avoid client RLS gymnastics).
- `bookings`: add `completed_at`, `no_show boolean`, `cancellation_reason`.

Risk/scope: large. Mostly read-side, so safer than Phase 2.

---

## Phase 4 — Customer CRM + AI-suggested Promotions Engine
Goal: vendors retain customers automatically; customers get relevant offers, never spam.

**Clients (CRM)** tab in Studio:
- List of every customer who has booked, with: lifetime spend, visit count, last visit, next booking, preferred services, birthday (if shared), allergies/hair notes, marketing-consent status.
- Per-client view: full booking history, private stylist notes, photos from past visits, "Send offer" button.
- Segments (auto-computed): New (1 booking), Regular (2–4), VIP (5+), Lapsed (no visit in 60d), Birthday this month.

**Promotions engine**:
- **Auto-fire (vendor presets once)**: Birthday (X% off, 7 days before), Anniversary of first visit, Win-back at day 45 of no booking. Vendor sets discount + message template, system handles the rest.
- **Vendor-approves drafts** (we generate, they tap Send): Mother's Day, Valentine's, Eid, Christmas, Jamhuri Day, school holidays, slow-day flash sale (auto-detected from their calendar gaps), "New client 15% off" pinned campaign.
- Suggestion engine reads each stylist's calendar gaps, top services, segment sizes, and the events calendar to produce 3 ranked campaign cards each week with expected revenue lift.
- Sends via in-app notification + (later) WhatsApp/SMS. Phase 4 = in-app only; WhatsApp deferred to Phase 5+.

**Customer-side consent**:
- New `marketing_consents` table: `customer_id`, `stylist_id`, `channel`, `granted_at`, `revoked_at`.
- After first **completed** booking, customer sees one prompt: "Allow {Stylist} to send you offers?" Yes/No. Editable from Profile → Notifications.
- Vendor's CRM only shows opted-in customers in the "Send offer" flow; the rest are visible for service delivery but greyed out for marketing.

**Offers table**: `offers` (stylist_id, type, code, percent_off or amount_off, applies_to service_ids[], min_spend, starts_at, ends_at, max_redemptions, used_count). Applied at booking checkout.

DB additions: `marketing_consents`, `offers`, `offer_redemptions`, `client_notes`, `client_tags`. RLS: stylist sees own clients via bookings join; customers see own consents + own redemptions.

Risk/scope: large. Most strategically valuable phase for retention.

---

## Phase 5 — Customer-side polish + retention loops
Goal: turn the customer app from a search tool into a habit.

- **Book again** one-tap on every past booking (pre-fills service + stylist, picks next slot).
- **Waitlist** for fully-booked stylists; auto-notify on cancellation.
- **Last-minute deals** feed (stylists with same-day gaps offering ≥15% off).
- **Loyalty stamps**: 5th visit with same stylist = free add-on (vendor opts in).
- **Gift vouchers**: customer buys credit for a friend, paid via M-PESA.
- **Reviews**: mandatory post-completion prompt (1-tap stars + optional photo + comment). Stylists can reply.
- **Live ETA** for home calls (stylist taps "On my way" → customer sees timer; map later).
- **Vault** upgrades: organise into boards, "Match me to a stylist who can do this look".
- **Referrals**: customer shares code → both get KES 200 off next booking.

DB additions: `waitlist_entries`, `loyalty_stamps`, `gift_vouchers`, `referrals`, expand `reviews` with `photo_url`, `stylist_reply`.

---

## Technical notes (for the technical readers)
- Role-aware routing: introduce `useRole()` derived from `profile.role` + `stylists` row presence. `AppShell` swaps nav + default landing route per role.
- Desktop layouts via Tailwind `lg:` / `xl:` breakpoints; no new layout library.
- All vendor analytics views as Postgres functions with `security definer` + `where stylist.user_id = auth.uid()` guard, returning JSON the client renders with Recharts.
- Suggestion engine = scheduled edge function (`pg_cron` weekly) that writes ranked `campaign_suggestions` rows; UI just reads them.
- Offers applied at booking creation in an edge function (server-side validation; never trust client discount).
- All new tables get RLS + indexes on `stylist_id`, `customer_id`, `created_at`.

---

## What I need from you
Say **"go Phase 1"** and I build the responsive shell + Discover + bigger feed. We review, you approve, then I move to Phase 2. Or tell me to re-order phases (e.g. "Phase 2 first, I need the studio more than I need desktop polish") and I'll re-sequence.
