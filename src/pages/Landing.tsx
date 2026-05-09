import { Link, Navigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Calendar, Sparkles, Shield } from "lucide-react";
// Sparkles import retained — used in Feature card below.

export default function Landing() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="container-wide py-6 flex items-center justify-between">
        <Logo />
        <Link to="/auth" className="btn-ghost text-sm">Sign in</Link>
      </header>

      <main className="container-wide flex-1 grid md:grid-cols-2 gap-10 items-center py-10">
        <div className="animate-fade-up">
          <p className="h-eyebrow mb-4">Built for Nairobi</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.02] tracking-tight">
            Hair, <em className="not-italic text-terracotta-600">brilliantly</em> booked.
          </h1>
          <p className="mt-5 text-lg text-mute max-w-md">
            Discover Nairobi's best hairstylists, see their real work, book in seconds, and pay with M-Pesa.
            Braids, wigs, locs, naturals, nails, barber. Salon or at-home.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" className="btn-primary">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/auth?role=stylist" className="btn-outline">I'm a stylist</Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <Stat label="Top stylists" value="200+" />
            <Stat label="Bookings" value="5K+" />
            <Stat label="Avg. rating" value="4.8★" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Tile src="https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=700&q=70" tall />
          <div className="space-y-3">
            <Tile src="https://images.unsplash.com/photo-1581252584837-9f0b1d3bf82c?auto=format&fit=crop&w=700&q=70" />
            <Tile src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=700&q=70" />
          </div>
        </div>
      </main>

      <section className="container-wide pb-20 grid md:grid-cols-3 gap-4">
        <Feature icon={<Calendar className="h-5 w-5" />} title="Book in 30 seconds" body="Pick a stylist, a slot, pay deposit on M-Pesa. Done." />
        <Feature icon={<Sparkles className="h-5 w-5" />} title="Real, verified work" body="Portfolios are built from actual completed bookings. No fake glow-ups." />
        <Feature icon={<Shield className="h-5 w-5" />} title="Safe & secure" body="ID-verified stylists. Refund-protected deposits. Your data stays yours." />
      </section>

      <footer className="border-t border-line py-6 text-xs text-mute container-wide flex justify-between">
        <span>© {new Date().getFullYear()} Kichana</span>
        <span>Made in Nairobi 🇰🇪</span>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl">{value}</div>
      <div className="text-xs text-mute">{label}</div>
    </div>
  );
}
function Tile({ src, tall }: { src: string; tall?: boolean }) {
  return <img src={src} className={`w-full rounded-3xl object-cover ${tall ? "aspect-[3/4]" : "aspect-square"}`} />;
}
function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-5">
      <div className="h-10 w-10 grid place-items-center rounded-xl bg-terracotta-50 text-terracotta-600">{icon}</div>
      <div className="mt-3 font-semibold">{title}</div>
      <p className="text-sm text-mute mt-1">{body}</p>
    </div>
  );
}
