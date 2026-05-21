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

  // When `background` is true (a refresh while we already have a profile),
  // we keep the existing profile visible and never flip profileLoaded back
  // to false — otherwise RequireAuth unmounts the current page on every
  // token refresh / tab-focus event, which causes pages like Studio to
  // refetch from scratch and (on transient failure) bounce to /onboarding.
  const loadProfile = async (userId: string, background = false) => {
    if (!background) setProfileLoaded(false);
    const fetchOnce = () =>
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
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
        await new Promise((r) => setTimeout(r, 400));
        ({ data, error } = await withDeadline(fetchOnce(), 6000));
      }
      if (error && (error.code === "42P01" || /relation .* does not exist/i.test(error.message))) {
        setProfile({ id: userId, role: "customer" } as Profile);
        return;
      }
      // On a background refresh, only overwrite the profile when the fetch
      // actually returned a row. A null result here usually means a momentary
      // RLS / replica blip — keep the prior profile rather than nulling it
      // out and forcing the user into onboarding.
      if (background) {
        if (data) setProfile(data as Profile);
      } else {
        setProfile((data as Profile) ?? null);
      }
    } catch (e) {
      console.warn("loadProfile failed/timed out", e);
      if (!background) setProfile(null);
    } finally {
      if (!background) setProfileLoaded(true);
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
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      // Only react to events that actually change *who* is signed in.
      // TOKEN_REFRESHED / USER_UPDATED / INITIAL_SESSION fire frequently
      // (including on tab focus) and triggering a profile reload on those
      // unmounted the active page and, on transient failures, kicked
      // onboarded users back to /onboarding.
      setSession(s);
      if (event === "SIGNED_OUT" || !s?.user) {
        setProfile(null);
        setProfileLoaded(true);
        return;
      }
      if (event === "SIGNED_IN") {
        // Only do a fresh load (with the loading gate) if this is a
        // different user than the one we already have cached.
        setProfile((prev) => {
          if (prev && prev.id === s.user.id) {
            // Same user — refresh quietly in the background.
            void loadProfile(s.user.id, true);
            return prev;
          }
          void loadProfile(s.user.id);
          return prev;
        });
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
        refreshProfile: async () => {
          if (!session?.user) return;
          // Refresh quietly when we already have a profile so the UI doesn't
          // flash a loading screen / unmount the current page.
          await loadProfile(session.user.id, !!profile);
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
