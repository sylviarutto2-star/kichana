import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { NAIROBI_AREAS, SERVICE_CATEGORIES, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ArrowRight, ArrowLeft, Loader2, Scissors, User, Check } from "lucide-react";

type Role = "customer" | "stylist";

const HAIR_TYPES = ["3a", "3b", "3c", "4a", "4b", "4c", "relaxed", "locs", "wig wearer"];

// Accepts Kenyan-style numbers: 07XX XXX XXX, 01XX…, or +254 / 254 prefixed.
function isValidPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 12;
}

export default function Onboarding() {
  const { user, profile, loading, updateProfileLocally } = useAuth();
  const [params] = useSearchParams();
  const presetRole: Role = params.get("role") === "stylist" ? "stylist" : "customer";

  const [role, setRole] = useState<Role | null>(null);
  const [step, setStep] = useState(0);

  // shared
  const [neighborhood, setNeighborhood] = useState("Westlands");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [phone, setPhone] = useState("");

  // customer
  const [hairType, setHairType] = useState("4c");
  const [allergies, setAllergies] = useState("");
  const [birthday, setBirthday] = useState("");

  // stylist
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [travels, setTravels] = useState(false);

  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const totalSteps = role === "stylist" ? 4 : role === "customer" ? 3 : 1;

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const pickRole = (r: Role) => {
    setRole(r);
    setStep(1);
  };

  const finish = async () => {
    if (!user || !role) return;
    if (!isValidPhone(phone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }
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
          allergies: role === "customer" ? allergies || null : null,
          birthday: role === "customer" && birthday ? birthday : null,
          onboarding_complete: true,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      if (role === "stylist") {
        // Don't create a duplicate studio if onboarding is somehow re-run.
        const { data: existing } = await supabase
          .from("stylists")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();

        const studioPayload = {
          display_name: displayName.trim() || "My Studio",
          bio: bio.trim() || null,
          specialties,
          neighborhoods: [neighborhood],
          base_location: neighborhood,
          travels,
        };

        const { error: sErr } = existing
          ? await supabase.from("stylists").update(studioPayload).eq("id", (existing as any).id)
          : await supabase.from("stylists").insert({ profile_id: user.id, ...studioPayload });
        if (sErr) throw sErr;
      }

      updateProfileLocally({ onboarding_complete: true, role, neighborhood, language, phone });
      toast.success(role === "stylist" ? "Studio created — add your services next." : "You're all set!");
      nav(role === "stylist" ? "/studio" : "/home", { replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save your details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (!user) return <LoadingScreen />;
  if (profile?.onboarding_complete) {
    return <Navigate to={profile.role === "stylist" ? "/studio" : "/home"} replace />;
  }

  // ── Steps ──────────────────────────────────────────────────────────────
  const canContinueLocation = isValidPhone(phone) && !!neighborhood;
  const canContinueStudio = displayName.trim().length > 0 && bio.trim().length > 0;
  const canFinishStylist = specialties.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="container-app pt-6"><Logo /></header>

      <main className="flex-1 container-app py-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-terracotta-600" : "bg-line",
              )}
            />
          ))}
        </div>
        <div className="text-xs text-mute mb-4">Step {step + 1} of {totalSteps}</div>

        {/* Step 0 — account type */}
        {step === 0 && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">How will you use Kichana?</h1>
            <p className="text-mute mt-2">Choose the account that fits you.</p>
            <div className="grid gap-3 mt-6">
              <button
                onClick={() => pickRole("customer")}
                className={cn(
                  "card p-5 text-left flex items-start gap-4 hover:border-terracotta-300 transition",
                  presetRole === "customer" && "border-terracotta-200",
                )}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-terracotta-50 text-terracotta-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">I'm booking hair</div>
                  <p className="text-sm text-mute mt-1">Discover stylists, book appointments and save inspirations.</p>
                </div>
              </button>
              <button
                onClick={() => pickRole("stylist")}
                className={cn(
                  "card p-5 text-left flex items-start gap-4 hover:border-terracotta-300 transition",
                  presetRole === "stylist" && "border-terracotta-200",
                )}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-aubergine-700 text-cream">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">I'm a stylist or salon</div>
                  <p className="text-sm text-mute mt-1">List your services, manage bookings and build a portfolio.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── CUSTOMER ───────────────────────────────────────────────────── */}
        {role === "customer" && step === 1 && (
          <LocationStep
            title="Where in Nairobi?"
            subtitle="We'll show you stylists nearby first."
            neighborhood={neighborhood} setNeighborhood={setNeighborhood}
            phone={phone} setPhone={setPhone}
            language={language} setLanguage={setLanguage}
            onBack={back} onNext={next} canNext={canContinueLocation}
          />
        )}

        {role === "customer" && step === 2 && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">A bit about your hair</h1>
            <p className="text-mute mt-2">This travels with you to every booking so stylists can prep.</p>
            <div className="mt-6">
              <label className="label">Hair type</label>
              <div className="flex flex-wrap gap-2">
                {HAIR_TYPES.map((t) => (
                  <button key={t} onClick={() => setHairType(t)} className={hairType === t ? "chip-active" : "chip"}>{t}</button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <label className="label">Allergies / sensitivities (optional)</label>
              <textarea rows={3} className="input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. mineral oil, sulphates" />
            </div>
            <div className="mt-6">
              <label className="label">Birthday (optional)</label>
              <input type="date" className="input" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              <p className="text-xs text-mute mt-1">Used only for birthday treats from stylists you book.</p>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={back} className="btn-outline"><ArrowLeft className="h-4 w-4" /> Back</button>
              <button onClick={finish} disabled={busy} className="btn-primary flex-1">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Finish
              </button>
            </div>
          </div>
        )}

        {/* ── STYLIST ────────────────────────────────────────────────────── */}
        {role === "stylist" && step === 1 && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">Set up your studio</h1>
            <p className="text-mute mt-2">You can change all of this later in Studio.</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="label">Display name</label>
                <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Amani Braids Studio" />
              </div>
              <div>
                <label className="label">Short bio</label>
                <textarea rows={3} className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What you specialise in. Years of experience." />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={back} className="btn-outline"><ArrowLeft className="h-4 w-4" /> Back</button>
              <button onClick={next} disabled={!canContinueStudio} className="btn-primary flex-1">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {role === "stylist" && step === 2 && (
          <div className="animate-fade-up">
            <h1 className="font-display text-3xl">What do you do?</h1>
            <p className="text-mute mt-2">Pick at least one specialty. Clients filter by these.</p>
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
              <button onClick={back} className="btn-outline"><ArrowLeft className="h-4 w-4" /> Back</button>
              <button onClick={next} disabled={!canFinishStylist} className="btn-primary flex-1">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {role === "stylist" && step === 3 && (
          <div className="animate-fade-up">
            <LocationStep
              title="Where are you based?"
              subtitle="Your home base. Clients near here see you first."
              neighborhood={neighborhood} setNeighborhood={setNeighborhood}
              phone={phone} setPhone={setPhone}
              language={language} setLanguage={setLanguage}
              hideActions
            />
            <label className="mt-6 flex items-center justify-between rounded-2xl border border-line p-3">
              <div>
                <div className="font-semibold text-sm">Offer home visits</div>
                <div className="text-xs text-mute">Travel to clients instead of salon-only.</div>
              </div>
              <input
                type="checkbox" className="h-5 w-5"
                checked={travels}
                onChange={(e) => setTravels(e.target.checked)}
              />
            </label>
            <div className="mt-8 flex gap-3">
              <button onClick={back} className="btn-outline"><ArrowLeft className="h-4 w-4" /> Back</button>
              <button onClick={finish} disabled={busy || !canContinueLocation} className="btn-primary flex-1">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Create studio
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LocationStep({
  title, subtitle, neighborhood, setNeighborhood, phone, setPhone,
  language, setLanguage, onBack, onNext, canNext, hideActions,
}: {
  title: string;
  subtitle: string;
  neighborhood: string;
  setNeighborhood: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  language: "en" | "sw";
  setLanguage: (v: "en" | "sw") => void;
  onBack?: () => void;
  onNext?: () => void;
  canNext?: boolean;
  hideActions?: boolean;
}) {
  const phoneOk = useMemo(() => phone === "" || isValidPhone(phone), [phone]);
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="text-mute mt-2">{subtitle}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {NAIROBI_AREAS.map((a) => (
          <button
            key={a}
            onClick={() => setNeighborhood(a)}
            className={neighborhood === a ? "chip-active" : "chip"}
          >{a}</button>
        ))}
      </div>
      <div className="mt-6">
        <label className="label">Phone (M-Pesa)</label>
        <input
          className="input"
          placeholder="07XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {!phoneOk && <p className="text-xs text-terracotta-600 mt-1">Enter a valid phone number.</p>}
      </div>
      <div className="mt-6">
        <label className="label">Language</label>
        <div className="flex gap-2">
          <button onClick={() => setLanguage("en")} className={language === "en" ? "chip-active" : "chip"}>English</button>
          <button onClick={() => setLanguage("sw")} className={language === "sw" ? "chip-active" : "chip"}>Kiswahili</button>
        </div>
      </div>
      {!hideActions && (
        <div className="mt-8 flex gap-3">
          <button onClick={onBack} className="btn-outline"><ArrowLeft className="h-4 w-4" /> Back</button>
          <button onClick={onNext} disabled={!canNext} className="btn-primary flex-1">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
