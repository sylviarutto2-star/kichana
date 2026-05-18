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
      // Real schema: profiles.user_id references auth.users.id (profiles.id is its own PK).
      const { data, error } = await supabase.from("profiles" as any).select("*").eq("user_id", userId).maybeSingle();
      if (error && (error.code === "42P01" || /relation .* does not exist/i.test(error.message))) {
        setProfile({ id: userId, user_id: userId, name: "", role: "customer" } as any);
        return;
      }
      // Normalise so the rest of the app can read both shapes during the schema reconciliation.
      const p: any = data ?? null;
      if (p) {
        p.full_name = p.full_name ?? p.name ?? null;
        p.avatar_url = p.avatar_url ?? p.profile_photo ?? null;
        p.neighborhood = p.neighborhood ?? p.location ?? null;
      }
      setProfile(p);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      // Auth state is known — render immediately. The profile loads in the
      // background so a slow/failed query never traps the app on a blank screen.
      setLoading(false);
      if (data.session?.user) void loadProfile(data.session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      setSession(s);
      setLoading(false);
      // Defer Supabase data calls out of the auth callback: querying inside it
      // while the auth client holds its lock can deadlock the whole client.
      if (s?.user) setTimeout(() => loadProfile(s.user.id), 0);
      else setProfile(null);
    });

    return () => {
      active = false;
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
