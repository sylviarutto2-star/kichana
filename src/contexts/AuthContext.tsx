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
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s?.user) await loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
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
