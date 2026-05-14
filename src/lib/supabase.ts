import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Hardcoded so it can't be misconfigured via stale Vercel env vars.
// Anon/publishable keys are designed to be public; security is enforced
// by Row Level Security policies in the database.
const url = "https://dpzdltvxgbwepxbjpqnz.supabase.co";
const key = "sb_publishable_XfaDuVbQvabHTB03OYksLw_UHH45JA7";

export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
