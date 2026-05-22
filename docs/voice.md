# Kichana — Voice & Tone

The contract for every user-facing string in the app. Hold copy against this
before shipping.

## Six rules

1. **Confident, not cute.** No "babe", "gorgeous", "girlies", "girlie".
   Save the warmth for the manifesto on Auth and About — never in product
   chrome (buttons, toasts, errors, empty states).
2. **Plain English, with one signature move.** The "quiet agreement between
   women" framing on the deposit step (`src/pages/Booking.tsx`) is the
   signature. Don't sprinkle that voice elsewhere or it stops landing.
3. **Tell people what to do.** Empty states show the next action, not
   feelings. "No bookings yet — find a stylist" beats "Your next look is
   waiting".
4. **One emoji, used once.** The single sanctioned emoji is 💛 on the
   post-payment success screen (`PaymentCallback.tsx`). Everywhere else:
   zero emoji in product copy. The 🇰🇪 country mark in the Footer is
   considered an attribution, not an emoji, and is permitted there only.
5. **Gender-inclusive for providers.** Stylists/barbers are referred to by
   name or with "they". Never default to "she/her" — the platform supports
   barbers and non-binary providers. The customer community we're championing
   is women; the labour pool is everyone.
6. **Localise for Nairobi, not for Brooklyn.** Kiswahili greetings on Home
   are earned warmth. "Babe/gorgeous/girls" is American-millennial English
   and reads imported.

## Reference brands (execution quality, not aesthetics)

- **Glossier** — confident insider, plain product copy, warmth in manifesto.
- **Bumble** — declarative, empowering, slightly formal.
- **Airbnb** — clean infrastructural language.
- **Linear / Stripe** — surgical precision.
- **Reformation** — dry, never sentimental.

The pattern across all of them: **intimacy lives in marketing; restraint
lives in product chrome.**

## Quick check before shipping copy

- [ ] No "babe", "gorgeous", "girlies", "girlie", "the girls/girlie", "your girl"
- [ ] No emoji except 💛 on the payment success screen (and 🇰🇪 in Footer)
- [ ] No "she/her" defaults for stylists — use the display name or "they"
- [ ] Empty states name the next action, not the feeling
- [ ] Headings are direct ("Set up your studio") not motivational
  ("Let's open your studio")

## Protected copy — do not change

- `src/pages/Booking.tsx:253` — deposit explanation paragraph. The
  signature line of the brand.
- `src/pages/Auth.tsx` — "Built by women, for women." manifesto line.
- `src/pages/Home.tsx` — Swahili greetings (`Habari ya asubuhi/mchana/jioni`).
- `src/pages/Landing.tsx` — "Hair, brilliantly booked." hero.
