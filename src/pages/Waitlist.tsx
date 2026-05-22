import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { NAIROBI_AREAS, SERVICE_CATEGORIES } from "@/lib/utils";
import { ArrowRight, Check, Instagram, MapPin, Sparkles } from "lucide-react";

type Role = "customer" | "stylist";

const phoneRe = /^[+0-9 ()-]{7,}$/;

const customerSchema = z.object({
  full_name: z.string().trim().min(2, "Please tell us your name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(phoneRe, "Enter a valid phone number"),
  sms_opt_in: z.boolean(),
});

const stylistSchema = z.object({
  full_name: z.string().trim().min(2, "Please tell us your name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(phoneRe, "Enter a valid phone number"),
  area: z.string().trim().min(2, "Pick or type your area"),
  services: z.array(z.string()).min(1, "Choose at least one service"),
  years_experience: z
    .union([z.number().int().min(0).max(60), z.nan()])
    .optional()
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null)),
  work_mode: z.enum(["home", "salon", "both"]),
  instagram_url: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});

export default function Waitlist() {
  const [params, setParams] = useSearchParams();
  const role: Role = params.get("role") === "stylist" ? "stylist" : "customer";

  const setRole = (r: Role) => {
    const next = new URLSearchParams(params);
    if (r === "stylist") next.set("role", "stylist");
    else next.delete("role");
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="container-wide py-6 flex items-center justify-between">
        <Logo />
        <Link to="/auth" className="btn-ghost text-sm">Sign in</Link>
      </header>

      <main className="container-wide flex-1 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start py-8">
        <div>
          <p className="h-eyebrow mb-4">Join the waitlist</p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
            Be first in the chair when{" "}
            <em className="not-italic text-terracotta-600">Kichana</em> opens.
          </h1>
          <p className="mt-5 text-lg text-mute max-w-md">
            We're launching in Nairobi soon. Sign up to get early access — customers get{" "}
            <span className="font-semibold text-ink">10% off their first booking</span>,
            stylists get priority onboarding.
          </p>

          <div className="mt-8 inline-flex rounded-2xl border border-line bg-white p-1">
            <RoleTab active={role === "customer"} onClick={() => setRole("customer")}>
              I'm a customer
            </RoleTab>
            <RoleTab active={role === "stylist"} onClick={() => setRole("stylist")}>
              I'm a stylist
            </RoleTab>
          </div>

          <ul className="mt-8 space-y-3 text-sm text-mute max-w-md">
            <Perk icon={<Sparkles className="h-4 w-4" />}>
              {role === "customer"
                ? "10% off your first booking on launch day."
                : "Free verified-stylist badge for early signups."}
            </Perk>
            <Perk icon={<MapPin className="h-4 w-4" />}>
              {role === "customer"
                ? "Book Nairobi's best — salon or at-home."
                : "Get matched with clients in your area first."}
            </Perk>
            <Perk icon={<Check className="h-4 w-4" />}>
              {role === "customer"
                ? "We'll email you the moment we open."
                : "M-Pesa payouts and a verified portfolio from day one."}
            </Perk>
          </ul>
        </div>

        <div>
          {role === "customer" ? <CustomerForm /> : <StylistForm />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function RoleTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-4 py-2 text-sm font-semibold transition " +
        (active ? "bg-ink text-cream" : "text-mute hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function Perk({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-lg bg-terracotta-50 text-terracotta-600">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

function SuccessCard({ role }: { role: Role }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto h-12 w-12 grid place-items-center rounded-full bg-sage/20 text-sage">
        <Check className="h-6 w-6" />
      </div>
      <h2 className="font-display text-2xl mt-4">You're in.</h2>
      <p className="text-sm text-mute mt-2">
        {role === "customer"
          ? "We'll email you the moment Kichana opens — and your 10% off will be waiting."
          : "Thanks! We'll reach out shortly to get your profile set up before launch."}
      </p>
    </div>
  );
}

function friendlyError(err: { code?: string; message?: string } | null) {
  if (!err) return "Something went wrong. Please try again.";
  if (err.code === "23505") return "Looks like that email is already on the list.";
  return err.message || "Something went wrong. Please try again.";
}

function CustomerForm() {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sms_opt_in, setSms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return <SuccessCard role="customer" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customerSchema.safeParse({ full_name, email, phone, sms_opt_in });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("waitlist_customers").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      sms_opt_in: parsed.data.sms_opt_in,
      email_opt_in: true,
    });
    setSubmitting(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("You're on the list — 10% off coming your way.");
    setDone(true);
  };

  return (
    <form onSubmit={submit} className="card p-6 md:p-8 space-y-5">
      <div>
        <h2 className="font-display text-2xl">Customer waitlist</h2>
        <p className="text-sm text-mute mt-1">
          Get 10% off your first booking. We'll email you as soon as we launch.
        </p>
      </div>

      <Field label="Full name">
        <input
          className="input"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Wanjiku Mwangi"
          autoComplete="name"
        />
      </Field>

      <Field label="Email">
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Phone">
        <input
          className="input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XX XXX XXX"
          autoComplete="tel"
        />
      </Field>

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={sms_opt_in}
          onChange={(e) => setSms(e.target.checked)}
          className="mt-1 h-4 w-4 accent-terracotta-600"
        />
        <span className="text-sm">
          <span className="font-semibold">Text me launch updates by SMS.</span>{" "}
          <span className="text-mute">We'll always email you too.</span>
        </span>
      </label>

      <button className="btn-primary w-full" disabled={submitting}>
        {submitting ? "Joining…" : (
          <>Claim my 10% off <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
      <p className="text-[11px] text-mute text-center">
        By joining you agree to our{" "}
        <Link to="/terms" className="underline">Terms</Link> and{" "}
        <Link to="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}

const OTHER_AREA = "__other__";

function StylistForm() {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [areaPick, setAreaPick] = useState<string>(NAIROBI_AREAS[0]);
  const [customArea, setCustomArea] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [years, setYears] = useState<string>("");
  const [work_mode, setWorkMode] = useState<"home" | "salon" | "both">("salon");
  const [instagram_url, setInstagram] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const area = useMemo(
    () => (areaPick === OTHER_AREA ? customArea.trim() : areaPick),
    [areaPick, customArea]
  );

  if (done) return <SuccessCard role="stylist" />;

  const toggleService = (id: string) =>
    setServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = stylistSchema.safeParse({
      full_name,
      email,
      phone,
      area,
      services,
      years_experience: years === "" ? NaN : Number(years),
      work_mode,
      instagram_url,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("waitlist_stylists").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      area: parsed.data.area,
      services: parsed.data.services,
      years_experience: parsed.data.years_experience,
      work_mode: parsed.data.work_mode,
      instagram_url: parsed.data.instagram_url,
    });
    setSubmitting(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Welcome — we'll be in touch before launch.");
    setDone(true);
  };

  return (
    <form onSubmit={submit} className="card p-6 md:p-8 space-y-5">
      <div>
        <h2 className="font-display text-2xl">Stylist waitlist</h2>
        <p className="text-sm text-mute mt-1">
          Tell us about you and we'll prioritise your onboarding before launch day.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <input
            className="input"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Amani Njoroge"
            autoComplete="name"
          />
        </Field>
        <Field label="Phone">
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            autoComplete="tel"
          />
        </Field>
      </div>

      <Field label="Email">
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Area in Nairobi">
        <select
          className="input"
          value={areaPick}
          onChange={(e) => setAreaPick(e.target.value)}
        >
          {NAIROBI_AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
          <option value={OTHER_AREA}>Other (type below)…</option>
        </select>
        {areaPick === OTHER_AREA && (
          <input
            className="input mt-3"
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            placeholder="e.g. Syokimau"
          />
        )}
      </Field>

      <Field label="Services you provide">
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES.map((c) => {
            const on = services.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleService(c.id)}
                className={on ? "chip-active" : "chip"}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Years of experience">
          <input
            className="input"
            type="number"
            min={0}
            max={60}
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="e.g. 5"
          />
        </Field>
        <Field label="Where you work">
          <div className="flex flex-wrap gap-2">
            {(["home", "salon", "both"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setWorkMode(m)}
                className={work_mode === m ? "chip-active" : "chip"}
              >
                {m === "home" ? "At-home" : m === "salon" ? "In a salon" : "Both"}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Instagram or portfolio link (optional)">
        <div className="relative">
          <Instagram className="h-4 w-4 text-mute absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-10"
            value={instagram_url}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="instagram.com/yourhandle"
          />
        </div>
      </Field>

      <button className="btn-primary w-full" disabled={submitting}>
        {submitting ? "Joining…" : (
          <>Join the stylist waitlist <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
      <p className="text-[11px] text-mute text-center">
        By joining you agree to our{" "}
        <Link to="/terms" className="underline">Terms</Link> and{" "}
        <Link to="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
