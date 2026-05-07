import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Brush,
  Clock3,
  MapPin,
  Navigation2,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Syringe,
  Scissors,
  CalendarCheck,
} from "lucide-react";
import KichanaLogo from "@/components/KichanaLogo";
import StylistCard from "@/components/StylistCard";
import { categories, mockStylists } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import heroBraids from "@/assets/hero-braids.jpg";
import personaLoyal from "@/assets/persona-loyal.jpg";
import personaShopper from "@/assets/persona-shopper.jpg";
import personaRescue from "@/assets/persona-rescue.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: [0.2, 0, 0, 1] as const },
};

const serviceIcons: Record<string, typeof Scissors> = {
  Braids: Scissors,
  "Wig Install": Sparkles,
  "Natural Hair": Brush,
  "Protective Styles": ShieldCheck,
  Treatments: Syringe,
  Nails: Star,
  Makeup: Sparkles,
};

const personas = [
  {
    title: "Switch only if she’s clearly better",
    body: "Compare proof of work, price, punctuality and review quality in seconds.",
    image: personaLoyal,
    href: "/explore?sort=top",
  },
  {
    title: "Stop gambling on inconsistent results",
    body: "Shortlist specialists with repeatable outcomes, verified reviews and relevant portfolios.",
    image: personaShopper,
    href: "/explore?cat=Braids",
  },
  {
    title: "Hair SOS when something went wrong",
    body: "Reach repair-focused stylists fast with clear emergency pricing and availability.",
    image: personaRescue,
    href: "/sos",
  },
];

const trendingServices = ["Knotless Braids", "Silk Press", "Frontal Install", "Loc Retwist", "Gel Manicure"];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState("");
  const [where, setWhere] = useState("");

  const topRated = useMemo(
    () => [...mockStylists].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 4),
    [],
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (service) params.set("q", service);
    if (where) params.set("loc", where);
    navigate(`/explore?${params.toString()}`);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => setWhere("Current location"),
      () => setWhere("Nairobi, Kenya"),
    );
  };

  return (
    <div className="min-h-screen bg-background pb-14">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-5 md:px-8 md:pt-6">
        <header className="flex items-center justify-between gap-4">
          <KichanaLogo size="sm" animate={false} />
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-6 pt-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pt-10">
          <motion.div {...fadeUp} className="space-y-6 text-left">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Book beauty professionals</p>
              <h1 className="max-w-[12ch] font-display text-4xl font-semibold leading-none text-foreground md:text-6xl">
                Discover and book trusted stylists in Nairobi.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Search by service and area, compare real work, and book the right specialist for braids, wigs,
                natural hair, nails and urgent fixes.
              </p>
            </div>

            <div className="rounded-[28px] border border-border bg-card p-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.28)]">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <label className="flex h-14 items-center gap-3 rounded-2xl bg-secondary px-4">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="What service are you booking?"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </label>
                <label className="flex h-14 items-center gap-3 rounded-2xl bg-secondary px-4">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={where}
                    onChange={(e) => setWhere(e.target.value)}
                    placeholder="Where in Nairobi?"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button type="button" onClick={useMyLocation} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                    <Navigation2 className="h-3 w-3" /> Me
                  </button>
                </label>
                <button
                  onClick={handleSearch}
                  className="h-14 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground"
                >
                  Search
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {trendingServices.map((item) => (
                  <button
                    key={item}
                    onClick={() => navigate(`/explore?q=${encodeURIComponent(item)}`)}
                    className="rounded-full bg-secondary px-3 py-2 text-xs font-medium text-foreground"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Rated pros", value: "4.8 average", icon: Star },
                { label: "Response speed", value: "Same-day options", icon: Clock3 },
                { label: "Booking confidence", value: "Verified reviews", icon: CalendarCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">{value}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="relative">
            <div className="overflow-hidden rounded-[32px] bg-card">
              <img
                src={heroBraids}
                alt="Woman with neatly styled long braids"
                className="h-[420px] w-full object-cover object-center md:h-[560px]"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-border bg-card/92 p-4 backdrop-blur-sm md:left-auto md:right-4 md:w-[280px]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Why people switch</p>
              <div className="mt-3 space-y-3 text-sm text-foreground">
                <div className="flex items-start justify-between gap-3">
                  <span>Real photo proof</span>
                  <span className="font-semibold">Every profile</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Review quality</span>
                  <span className="font-semibold">Shown with counts</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Urgent fixes</span>
                  <span className="font-semibold">SOS available</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <motion.section {...fadeUp} className="pt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div className="text-left">
              <h2 className="font-display text-2xl font-semibold text-foreground">Find pros by service</h2>
              <p className="mt-1 text-sm text-muted-foreground">Cleaner browsing with tighter categories and faster routes into search.</p>
            </div>
            <button onClick={() => navigate("/explore")} className="hidden text-sm font-semibold text-primary md:inline-flex">
              View all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories
              .filter((category) => category.label !== "All" && serviceIcons[category.label])
              .slice(0, 6)
              .map((category) => {
                const Icon = serviceIcons[category.label];
                return (
                  <button
                    key={category.label}
                    onClick={() => navigate(`/explore?cat=${encodeURIComponent(category.label)}`)}
                    className="flex min-h-[124px] flex-col items-start justify-between rounded-[24px] border border-border bg-card p-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <span className="rounded-2xl bg-secondary p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <span className="text-sm font-semibold leading-snug text-foreground">{category.label}</span>
                  </button>
                );
              })}
          </div>
        </motion.section>

        <motion.section {...fadeUp} className="pt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div className="text-left">
              <h2 className="font-display text-2xl font-semibold text-foreground">Best professionals near you</h2>
              <p className="mt-1 text-sm text-muted-foreground">Smaller cards, clearer signals, less noise.</p>
            </div>
            <button onClick={() => navigate("/explore")} className="text-sm font-semibold text-primary">
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {topRated.map((stylist) => (
              <StylistCard
                key={stylist.id}
                compact
                name={stylist.name}
                image={stylist.image}
                rating={stylist.rating}
                reviews={stylist.reviews}
                category={stylist.category}
                startingPrice={stylist.startingPrice}
                onClick={() => navigate(`/stylist/${stylist.id}`)}
              />
            ))}
          </div>
        </motion.section>

        <motion.section {...fadeUp} className="pt-12">
          <div className="mb-5 text-left">
            <h2 className="font-display text-2xl font-semibold text-foreground">Choose the path that fits your situation</h2>
            <p className="mt-1 text-sm text-muted-foreground">The landing page now separates discovery, comparison and rescue into cleaner entry points.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {personas.map((persona) => (
              <button
                key={persona.title}
                onClick={() => navigate(persona.href)}
                className="overflow-hidden rounded-[28px] border border-border bg-card text-left"
              >
                <img src={persona.image} alt="" className="h-56 w-full object-cover" loading="lazy" />
                <div className="space-y-3 p-5">
                  <h3 className="font-display text-xl font-semibold leading-tight text-foreground">{persona.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{persona.body}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Explore route <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Index;
