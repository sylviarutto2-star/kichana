import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  // Tracks which user id we last loaded a profile for. Used to ignore
  // onAuthStateChange events that don't actually change identity
  // (TOKEN_REFRESHED fires on every tab refocus and was retriggering the
  // global loading gate, causing the "glitches on tab switch" symptom).
  const loadedUserIdRef = useRef<string | null>(null);

  const loadProfile = async (userId: string) => {
    setProfileLoaded(false);
    const fetchOnce = () =>
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    // Hard ceiling so the UI never spins forever if the query hangs.
    const withDeadline = <T,>(p: PromiseLike<T>, ms: number): Promise<T> =>
      new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("profile load timeout")), ms);
        Promise.resolve(p).then(
          (v) => { clearTimeout(t); resolve(v); },
          (e) => { clearTimeout(t); reject(e); },
        );
      });
    try {
      let { data, error } = await withDeadline(fetchOnce(), 6000);
      if (error && !(error.code === "42P01" || /relation .* does not exist/i.test(error.message))) {
        // One retry on transient errors (network blip, RLS warm-up).
        await new Promise((r) => setTimeout(r, 400));
        ({ data, error } = await withDeadline(fetchOnce(), 6000));
      }
      if (error && (error.code === "42P01" || /relation .* does not exist/i.test(error.message))) {
        setProfile({ id: userId, role: "customer" } as Profile);
        return;
      }
      setProfile((data as Profile) ?? null);
    } catch (e) {
      console.warn("loadProfile failed/timed out — releasing the loading gate", e);
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
    const watchdog = setTimeout(() => {
      setLoading(false);
      setProfileLoaded(true);
    }, 8000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session?.user) {
          loadedUserIdRef.current = data.session.user.id;
          await loadProfile(data.session.user.id);
        } else {
          setProfileLoaded(true);
        }
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
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      const nextUserId = s?.user?.id ?? null;
      // TOKEN_REFRESHED fires on every tab refocus. The profile is still
      // valid; only the access token rotated. Touching profileLoaded here
      // is what made the app flash its loading screen on every tab switch.
      if (event === "TOKEN_REFRESHED") return;
      if (!nextUserId) {
        loadedUserIdRef.current = null;
        setProfile(null);
        setProfileLoaded(true);
        return;
      }
      if (nextUserId !== loadedUserIdRef.current) {
        loadedUserIdRef.current = nextUserId;
        await loadProfile(nextUserId);
      }
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
