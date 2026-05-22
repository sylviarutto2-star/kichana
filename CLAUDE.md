# Kichana — working agreement for Claude

This file is the contract between Claude and the maintainer. Read it before
doing anything else in this repo. It exists because past sessions wasted
the maintainer's money and shipped guess-fixes that didn't address root
causes. That stops here.

## Project at a glance

- Vite + React + TypeScript + Tailwind, deployed on Vercel.
- Auth, DB, and edge functions live in Supabase (project ref in `src/lib/supabase.ts`).
- Payments: Paystack (deposits), with legacy M-Pesa STK code paths.
- Main branch deploys to production automatically on merge.

## Voice & tone

Before writing any user-facing copy, read `docs/voice.md`. It's the contract
for every string in the app. Hard rules: no pet-names ("babe", "gorgeous",
"girlies"), no emoji except 💛 on the payment success screen, gender-neutral
for stylists, action-oriented empty states.

## Where the important things live

- Auth + profile loading: `src/contexts/AuthContext.tsx` — the single source
  of truth for session/profile state. Any "loading screen flashing" or
  "tab switch glitch" bug almost certainly lives here.
- Supabase client: `src/lib/supabase.ts`.
- Routing + auth gating: `src/App.tsx`.
- Database types: `src/lib/database.types.ts`.

## Working agreement (the non-negotiables)

1. **Don't spawn agents for known-file bugs.** If the symptom points to a
   specific file (e.g. anything auth-related → `AuthContext.tsx`), READ the
   file directly. Explore/Plan agents are for unknown-territory research,
   not for tasks where one Read call would answer the question. Agents
   burn the maintainer's tokens.

2. **No guessing.** Before proposing a fix, point to the exact file and
   line that causes the symptom. If you can't, say "I don't know yet" and
   keep reading. No "this might be it" commits.

3. **Fix the cause, not the symptom.** Watchdogs, timeouts, retries,
   fallbacks, and loading gates are band-aids. Every commit that adds one
   must explain in its message *what the underlying cause is* and *why a
   guard is the right shape of fix*. If you can't articulate that, the
   fix isn't ready.

4. **Verify before claiming done.** UI bugs are not fixed until someone
   has reproduced the original symptom and confirmed it no longer
   happens. If you can't test in a browser from your environment, say so
   explicitly and hand the maintainer plug-and-play repro steps.

5. **One commit, one root cause.** No "while I'm here" cleanups bundled
   into bug fixes. Regressions need to be bisectable.

6. **Own it.** When a previous attempt failed, lead with what was wrong
   and what changes, not with a defense.

## Repro pattern for "the app glitches / reloads"

1. Open DevTools → Network, filter for `profiles` (or whatever resource).
2. Switch to a different browser tab. Wait 5 seconds. Switch back.
3. If you see a new `profiles` request OR the loading screen flashes → the
   bug is back. The root cause is almost always `onAuthStateChange` in
   `AuthContext.tsx` reacting to `TOKEN_REFRESHED` events as if they were
   real sign-in events.

## Commands

- Install: `npm install` (lockfile is `package-lock.json`; `bun.lock` is
  also checked in but npm is canonical).
- Dev: `npm run dev`.
- Build: `npm run build` (run this before pushing — catches type errors
  CI will catch anyway, but faster).
- Lint: `npm run lint` if present.

## Deploy

Merging to `main` triggers a Vercel deploy. Do not push directly to
`main`. Use the branch specified by the session (currently
`claude/blissful-johnson-*`), open a PR, wait for CI, then merge.
