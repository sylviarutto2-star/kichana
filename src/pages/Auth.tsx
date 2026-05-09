import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const { session, profile, loading } = useAuth();
  const [params] = useSearchParams();
  const presetRole = params.get("role") === "stylist" ? "stylist" : "customer";

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (loading) return null;
  if (session) {
    return <Navigate to={profile?.onboarding_complete ? "/home" : "/onboarding"} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, intended_role: presetRole } },
        });
        if (error) throw error;
        toast.success("Welcome to Kichana!");
        nav(`/onboarding?role=${presetRole}`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        nav("/home");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block bg-aubergine-700 text-cream p-10">
        <Logo className="text-cream" />
        <div className="mt-20">
          <h2 className="font-display text-5xl leading-tight">A new chapter for Nairobi hair.</h2>
          <p className="mt-4 text-cream/80 max-w-md">
            From a quick fade in South B to a 6-hour boho install in Lavington — book it all in one place.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8"><Logo /></div>
          <h1 className="font-display text-3xl">{mode === "signup" ? "Create account" : "Welcome back"}</h1>
          <p className="text-mute text-sm mt-1">
            {mode === "signup" ? "Just an email and password to get started." : "Sign in to your account."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-3">
            {mode === "signup" && (
              <div>
                <label className="label">Full name</label>
                <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wanjiku Kamau" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required minLength={6} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <button disabled={busy} className="btn-primary w-full mt-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-mute">
            {mode === "signup" ? "Already have an account? " : "New to Kichana? "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="font-semibold text-terracotta-600">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
          <Link to="/" className="block mt-3 text-xs text-mute">← Back home</Link>
        </div>
      </div>
    </div>
  );
}
