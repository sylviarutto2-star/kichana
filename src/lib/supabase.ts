import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Hardcoded so it can't be misconfigured via stale Vercel env vars.
// This is the live Kichana project (project ref dpzdltvxgbwepxbjpqnz) —
// the one actually in use. NOTE: .env and supabase/config.toml still
// reference an old project ref (wdqpmyhtyhlwkkdrkjwv); ignore those.
// Anon/publishable keys are designed to be public; security is enforced
// by Row Level Security policies in the database.
const url = "https://dpzdltvxgbwepxbjpqnz.supabase.co";
const key = "sb_publishable_XfaDuVbQvabHTB03OYksLw_UHH45JA7";

export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
