import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Hardcoded so it can't be misconfigured via stale Vercel env vars.
// These point at the live Kichana project (project ref wdqpmyhtyhlwkkdrkjwv),
// matching supabase/config.toml and the migrations in this repo.
// Anon/publishable keys are designed to be public; security is enforced
// by Row Level Security policies in the database.
const url = "https://wdqpmyhtyhlwkkdrkjwv.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcXBteWh0eWhsd2trZHJrand2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDAzNTEsImV4cCI6MjA4OTA3NjM1MX0.WvuzQhrQRtYVOVKmTx_uOE8wGKMa1ki9ImDZeWq0wtQ";

export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
