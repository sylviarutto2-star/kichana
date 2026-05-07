import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Bell, Search, Navigation2, Sparkles, ShieldCheck, Siren, Repeat, ArrowRight } from "lucide-react";
import KichanaLogo from "@/components/KichanaLogo";
import StylistCard from "@/components/StylistCard";
import { categories, mockStylists } from "@/data/mockData";
import heroHome from "@/assets/hero-home.jpg";
import personaLoyal from "@/assets/persona-loyal.jpg";
import personaShopper from "@/assets/persona-shopper.jpg";
import personaRescue from "@/assets/persona-rescue.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as const } },
};

const trendingServices = [
  "Knotless Braids",
  "Silk Press",
  "Frontal Install",
  "Cornrows",
  "Gel Manicure",
  "Loc Retwist",
];

const personas = [
  {
    key: "loyal",
    icon: Repeat,
    title: "Already have a stylist?",
    body: "Compare side-by-side and rebook in a tap when she's away.",
    image: personaLoyal,
  },
  {
    key: "shopper",
    icon: Sparkles,
    title: "Tired of inconsistent results?",
    body: "Vetted stylists, real reviews, and photo proof — every time.",
    image: personaShopper,
  },
  {
    key: "rescue",
    icon: ShieldCheck,
    title: "Recent bad experience?",
    body: "Female specialists in hair repair & rescue, ready today.",
    image: personaRescue,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [service, setService] = useState("");
  const [where, setWhere] = useState("");

  const topRated = [...mockStylists].sort((a, b) => b.rating - a.rating).slice(0, 6);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <KichanaLogo size="sm" animate={false} />
        <button
          aria-label="Notifications"
          className="relative h-10 w-10 rounded-full bg-secondary flex items-center justify-center"
        >
          <Bell className="h-[18px] w-[18px] text-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* Hero */}
      <section className="px-5 pt-2">
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl">
          <img
            src={heroHome}
            alt="Premium braided look by a Kichana stylist"
            className="w-full h-[340px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h1 className="font-display text-[28px] font-semibold leading-[1.1] text-primary-foreground">
              Beauty, booked beautifully.
            </h1>
            <p className="text-[13px] text-primary-foreground/85 mt-1.5 leading-snug">
              Find trusted stylists across Nairobi — at the salon or your door.
            </p>
          </div>
        </motion.div>

        {/* Search card — pulled up over hero */}
        <motion.div
          {...fadeUp}
          className="-mt-6 mx-1 relative bg-card rounded-2xl border border-border shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] p-3 space-y-2"
        >
          <label className="flex items-center gap-2.5 px-3 h-12 rounded-xl bg-secondary/60">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="What service? (e.g. knotless braids)"
              className="flex-1 bg-transparent text-[14px] placeholder:text-muted-foreground focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2.5 px-3 h-12 rounded-xl bg-secondary/60">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Where? (Kilimani, Westlands…)"
              className="flex-1 bg-transparent text-[14px] placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={useMyLocation}
              className="text-[11px] font-semibold text-primary flex items-center gap-1 shrink-0"
            >
              <Navigation2 className="h-3 w-3" /> Me
            </button>
          </label>
          <button
            onClick={handleSearch}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] tracking-tight active:scale-[0.99] transition-transform"
          >
            Search stylists
          </button>
        </motion.div>

        {/* Trending services */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Trending now
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {trendingServices.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setService(t);
                  navigate(`/explore?q=${encodeURIComponent(t)}`);
                }}
                className="shrink-0 px-3.5 h-9 rounded-full bg-secondary text-[12.5px] font-medium text-foreground"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Hair SOS banner */}
      <section className="px-5 mt-6">
        <motion.button
          {...fadeUp}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate("/sos")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-foreground text-background"
        >
          <div className="h-11 w-11 rounded-full bg-primary/90 flex items-center justify-center shrink-0">
            <Siren className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-semibold leading-tight">Hair SOS — need a stylist now?</p>
            <p className="text-[11.5px] opacity-70 mt-0.5">
              Broadcast to female repair & emergency specialists nearby.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-70" />
        </motion.button>
      </section>

      {/* Personas — 3 entry points */}
      <section className="px-5 mt-7">
        <h2 className="font-display text-[20px] font-semibold tracking-tight">Find your fit</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">However you arrived, we have a path for you.</p>
        <div className="mt-3 space-y-3">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <motion.button
                key={p.key}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate("/explore")}
                className="w-full flex items-stretch gap-3 rounded-2xl bg-card border border-border overflow-hidden"
              >
                <img src={p.image} alt="" loading="lazy" className="h-24 w-24 object-cover shrink-0" />
                <div className="flex-1 py-3 pr-3 text-left flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[14px] font-semibold leading-tight">{p.title}</p>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{p.body}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Browse by category — compact pills */}
      <section className="px-5 mt-7">
        <h2 className="font-display text-[20px] font-semibold tracking-tight">Browse by service</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {categories.filter((c) => c.label !== "All").slice(0, 9).map((c) => (
            <button
              key={c.label}
              onClick={() => navigate(`/explore?cat=${encodeURIComponent(c.label)}`)}
              className="aspect-[5/3] rounded-xl bg-secondary text-[12.5px] font-medium text-foreground flex items-center justify-center text-center px-2"
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Top rated near you */}
      <section className="px-5 mt-7">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="font-display text-[20px] font-semibold tracking-tight">Top rated near you</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Hand-picked by Kichana</p>
          </div>
          <button onClick={() => navigate("/explore")} className="text-[12px] font-semibold text-primary">
            See all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {topRated.map((s) => (
            <StylistCard
              key={s.id}
              compact
              name={s.name}
              image={s.image}
              rating={s.rating}
              reviews={s.reviews}
              category={s.category}
              startingPrice={s.startingPrice}
              onClick={() => navigate(`/stylist/${s.id}`)}
            />
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default Index;
