import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Siren, MapPin, Navigation2, Check } from "lucide-react";
import { mockStylists } from "@/data/mockData";

const issues = [
  "Botched color / dye",
  "Broken or damaged braids",
  "Bad cut to fix",
  "Burnt or fried hair",
  "Wig install gone wrong",
  "Other emergency",
];

const Sos = () => {
  const navigate = useNavigate();
  const [issue, setIssue] = useState<string | null>(null);
  const [where, setWhere] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Surface female-presenting stylists with strong reviews as "rescue specialists"
  const responders = mockStylists.filter((s) => s.rating >= 4.7).slice(0, 4);

  const broadcast = () => {
    if (!issue) return;
    setSubmitted(true);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => setWhere("Current location"),
      () => setWhere("Nairobi, Kenya"),
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background pb-28"
    >
      <div className="px-5 pt-5 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Siren className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-[20px] font-semibold tracking-tight">Hair SOS</h1>
        </div>
      </div>

      <div className="px-5 mt-4">
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          Tell us what's wrong and where you are. We'll alert verified female specialists in hair repair nearby —
          you'll get responses within minutes.
          <span className="block mt-2 text-[11.5px] text-foreground/70">
            Emergency dispatch fee applies (KES 800–1,500) and is shown before you confirm.
          </span>
        </p>
      </div>

      {!submitted ? (
        <>
          <section className="px-5 mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">What happened?</p>
            <div className="grid grid-cols-2 gap-2">
              {issues.map((i) => (
                <button
                  key={i}
                  onClick={() => setIssue(i)}
                  className={`text-left px-3 py-3 rounded-xl border text-[13px] font-medium transition-colors ${
                    issue === i
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </section>

          <section className="px-5 mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Where are you?</p>
            <label className="flex items-center gap-2.5 px-3 h-12 rounded-xl bg-secondary/60">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Address or area"
                className="flex-1 bg-transparent text-[14px] placeholder:text-muted-foreground focus:outline-none"
              />
              <button onClick={useMyLocation} className="text-[11px] font-semibold text-primary flex items-center gap-1">
                <Navigation2 className="h-3 w-3" /> Me
              </button>
            </label>
          </section>

          <div className="px-5 mt-6">
            <button
              onClick={broadcast}
              disabled={!issue}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] disabled:opacity-50"
            >
              Broadcast to nearby specialists
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              You won't be charged until you confirm a stylist.
            </p>
          </div>
        </>
      ) : (
        <section className="px-5 mt-6">
          <div className="flex items-center gap-2 text-accent">
            <Check className="h-4 w-4" />
            <p className="text-[13px] font-semibold">Broadcast sent — responders incoming</p>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">First responses usually arrive in under 4 minutes.</p>

          <div className="mt-5 space-y-3">
            {responders.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/stylist/${s.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border text-left"
              >
                <img src={s.image} alt={s.name} className="h-14 w-14 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="text-[14px] font-semibold leading-tight">{s.name}</p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">
                    {s.category} · ⭐ {s.rating} ({s.reviews})
                  </p>
                  <p className="text-[11px] text-primary font-medium mt-0.5">Available now · ETA 20–35 min</p>
                </div>
                <span className="text-[11px] font-semibold text-foreground">From KES {s.startingPrice.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default Sos;
