import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { NAIROBI_AREAS, SERVICE_CATEGORIES, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const initialRole = (params.get("role") === "stylist" ? "stylist" : "customer") as "customer" | "stylist";

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<"customer" | "stylist">(initialRole);
  const [neighborhood, setNeighborhood] = useState<string>("Westlands");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [phone, setPhone] = useState("");
  const [hairType, setHairType] = useState<string>("4c");
  const [allergies, setAllergies] = useState("");

  // stylist
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const nav = useNavigate();

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          role,
          neighborhood,
          language,
          phone,
          hair_type: role === "customer" ? hairType : null,
          allergies: role === "customer" ? allergies : null,
          onboarding_complete: true,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      if (role === "stylist") {
        const { error: sErr } = await supabase.from("stylists").insert({
          profile_id: user.id,
          display_name: displayName || "My Studio",
          bio,
          specialties,
          neighborhoods: [neighborhood],
          base_location: neighborhood,
        });
        if (sErr) throw sErr;
      }
      await refreshProfile();
      toast.success(role === "stylist" ? "Studio created. Add services in Studio." : "All set!");
      nav(role === "stylist" ? "/studio" : "/home");
    } catch (e: any) {
      toast.error(e.message || "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="container-app pt-6"><Logo /></header>

      <main className="flex-1 container-app py-6">
        <div className="text-xs text-mute mb-4">Step {step + 1} of {role === "stylist" ? 4 : 3}</div>

        {step === 0 && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">How will you use Kichana?</h1>
            <p className="text-mute mt-2">Pick one. You can switch later.</p>
            <div className="grid gap-3 mt-6">
              <button
                onClick={() => { setRole("customer"); next(); }}
                className={cn("card p-5 text-left hover:border-terracotta-300 transition", role === "customer" && "border-terracotta-500")}
              >
                <div className="font-semibold">I'm booking hair</div>
                <p className="text-sm text-mute mt-1">Discover stylists, book appointments, save inspirations.</p>
              </button>
              <button
                onClick={() => { setRole("stylist"); next(); }}
                className={cn("card p-5 text-left hover:border-terracotta-300 transition", role === "stylist" && "border-terracotta-500")}
              >
                <div className="font-semibold">I'm a stylist or salon</div>
                <p className="text-sm text-mute mt-1">List my services, manage bookings, build a portfolio.</p>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">Where in Nairobi?</h1>
            <p className="text-mute mt-2">{role === "customer" ? "We'll show stylists nearby first." : "Your home base."}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {NAIROBI_AREAS.map((a) => (
                <button
                  key={a}
                  onClick={() => setNeighborhood(a)}
                  className={cn(neighborhood === a ? "chip-active" : "chip")}
                >{a}</button>
              ))}
            </div>
            <div className="mt-6">
              <label className="label">Phone (M-Pesa)</label>
              <input className="input" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="mt-6">
              <label className="label">Language</label>
              <div className="flex gap-2">
                <button onClick={() => setLanguage("en")} className={language === "en" ? "chip-active" : "chip"}>English</button>
                <button onClick={() => setLanguage("sw")} className={language === "sw" ? "chip-active" : "chip"}>Kiswahili</button>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={back} className="btn-outline">Back</button>
              <button onClick={next} className="btn-primary flex-1">Continue <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {step === 2 && role === "customer" && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">A bit about your hair</h1>
            <p className="text-mute mt-2">Helps stylists prep — and travels with you to every booking.</p>
            <div className="mt-6">
              <label className="label">Hair type</label>
              <div className="flex flex-wrap gap-2">
                {["3a","3b","3c","4a","4b","4c","relaxed","locs","wig wearer"].map((t) => (
                  <button key={t} onClick={() => setHairType(t)} className={hairType === t ? "chip-active" : "chip"}>{t}</button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <label className="label">Allergies / sensitivities (optional)</label>
              <textarea rows={3} className="input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. mineral oil, sulphates" />
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={back} className="btn-outline">Back</button>
              <button onClick={finish} disabled={busy} className="btn-primary flex-1">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Finish
              </button>
            </div>
          </div>
        )}

        {step === 2 && role === "stylist" && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">Set up your studio</h1>
            <p className="text-mute mt-2">You can edit everything later in Studio.</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="label">Display name</label>
                <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Amani Braids Studio" />
              </div>
              <div>
                <label className="label">Short bio</label>
                <textarea rows={3} className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What you specialise in. Years experience." />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={back} className="btn-outline">Back</button>
              <button onClick={next} className="btn-primary flex-1">Continue <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {step === 3 && role === "stylist" && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">What do you do?</h1>
            <p className="text-mute mt-2">Pick your specialties.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map((c) => {
                const on = specialties.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSpecialties((s) => on ? s.filter((x) => x !== c.id) : [...s, c.id])}
                    className={on ? "chip-active" : "chip"}
                  >
                    <span className="mr-1">{c.emoji}</span>{c.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={back} className="btn-outline">Back</button>
              <button onClick={finish} disabled={busy} className="btn-primary flex-1">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Create studio
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
