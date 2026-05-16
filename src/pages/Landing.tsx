import { Link, Navigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { SmartImage } from "@/components/SmartImage";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Calendar, Sparkles, Shield, Heart, Bookmark, Star, MapPin } from "lucide-react";

const STYLES = [
  { label: "Knotless braids", desc: "Box · boho · jumbo", src: "/landing/style-braids.svg" },
  { label: "Locs & twists", desc: "Starter · retwist · styling", src: "/landing/style-locs.svg" },
  { label: "Natural & afro", desc: "Wash · treat · define", src: "/landing/style-afro.svg" },
];

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

      <section className="container-wide pb-16 grid md:grid-cols-3 gap-4">
        <Feature icon={<Calendar className="h-5 w-5" />} title="Book in 30 seconds" body="Pick a stylist, a slot, pay deposit on M-Pesa. Done." />
        <Feature icon={<Sparkles className="h-5 w-5" />} title="Real, verified work" body="Portfolios are built from actual completed bookings. No fake glow-ups." />
        <Feature icon={<Shield className="h-5 w-5" />} title="Safe & secure" body="ID-verified stylists. Refund-protected deposits. Your data stays yours." />
      </section>

      <section className="container-wide pb-20">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="h-eyebrow mb-2">Find your look</p>
            <h2 className="font-display text-3xl md:text-4xl">Browse by style</h2>
          </div>
          <Link to="/auth" className="btn-ghost text-sm hidden sm:inline-flex">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {STYLES.map((s) => (
            <Link key={s.src} to="/auth" className="group card p-0 overflow-hidden">
              <SmartImage
                src={s.src}
                fallbackKey={s.label}
                alt={s.label}
                className="aspect-[4/5]"
                imgClassName="transition-transform duration-300 group-hover:scale-105"
              />
              <div className="p-3">
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-xs text-mute">{s.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-wide pb-20">
        <div className="card relative overflow-hidden bg-aubergine-700 text-cream p-8 md:p-12">
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_85%_20%,rgba(216,168,90,0.5),transparent_50%)]" />
          <div className="relative max-w-lg">
            <h2 className="font-display text-3xl md:text-4xl">Ready when you are.</h2>
            <p className="mt-3 text-cream/80">
              Join thousands of clients booking Nairobi's best — or grow your own chair with verified bookings and M-Pesa payouts.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth" className="btn-primary">Get started <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/auth?role=stylist" className="rounded-full bg-cream/10 text-cream px-4 py-2 text-sm font-semibold ring-1 ring-cream/25 hover:bg-cream/15">I'm a stylist</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function HeroComposition() {
  return (
    <div className="relative grid grid-cols-12 gap-3 md:gap-4 animate-fade-up">
      {/* Big stylist card */}
      <div className="col-span-7 row-span-2 rounded-3xl overflow-hidden aspect-[4/5] relative shadow-card">
        <SmartImage
          src="/landing/hero.svg"
          fallbackKey="hero-featured"
          alt="Featured stylist's braiding work"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 [background:linear-gradient(to_top,rgba(27,20,16,0.85),rgba(27,20,16,0.05)_55%,transparent)]" />
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
          {STYLES.map((s) => (
            <SmartImage
              key={s.src}
              src={s.src}
              fallbackKey={s.label}
              alt={s.label}
              className="aspect-square rounded-lg"
            />
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
