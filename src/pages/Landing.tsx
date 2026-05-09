import { Link, Navigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Calendar, Sparkles, Shield, Heart, Bookmark, Star, MapPin } from "lucide-react";

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

      <main className="container-wide flex-1 grid md:grid-cols-2 gap-10 md:gap-16 items-center py-10">
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

        <HeroComposition />
      </main>

      <section className="container-wide pb-20 grid md:grid-cols-3 gap-4">
        <Feature icon={<Calendar className="h-5 w-5" />} title="Book in 30 seconds" body="Pick a stylist, a slot, pay deposit on M-Pesa. Done." />
        <Feature icon={<Sparkles className="h-5 w-5" />} title="Real, verified work" body="Portfolios are built from actual completed bookings. No fake glow-ups." />
        <Feature icon={<Shield className="h-5 w-5" />} title="Safe & secure" body="ID-verified stylists. Refund-protected deposits. Your data stays yours." />
      </section>

      <Footer />
    </div>
  );
}

function HeroComposition() {
  return (
    <div className="relative grid grid-cols-12 gap-3 md:gap-4 animate-fade-up">
      {/* Big stylist card mock */}
      <div className="col-span-7 row-span-2 rounded-3xl overflow-hidden bg-gradient-to-br from-terracotta-700 via-terracotta-500 to-aubergine-700 aspect-[4/5] relative shadow-card">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(216,168,90,0.5),transparent_45%)]" />
        <div className="absolute top-4 left-4 chip text-[10px]">⭐ Featured</div>
        <div className="absolute top-4 right-4 rounded-full bg-cream/95 px-2.5 py-1 text-xs font-semibold flex items-center gap-1">
          <Star className="h-3 w-3 fill-gold-500 text-gold-500" /> 4.9
        </div>
        <div className="absolute bottom-0 inset-x-0 p-4 text-cream">
          <div className="font-display text-xl">Amani Braids Studio</div>
          <div className="text-cream/80 text-xs flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> Westlands · travels</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-cream/70">Knotless · boho · box</span>
            <span className="rounded-full bg-cream text-ink text-xs font-semibold px-3 py-1">From KES 2,500</span>
          </div>
        </div>
      </div>

      {/* Vault USP card */}
      <div className="col-span-5 card p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-terracotta-50 text-terracotta-600">
            <Bookmark className="h-4 w-4" />
          </div>
          <span className="text-xs h-eyebrow">Hair Vault</span>
        </div>
        <p className="text-sm leading-snug">
          Save inspirations. <span className="text-mute">Show your stylist exactly what you want — they see your saved looks before the appointment.</span>
        </p>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {[
            "from-terracotta-300 to-terracotta-600",
            "from-aubergine-500 to-aubergine-700",
            "from-gold-400 to-terracotta-500",
          ].map((g, i) => (
            <div key={i} className={`aspect-square rounded-lg bg-gradient-to-br ${g}`} />
          ))}
        </div>
      </div>

      {/* M-Pesa USP */}
      <div className="col-span-5 card p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-sage/20 text-sage">
            <span className="font-bold text-xs">M</span>
          </div>
          <span className="text-xs h-eyebrow">M-Pesa</span>
        </div>
        <p className="text-sm leading-snug mt-2">
          One-tap deposit. Balance after the service.
        </p>
        <div className="mt-3 rounded-xl bg-ink text-cream p-3">
          <div className="text-[10px] uppercase tracking-wider text-cream/60">STK Push</div>
          <div className="font-display text-lg mt-0.5">KES 1,500</div>
          <div className="text-[10px] text-cream/60">Pay 0712 345 678</div>
        </div>
      </div>

      {/* Group booking USP */}
      <div className="col-span-12 card p-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-400/20 text-gold-500">
          <Heart className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs h-eyebrow">Group bookings</div>
          <p className="text-sm leading-snug">Bring the girlies. Pre-wedding, birthdays, holidays — book the whole crew at once.</p>
        </div>
        <span className="chip text-[10px]">NEW</span>
      </div>
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
function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-5">
      <div className="h-10 w-10 grid place-items-center rounded-xl bg-terracotta-50 text-terracotta-600">{icon}</div>
      <div className="mt-3 font-semibold">{title}</div>
      <p className="text-sm text-mute mt-1">{body}</p>
    </div>
  );
}
