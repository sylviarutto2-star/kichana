import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { KES, cn, withTimeout } from "@/lib/utils";
import { addDays, format, setHours, setMinutes } from "date-fns";
import { Calendar, MapPin, Clock, Loader2, X } from "lucide-react";
import { toast } from "sonner";

type Row = any;
type Policy = {
  stylist_id: string;
  cancellation_hours: number | null;
  deposit_refundable: boolean | null;
};

const SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const DEFAULT_CANCELLATION_HOURS = 24;

export default function Bookings() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [policies, setPolicies] = useState<Record<string, Policy>>({});
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reschedFor, setReschedFor] = useState<Row | null>(null);

  useEffect(() => {
    if (profile?.role === "stylist") nav("/studio", { replace: true });
  }, [profile, nav]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*, services(title), stylists(display_name, base_location)")
          .eq("customer_id", user.id)
          .order("scheduled_for", { ascending: false });
        if (error) {
          console.error("Bookings: query failed", error);
          if (!cancelled) toast.error(error.message || "Couldn't load your bookings.");
        }
        if (!cancelled) setRows(data || []);

        const completedIds = (data || [])
          .filter((b: any) => b.status === "completed")
          .map((b: any) => b.id);
        if (completedIds.length) {
          const { data: revs } = await (supabase as any)
            .from("reviews")
            .select("booking_id")
            .in("booking_id", completedIds);
          if (!cancelled && revs) {
            setReviewedIds(new Set(revs.map((r: any) => r.booking_id as string)));
          }
        }

        const stylistIds = Array.from(new Set((data || []).map((b: any) => b.stylist_id)));
        if (stylistIds.length) {
          const { data: pols } = await (supabase as any)
            .from("stylist_policies")
            .select("stylist_id, cancellation_hours, deposit_refundable")
            .in("stylist_id", stylistIds);
          if (!cancelled && pols) {
            const map: Record<string, Policy> = {};
            for (const p of pols as Policy[]) map[p.stylist_id] = p;
            setPolicies(map);
          }
        }
      } catch (e) {
        console.error("Bookings: fetch threw", e);
        if (!cancelled) toast.error("Couldn't load your bookings. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const payDeposit = async (b: Row) => {
    setPayingId(b.id);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("paystack-initialize", {
          body: {
            booking_id: b.id,
            callback_url: `${window.location.origin}/payment/callback`,
          },
        }),
        20000,
        "Starting Paystack",
      );
      if (error) throw error;
      if ((data as any)?.simulated) {
        toast.success("Deposit received. Booking confirmed.");
        setRows((rs) => rs.map((r) => (r.id === b.id ? { ...r, status: "confirmed", payment_status: "deposit_paid" } : r)));
      } else if ((data as any)?.authorization_url) {
        window.location.href = (data as any).authorization_url;
      } else {
        toast.error("Couldn't start payment. Try again.");
      }
    } catch (e: any) {
      toast.error(e.message || "Couldn't start payment. Try again.");
    } finally {
      setPayingId(null);
    }
  };

  const cancelBooking = async (b: Row) => {
    if (!user) return;
    const policy = policies[b.stylist_id];
    const hoursLeft = (new Date(b.scheduled_for).getTime() - Date.now()) / 3_600_000;
    const cutoff = policy?.cancellation_hours ?? DEFAULT_CANCELLATION_HOURS;
    const inWindow = hoursLeft >= cutoff;
    const depositPaid = b.payment_status === "deposit_paid";

    let refundLine = "";
    if (depositPaid) {
      if (inWindow && policy?.deposit_refundable) {
        refundLine = "Your deposit will be refunded.";
      } else if (inWindow) {
        refundLine = "Per this stylist's policy, the deposit is non-refundable.";
      } else {
        refundLine = `Cancelling inside the ${cutoff}h window means the deposit isn't refundable.`;
      }
    }

    const msg = [
      `Cancel ${b.services?.title || "this appointment"} with ${b.stylists?.display_name || "your stylist"}?`,
      refundLine,
    ].filter(Boolean).join("\n\n");

    if (!window.confirm(msg)) return;

    setCancellingId(b.id);
    try {
      const result = (await withTimeout(
        supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancelled_by: "customer",
          })
          .eq("id", b.id),
        15000,
        "Cancel booking",
      )) as { error: any };
      if (result.error) throw result.error;
      setRows((rs) => rs.map((r) => (r.id === b.id ? { ...r, status: "cancelled" } : r)));
      toast.success("Booking cancelled. Your stylist has been notified.");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't cancel. Try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const now = Date.now();
  const filtered = rows.filter((r) => {
    const t = new Date(r.scheduled_for).getTime();
    return tab === "upcoming" ? t >= now - 3600_000 : t < now - 3600_000;
  });

  const canModify = (b: Row) => {
    if (!["pending", "confirmed"].includes(b.status)) return false;
    return new Date(b.scheduled_for).getTime() > Date.now();
  };

  return (
    <div className="pb-28 min-h-screen">
      <PageHeader title="My bookings" />
      <div className="container-app">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("upcoming")} className={tab === "upcoming" ? "chip-active" : "chip"}>Upcoming</button>
          <button onClick={() => setTab("past")} className={tab === "past" ? "chip-active" : "chip"}>Past</button>
        </div>

        {loading && <div className="skeleton h-32 rounded-2xl" />}

        {!loading && filtered.length === 0 && (
          <div className="card p-8 text-center text-mute">
            <div className="font-display text-xl text-ink">No bookings yet</div>
            <p className="text-sm mt-2">Browse stylists in Discover to book your first.</p>
            <div className="mt-4">
              <Link to="/discover" className="btn-primary">Find a stylist</Link>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {filtered.map((b) => {
            const policy = policies[b.stylist_id];
            const cutoff = policy?.cancellation_hours ?? DEFAULT_CANCELLATION_HOURS;
            const hoursLeft = (new Date(b.scheduled_for).getTime() - Date.now()) / 3_600_000;
            const modifiable = canModify(b);
            const lateWindow = modifiable && hoursLeft < cutoff;
            return (
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{b.services?.title || "Service"}</div>
                    <div className="text-xs text-mute mt-1">with {b.stylists?.display_name || "your stylist"}</div>
                    <div className="mt-2 text-xs text-mute flex flex-wrap gap-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(b.scheduled_for), "EEE d MMM")}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(b.scheduled_for), "HH:mm")}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.location_type === "salon" ? b.stylists?.base_location : "Home"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Status s={b.status} />
                    <div className="font-display text-lg mt-2">{KES(b.amount_kes)}</div>
                    <div className="text-[10px] text-mute uppercase">{(b.payment_status || "unpaid").replace("_", " ")}</div>
                  </div>
                </div>

                {(b.payment_status || "unpaid") === "unpaid" && !["cancelled", "completed", "no_show"].includes(b.status) && (
                  <button
                    onClick={() => payDeposit(b)}
                    disabled={payingId === b.id}
                    className="btn-primary w-full mt-3"
                  >
                    {payingId === b.id ? "Starting payment…" : `Pay deposit ${KES(b.deposit_kes)}`}
                  </button>
                )}

                {modifiable && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setReschedFor(b)}
                      className="btn-outline text-sm"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => cancelBooking(b)}
                      disabled={cancellingId === b.id}
                      className="btn-outline text-sm text-terracotta-600 border-terracotta-300 hover:bg-terracotta-50"
                    >
                      {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                )}
                {lateWindow && (
                  <div className="mt-2 text-[11px] text-mute leading-relaxed">
                    Heads up: this is inside the {cutoff}h window — cancelling now means {b.payment_status === "deposit_paid" ? "your deposit isn't refundable" : "your stylist has already blocked the time"}.
                  </div>
                )}

                {b.status === "completed" && (
                  reviewedIds.has(b.id) ? (
                    <Link to={`/review/${b.id}`} className="btn-outline w-full mt-3">
                      Edit your review
                    </Link>
                  ) : (
                    <Link to={`/review/${b.id}`} className="btn-primary w-full mt-3">
                      Write a review
                    </Link>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {reschedFor && (
        <RescheduleModal
          booking={reschedFor}
          onClose={() => setReschedFor(null)}
          onSaved={(newIso) => {
            setRows((rs) => rs.map((r) => (r.id === reschedFor.id ? { ...r, scheduled_for: newIso } : r)));
            setReschedFor(null);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

function RescheduleModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: Row;
  onClose: () => void;
  onSaved: (newIso: string) => void;
}) {
  const original = new Date(booking.scheduled_for);
  const [date, setDate] = useState<Date>(() => {
    const tomorrow = addDays(new Date(), 1);
    return original.getTime() > Date.now() ? original : tomorrow;
  });
  const [time, setTime] = useState<string>(format(original, "HH:mm"));
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1)), []);

  const submit = async () => {
    const [h, m] = time.split(":").map(Number);
    const newDate = setMinutes(setHours(date, h), m);
    if (newDate.getTime() <= Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }
    if (newDate.getTime() === original.getTime()) {
      toast.error("That's already the booked time.");
      return;
    }
    setBusy(true);
    try {
      const result = (await withTimeout(
        supabase
          .from("bookings")
          .update({ scheduled_for: newDate.toISOString() })
          .eq("id", booking.id),
        15000,
        "Reschedule",
      )) as { error: any };
      if (result.error) throw result.error;
      toast.success("Rescheduled. Your stylist will see the new time.");
      onSaved(newDate.toISOString());
    } catch (e: any) {
      toast.error(e?.message || "Couldn't reschedule. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-cream w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Reschedule</h2>
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-full hover:bg-line">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-sm text-mute mb-4">
          {booking.services?.title || "Your appointment"} with {booking.stylists?.display_name || "your stylist"}
          <div className="text-xs mt-1">
            Currently: {format(original, "EEE d MMM 'at' HH:mm")}
          </div>
        </div>

        <label className="label">Pick a new day</label>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2 mb-4">
          {days.map((d) => {
            const active = d.toDateString() === date.toDateString();
            return (
              <button
                key={d.toISOString()}
                onClick={() => setDate(d)}
                className={cn(
                  "shrink-0 rounded-2xl px-3 py-2 text-center min-w-[64px] border",
                  active ? "bg-aubergine-700 text-cream border-aubergine-700" : "bg-cream border-line text-ink",
                )}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-70">{format(d, "EEE")}</div>
                <div className="font-display text-lg leading-tight">{format(d, "d")}</div>
                <div className="text-[10px] opacity-70">{format(d, "MMM")}</div>
              </button>
            );
          })}
        </div>

        <label className="label">Pick a new time</label>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {SLOTS.map((t) => (
            <button key={t} onClick={() => setTime(t)} className={cn(t === time ? "chip-active" : "chip", "justify-center")}>{t}</button>
          ))}
        </div>

        <div className="text-xs text-mute mb-4 leading-relaxed">
          Your stylist will see the new time immediately. If they can't make it work, they'll be in touch.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={onClose} className="btn-outline">Keep current</button>
          <button onClick={submit} disabled={busy} className="btn-primary">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm new time
          </button>
        </div>
      </div>
    </div>
  );
}

function Status({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending: "bg-gold-400/30 text-aubergine-700",
    confirmed: "bg-sage/20 text-aubergine-700",
    in_progress: "bg-terracotta-100 text-terracotta-700",
    completed: "bg-aubergine-700 text-cream",
    cancelled: "bg-line text-mute",
    no_show: "bg-line text-mute",
  };
  return <span className={`inline-block text-[10px] uppercase tracking-wider rounded-full px-2 py-1 ${map[s] || "bg-line"}`}>{s.replace("_", " ")}</span>;
}
