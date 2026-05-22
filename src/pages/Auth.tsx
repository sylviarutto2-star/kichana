import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { withTimeout } from "@/lib/utils";

export default function Auth() {
  const { session, profile, loading, profileLoaded } = useAuth();
  const [params] = useSearchParams();
  const presetRole = params.get("role") === "stylist" ? "stylist" : "customer";

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;

  if (loading) return <LoadingScreen />;
  if (session) {
    // Never decide the destination from a transient null profile. Wait until
    // the fetch resolves so already-onboarded users are not sent to /onboarding.
    if (!profileLoaded) return <LoadingScreen />;
    const dest = profile?.waitlisted_at
      ? "/waitlisted"
      : profile?.onboarding_complete
        ? (from || "/home")
        : "/onboarding";
    return <Navigate to={dest} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await withTimeout(supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, intended_role: presetRole },
            emailRedirectTo: window.location.origin + "/onboarding",
          },
        }), 15000, "Sign up");
        if (error) throw error;

        // The DB-level auto_confirm trigger already confirmed this user.
        // If Supabase didn't return a session (because mailer_autoconfirm
        // is off at the config level), sign them in directly.
        if (!data.session) {
          const { error: signInErr } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            15000,
            "Sign in",
          );
          if (signInErr) {
            // Last resort fallback: show the "check your email" card.
            setNeedsEmailConfirm(true);
            return;
          }
        }
        toast.success("Welcome to Kichana. Let's get you set up.");
        nav(`/onboarding?role=${presetRole}`);
      } else {
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          15000,
          "Sign in",
        );
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setNeedsEmailConfirm(true);
            return;
          }
          throw error;
        }
        toast.success("Welcome back.");
        nav(from || "/home");
      }
    } catch (err: any) {
      // Surface the real error so we can debug
      const msg = err?.message || err?.error_description || JSON.stringify(err) || "Something went wrong";
      toast.error(msg);
      console.error("Auth error:", err);
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/onboarding",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) toast.error(error.message);
  };

  const resendConfirmation = async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return toast.error(error.message);
    toast.success("Confirmation email re-sent");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block bg-aubergine-700 text-cream p-10">
        <Logo className="text-cream" />
        <div className="mt-20">
          <h2 className="font-display text-5xl leading-tight">Built by women, for women.</h2>
          <p className="mt-4 text-cream/80 max-w-md">
            A quick fade in South B. A 6-hour boho install in Lavington. Nairobi's most trusted
            stylists, with honest reviews from the women who actually sat in the chair.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8"><Logo /></div>

          {needsEmailConfirm ? (
            <div className="card p-6 text-center">
              <MailCheck className="h-10 w-10 mx-auto text-terracotta-600" />
              <h1 className="font-display text-2xl mt-3">Check your inbox.</h1>
              <p className="text-mute text-sm mt-2">
                We sent a confirmation link to <strong className="text-ink">{email}</strong>. Click it, then come back to sign in.
              </p>
              <button onClick={resendConfirmation} className="btn-outline w-full mt-4 text-sm">Resend email</button>
              <button
                onClick={() => { setNeedsEmailConfirm(false); setMode("signin"); }}
                className="btn-ghost w-full mt-2 text-sm"
              >Already confirmed? Sign in</button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
              <p className="text-mute text-sm mt-1">
                {mode === "signup" ? "Continue with Google or use your email." : "Sign in to continue."}
              </p>

              <button onClick={signInWithGoogle} className="btn-outline w-full mt-5">
                <GoogleIcon /> Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3 text-xs text-mute">
                <hr className="flex-1 border-line" /> or email <hr className="flex-1 border-line" />
              </div>

              <form onSubmit={submit} className="space-y-3">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
