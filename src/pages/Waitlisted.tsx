import { Link, Navigate } from "react-router-dom";
import { Sparkles, MailCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Waitlisted() {
  const { profile, loading, profileLoaded } = useAuth();

  if (loading || !profileLoaded) return <LoadingScreen />;
  if (!profile?.waitlisted_at) return <Navigate to="/onboarding" replace />;

  const isStylist = profile.role === "stylist";

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="container-wide py-6 flex items-center justify-between">
        <Logo />
        <button
          onClick={() => supabase.auth.signOut()}
          className="btn-ghost text-sm"
        >
          Sign out
        </button>
      </header>

      <main className="container-wide flex-1 flex items-center justify-center py-12">
        <div className="card p-8 md:p-10 max-w-lg w-full text-center bg-aubergine-700 text-cream">
          <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-cream/15">
            <Sparkles className="h-7 w-7 text-cream" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl mt-5">
            You're on the list.
          </h1>
          <p className="mt-3 text-cream/85">
            {isStylist
              ? "We've got your studio details. When we open Nairobi to stylists, you'll be one of the first to set up shop — M-Pesa payouts ready."
              : "We've saved your spot. When Kichana opens in Nairobi, you'll be in first — with 10% off your first booking."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-cream/70">
            <MailCheck className="h-4 w-4" />
            We'll email you the moment doors open.
          </div>
          <Link to="/" className="btn-outline mt-7 inline-flex border-cream/30 text-cream hover:bg-cream/10">
            Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
