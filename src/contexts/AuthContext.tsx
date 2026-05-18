import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";

type Ctx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      // profiles.id is the PK and references auth.users(id) directly — there is
      // no separate user_id column (see kichana_v1 schema).
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error && (error.code === "42P01" || /relation .* does not exist/i.test(error.message))) {
        setProfile({ id: userId, role: "customer" } as Profile);
        return;
      }
      setProfile((data as Profile) ?? null);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Watchdog: if the session lookup ever stalls (e.g. network hang), force
    // the app out of its loading state so it can never strand on a blank screen.
    const watchdog = setTimeout(() => setLoading(false), 8000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session?.user) await loadProfile(data.session.user.id);
      })
      .catch(() => {
        // Never let a failed session lookup leave the app stuck on a blank
        // screen — fall back to a signed-out state.
        setSession(null);
        setProfile(null);
      })
      .finally(() => {
        clearTimeout(watchdog);
        setLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s?.user) await loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => {
      clearTimeout(watchdog);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signOut: async () => { await supabase.auth.signOut(); },
        refreshProfile: async () => { if (session?.user) await loadProfile(session.user.id); },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
