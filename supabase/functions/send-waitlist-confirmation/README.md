# send-waitlist-confirmation

Sends a branded confirmation email when someone joins the Kichana waitlist
(`waitlist_customers` or `waitlist_stylists`). Called from
`src/pages/Waitlist.tsx` via `supabase.functions.invoke`.

## Setup (one-time)

1. **Verify the sender domain on Resend.** Sender is
   `Kichana <hello@kichana.co.ke>`. The `kichana.co.ke` domain must be
   verified in the Resend dashboard with the SPF + DKIM + DMARC DNS
   records they provide.
2. **Set the secret on the Supabase project:**
   ```sh
   supabase secrets set RESEND_API_KEY=re_xxx
   ```
   (or via the Supabase dashboard → Project Settings → Edge Functions →
   Secrets.)
3. **Deploy the function:**
   ```sh
   supabase functions deploy send-waitlist-confirmation
   ```

If `RESEND_API_KEY` is unset, the function returns
`{ ok: true, skipped: true }` and logs a notice — useful for dev and the
Vercel preview. No 500s, no email sent.

## Contract

Request body:
```json
{ "role": "customer" | "stylist", "email": "you@example.com", "full_name": "Wanjiku Mwangi" }
```

Response (200):
- `{ ok: true, id: "<resend-id>" }` on send
- `{ ok: true, skipped: true }` when the key isn't configured

Response (4xx/5xx) for validation or Resend failures. The caller in
`Waitlist.tsx` treats this as fire-and-forget — the waitlist insert
already succeeded, so a failed email never blocks the success UI.

## Templates

Subject lines and bodies live in `templates.ts`. Customer template leads
with the 10%-off framing; stylist template leads with the launch offer
(0% commission 30 days + featured launch + Instagram feature). Voice
rules: see `docs/voice.md` — no emoji, confident not cute, direct.

## Rotating the key

If the key is ever exposed (e.g. shared in a chat transcript), rotate
immediately in Resend and re-run `supabase secrets set RESEND_API_KEY=...`.
The function picks up the new value on the next cold start.
