import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { withTimeout } from "@/lib/utils";

// Supabase fires a PASSWORD_RECOVERY event when the user opens the link
// from the reset email. We render a "set a new password" form only while
// that recovery session is active.
export default function ResetPassword() {
  const nav = useNavigate();
  const [stage, setStage] = useState<"waiting" | "ready" | "done">("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If we already have a session from the recovery link by the time this
    // mounts, allow the user to set a new password immediately.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStage("ready");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStage("ready");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password }),
        15000,
        "Update password",
      );
      if (error) throw error;
      setStage("done");
      toast.success("Password updated.");
      // Give the success state a moment to land, then bounce to home.
      setTimeout(() => nav("/home", { replace: true }), 1500);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't update password. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-cream">
      <div className="hidden md:block bg-aubergine-700 text-cream p-10">
        <Logo className="text-cream" />
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8"><Logo /></div>

          {stage === "waiting" && (
            <div className="card p-6 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-terracotta-600" />
              <h1 className="font-display text-2xl mt-3">Verifying your reset link…</h1>
              <p className="text-mute text-sm mt-2">
                If this takes more than a few seconds, the link may have expired.
                Request a new one from the sign-in page.
              </p>
              <Link to="/auth" className="btn-outline w-full mt-4 text-sm">Back to sign in</Link>
            </div>
          )}

          {stage === "ready" && (
            <>
              <h1 className="font-display text-3xl">Set a new password</h1>
              <p className="text-mute text-sm mt-1">Use at least 8 characters.</p>
              <form onSubmit={submit} className="space-y-3 mt-5">
                <div>
                  <label className="label">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Type it again"
                    autoComplete="new-password"
                  />
                </div>
                <button disabled={busy} className="btn-primary w-full mt-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </button>
              </form>
            </>
          )}

          {stage === "done" && (
            <div className="card p-6 text-center">
              <div className="mx-auto h-12 w-12 grid place-items-center rounded-full bg-sage/20 text-sage">
                <Check className="h-6 w-6" />
              </div>
              <h1 className="font-display text-2xl mt-3">Password updated</h1>
              <p className="text-mute text-sm mt-2">Taking you back into the app…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
