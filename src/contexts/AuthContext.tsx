import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";

type Ctx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoaded: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileLoaded: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const loadProfile = async (userId: string) => {
    setProfileLoaded(false);
    const fetchOnce = () =>
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    try {
      let { data, error } = await fetchOnce();
      if (error && !(error.code === "42P01" || /relation .* does not exist/i.test(error.message))) {
        // One retry on transient errors (network blip, RLS warm-up).
        await new Promise((r) => setTimeout(r, 400));
        ({ data, error } = await fetchOnce());
      }
      if (error && (error.code === "42P01" || /relation .* does not exist/i.test(error.message))) {
        setProfile({ id: userId, role: "customer" } as Profile);
        return;
      }
      setProfile((data as Profile) ?? null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoaded(true);
    }
  };

  useEffect(() => {
    // Watchdog: if the session lookup ever stalls, release the loading gate
    // so the app can render /auth instead of a permanent blank screen.
    // We do NOT null out session here — the real getSession promise can still
    // resolve and update state, which avoids a sign-in/sign-out flicker.
    const watchdog = setTimeout(() => setLoading(false), 8000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session?.user) await loadProfile(data.session.user.id);
        else setProfileLoaded(true);
      })
      .catch(() => {
        setSession(null);
        setProfile(null);
        setProfileLoaded(true);
      })
      .finally(() => {
        clearTimeout(watchdog);
        setLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s?.user) await loadProfile(s.user.id);
      else { setProfile(null); setProfileLoaded(true); }
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
        profileLoaded,
        signOut: async () => {
          // Race the network signOut against a short timeout; either way,
          // clear local auth state so the user is never trapped on a
          // signed-in screen because the request hung.
          try {
            await Promise.race([
              supabase.auth.signOut(),
              new Promise((_, rej) => setTimeout(() => rej(new Error("signOut timeout")), 4000)),
            ]);
          } catch (e) {
            console.warn("signOut: forcing local clear after error", e);
          }
          setSession(null);
          setProfile(null);
          setProfileLoaded(true);
        },
        refreshProfile: async () => { if (session?.user) await loadProfile(session.user.id); },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
