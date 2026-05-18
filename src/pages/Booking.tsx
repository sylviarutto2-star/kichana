import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { demoServices, demoStylists, isDemo } from "@/lib/demoData";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { KES, cn } from "@/lib/utils";
import { addDays, format, setHours, setMinutes } from "date-fns";
import { Check, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import type { Service, Stylist } from "@/lib/database.types";

export default function Booking() {
  const { stylistId } = useParams();
  const [params] = useSearchParams();
  const initialServiceId = params.get("service") || undefined;
  const nav = useNavigate();
  const { user, profile } = useAuth();

  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string | undefined>(initialServiceId);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<Date>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("10:00");
  const [locationType, setLocationType] = useState<"salon" | "home">("salon");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!stylistId) return;
    let cancelled = false;
    (async () => {
      try {
        if (isDemo(stylistId)) {
          if (cancelled) return;
          setStylist(demoStylists.find((x) => x.id === stylistId) as any);
          setServices(demoServices[stylistId] || []);
          return;
        }
        const [{ data: s }, { data: svc }] = await Promise.all([
          supabase.from("stylists").select("*").eq("id", stylistId).maybeSingle(),
          supabase.from("services").select("*").eq("stylist_id", stylistId).eq("active", true),
        ]);
        if (cancelled) return;
        setStylist(s as any);
        setServices((svc as Service[]) || []);
      } catch {
        if (!cancelled) toast.error("Couldn't load this stylist. Please try again.");
      }
    })();
    return () => { cancelled = true; };
  }, [stylistId]);

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  const times = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  const deposit = service ? Math.max(500, Math.round(service.price_kes * 0.3 / 100) * 100) : 0;

  const confirm = async () => {
    if (!user || !service || !stylist) return;
    if (isDemo(stylist.id)) {
      toast.error("This is a demo stylist. Please pick a real, onboarded stylist to book.");
      return;
    }
    setBusy(true);
    try {
      const [h, m] = time.split(":").map(Number);
      const scheduled = setMinutes(setHours(date, h), m).toISOString();

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: user.id,
          stylist_id: stylist.id,
          service_id: service.id,
          scheduled_for: scheduled,
          location_type: locationType,
          address: locationType === "home" ? address : null,
          amount_kes: service.price_kes,
          deposit_kes: deposit,
          notes,
        })
        .select()
        .single();
      if (error) throw error;

      // Trigger M-Pesa STK
      const { data: mpesa, error: mErr } = await supabase.functions.invoke("mpesa-stk", {
        body: { booking_id: booking.id, phone, amount: deposit },
      });
      if (mErr) {
        toast.warning("Booking saved. Payment couldn't start — pay later in My Bookings.");
      } else if ((mpesa as any)?.simulated) {
        toast.success("Booking confirmed (demo). Check your bookings.");
      } else {
        toast.success("Check your phone for the M-Pesa prompt 📲");
      }
      nav("/bookings");
    } catch (e: any) {
      toast.error(e.message || "Couldn't book. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-24 min-h-screen">
      <PageHeader title="Book" subtitle={stylist?.display_name || "—"} back backTo="/discover" />

      <div className="container-app">
        <Stepper step={step} />

        {step === 0 && (
          <div className="mt-6 grid gap-3 animate-fade-up">
            <div className="label">Choose a service</div>
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={cn("card p-4 text-left flex justify-between items-start gap-4", serviceId === s.id && "border-terracotta-500 ring-2 ring-terracotta-300")}
              >
                <div>
                  <div className="font-semibold">{s.title}</div>
                  {s.description && <p className="text-xs text-mute mt-1">{s.description}</p>}
                  <div className="text-xs text-mute mt-1">{Math.round(s.duration_min/60*10)/10}h</div>
                </div>
                <div className="font-display text-lg">{KES(s.price_kes)}</div>
              </button>
            ))}
            <button
              disabled={!serviceId}
              onClick={() => setStep(1)}
              className="btn-primary mt-4"
            >Continue</button>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 animate-fade-up">
            <div className="label">Pick a day</div>
            <div className="-mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar">
              {dates.map((d) => (
                <button
                  key={d.toISOString()}
                  onClick={() => setDate(d)}
                  className={cn(
                    "shrink-0 rounded-2xl border px-3 py-2 text-center min-w-[70px]",
                    format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                      ? "bg-ink text-cream border-ink"
                      : "bg-white border-line"
                  )}
                >
                  <div className="text-[10px] uppercase">{format(d, "EEE")}</div>
                  <div className="font-display text-lg">{format(d, "d")}</div>
                  <div className="text-[10px]">{format(d, "MMM")}</div>
                </button>
              ))}
            </div>

            <div className="label mt-6">Time</div>
            <div className="grid grid-cols-4 gap-2">
              {times.map((t) => (
                <button key={t} onClick={() => setTime(t)} className={cn(t === time ? "chip-active" : "chip", "justify-center")}>{t}</button>
              ))}
            </div>

            <div className="label mt-6">Where?</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setLocationType("salon")} className={cn(locationType === "salon" ? "chip-active" : "chip", "justify-center py-3")}>At the salon</button>
              <button onClick={() => setLocationType("home")} className={cn(locationType === "home" ? "chip-active" : "chip", "justify-center py-3")}>Come to me</button>
            </div>

            {locationType === "home" && (
              <div className="mt-3">
                <label className="label">Your address</label>
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Apartment, area, landmark" />
              </div>
            )}

            <div className="mt-3">
              <label className="label">Notes for stylist (optional)</label>
              <textarea rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Length, colour, vault references…" />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(0)} className="btn-outline">Back</button>
              <button onClick={() => setStep(2)} className="btn-primary flex-1">Review</button>
            </div>
          </div>
        )}

        {step === 2 && service && (
          <div className="mt-6 animate-fade-up space-y-4">
            <div className="card p-5 space-y-3 text-sm">
              <Row k="Service" v={service.title} />
              <Row k="When" v={`${format(date, "EEE d MMM")} · ${time}`} />
              <Row k="Where" v={locationType === "salon" ? `${stylist?.base_location} (salon)` : address || "Home"} />
              <hr className="border-line" />
              <Row k="Total" v={KES(service.price_kes)} />
              <Row k="Deposit (now)" v={KES(deposit)} accent />
              <Row k="Balance (after service)" v={KES(service.price_kes - deposit)} muted />
            </div>

            <div className="card p-5">
              <div className="label">M-Pesa phone</div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-mute" />
                <input className="input flex-1" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <p className="text-xs text-mute mt-2">You'll get an STK push to authorise the deposit.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-outline">Back</button>
              <button disabled={busy || !phone} onClick={confirm} className="btn-primary flex-1">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Pay deposit & confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, accent, muted }: { k: string; v: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-mute">{k}</span>
      <span className={cn("font-semibold", accent && "text-terracotta-600", muted && "text-mute")}>{v}</span>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      {["Service", "Date & place", "Pay"].map((l, i) => (
        <div key={l} className="flex-1">
          <div className={cn("h-1 rounded-full", i <= step ? "bg-terracotta-600" : "bg-line")} />
          <div className="mt-2 flex items-center gap-1 text-xs">
            {i < step ? <Check className="h-3 w-3 text-terracotta-600" /> : <span className={cn("inline-block h-2 w-2 rounded-full", i === step ? "bg-terracotta-600" : "bg-line")} />}
            <span className={i <= step ? "text-ink font-semibold" : "text-mute"}>{l}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
