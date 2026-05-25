import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { DisputeModal } from "@/components/DisputeModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { KES, withTimeout } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

type Row = any;

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function refundEligibility(b: Row): { eligible: boolean; copy: string } {
  const now = Date.now();
  const created = new Date(b.created_at).getTime();
  const scheduled = new Date(b.scheduled_for).getTime();
  const inGrace = now - created <= ONE_HOUR_MS;
  const beforeWindow = scheduled - now >= FOUR_HOURS_MS;
  const wasPaid = b.payment_status === "deposit_paid" || b.payment_status === "paid";
  if ((inGrace || beforeWindow) && wasPaid) {
    return { eligible: true, copy: `Your ${KES(b.deposit_kes)} deposit will be refunded to your card.` };
  }
  if ((inGrace || beforeWindow) && !wasPaid) {
    return { eligible: true, copy: "No deposit was paid — no refund needed." };
  }
  return {
    eligible: false,
    copy: "It's less than 4 hours before your appointment, so the deposit isn't auto-refunded. You can file a dispute after if something's wrong.",
  };
}

export default function Bookings() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [disputeForId, setDisputeForId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [reDate, setReDate] = useState("");
  const [reTime, setReTime] = useState("");
  const [reSaving, setReSaving] = useState(false);

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

        const ids = (data || []).map((b: any) => b.id);
        if (ids.length) {
          const [reviews, disputes] = await Promise.all([
            (supabase as any).from("reviews").select("booking_id").in("booking_id", ids),
            (supabase as any).from("disputes").select("booking_id").in("booking_id", ids),
          ]);
          if (!cancelled) {
            if (reviews.data) setReviewedIds(new Set(reviews.data.map((r: any) => r.booking_id)));
            if (disputes.data) setDisputedIds(new Set(disputes.data.map((d: any) => d.booking_id)));
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
    setCancellingId(b.id);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-booking", {
        body: { booking_id: b.id },
      });
      if (error) throw error;
      const res = data as any;
      if (res?.refunded) {
        toast.success(res.simulated ? "Cancelled. Deposit refunded (demo)." : "Cancelled. Your deposit is on its way back.");
      } else if (res?.pending) {
        toast.success("Cancelled. We'll process your refund within 48 hours.");
      } else if (res?.cancelled) {
        toast.success("Booking cancelled.");
      } else {
        toast.error(res?.error || "Couldn't cancel. Try again.");
      }
      setRows((rs) => rs.map((r) => r.id === b.id
        ? { ...r, status: "cancelled", refund_status: res?.refunded ? "refunded" : res?.pending ? "pending" : "none" }
        : r));
    } catch (e: any) {
      toast.error(e.message || "Couldn't cancel. Try again.");
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const now = Date.now();
  const filtered = rows.filter((r) => {
    const t = new Date(r.scheduled_for).getTime();
    return tab === "upcoming" ? t >= now - 3600_000 : t < now - 3600_000;
  });

  const confirmFor = confirmCancelId ? rows.find((r) => r.id === confirmCancelId) : null;
  const rescheduleFor = rescheduleId ? rows.find((r) => r.id === rescheduleId) : null;

  const openReschedule = (b: Row) => {
    const d = new Date(b.scheduled_for);
    setReDate(format(d, "yyyy-MM-dd"));
    setReTime(format(d, "HH:mm"));
    setRescheduleId(b.id);
  };

  const saveReschedule = async () => {
    if (!rescheduleFor) return;
    if (!reDate || !reTime) {
      toast.error("Pick a date and time.");
      return;
    }
    const newWhen = new Date(`${reDate}T${reTime}:00`);
    if (isNaN(newWhen.getTime()) || newWhen.getTime() < Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }
    setReSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("bookings")
        .update({ scheduled_for: newWhen.toISOString() })
        .eq("id", rescheduleFor.id);
      if (error) throw error;
      setRows((rs) => rs.map((r) => r.id === rescheduleFor.id ? { ...r, scheduled_for: newWhen.toISOString() } : r));
      toast.success("Booking rescheduled. Your stylist has been notified.");
      setRescheduleId(null);
    } catch (e: any) {
      toast.error(e.message || "Couldn't reschedule. Try again.");
    } finally {
      setReSaving(false);
    }
  };

  return (
    <div className="pb-nav-cta min-h-screen">
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
            const isUpcomingOpen =
              !["cancelled", "completed", "no_show", "in_progress"].includes(b.status) &&
              new Date(b.scheduled_for).getTime() >= now;
            const canDispute =
              b.status === "cancelled" &&
              (b.payment_status === "deposit_paid" || b.payment_status === "paid") &&
              (b.refund_status === "none" || b.refund_status === "denied" || !b.refund_status) &&
              !disputedIds.has(b.id);

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
                    <div className="text-[11px] text-mute uppercase">{(b.payment_status || "unpaid").replace("_", " ")}</div>
                    {b.refund_status && b.refund_status !== "none" && (
                      <div className="text-[11px] text-aubergine-700 mt-1 uppercase">refund {b.refund_status}</div>
                    )}
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
                {isUpcomingOpen && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => openReschedule(b)}
                      className="btn-outline"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setConfirmCancelId(b.id)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {canDispute && (
                  <button
                    onClick={() => setDisputeForId(b.id)}
                    className="btn-outline w-full mt-3"
                  >
                    Request a refund
                  </button>
                )}
                {b.status === "cancelled" && disputedIds.has(b.id) && (
                  <div className="text-xs text-mute mt-3 text-center">Dispute submitted — we'll be in touch within 48 hours.</div>
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

      {confirmFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40" onClick={() => setConfirmCancelId(null)}>
          <div className="card w-full max-w-md p-5 rounded-t-3xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-xl mb-2">Cancel this booking?</div>
            <p className="text-sm text-mute mb-4">{refundEligibility(confirmFor).copy}</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-outline" onClick={() => setConfirmCancelId(null)} disabled={cancellingId === confirmFor.id}>
                Keep booking
              </button>
              <button className="btn-primary" onClick={() => cancelBooking(confirmFor)} disabled={cancellingId === confirmFor.id}>
                {cancellingId === confirmFor.id ? "Cancelling…" : "Cancel booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40" onClick={() => setRescheduleId(null)}>
          <div className="card w-full max-w-md p-5 rounded-t-3xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-xl mb-2">Reschedule</div>
            <p className="text-sm text-mute mb-4">Pick a new date and time. Your stylist will be notified.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <label className="block">
                <div className="text-[11px] text-mute uppercase tracking-wider mb-1">Date</div>
                <input type="date" className="input" value={reDate} onChange={(e) => setReDate(e.target.value)} />
              </label>
              <label className="block">
                <div className="text-[11px] text-mute uppercase tracking-wider mb-1">Time</div>
                <input type="time" className="input" value={reTime} onChange={(e) => setReTime(e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-outline" onClick={() => setRescheduleId(null)} disabled={reSaving}>
                Keep current
              </button>
              <button className="btn-primary" onClick={saveReschedule} disabled={reSaving}>
                {reSaving ? "Saving…" : "Save change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {disputeForId && user && (
        <DisputeModal
          bookingId={disputeForId}
          userId={user.id}
          open={true}
          onClose={() => setDisputeForId(null)}
          onSubmitted={() => setDisputedIds((s) => new Set([...s, disputeForId]))}
        />
      )}

      <BottomNav />
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
  return <span className={`inline-block text-[11px] uppercase tracking-wider rounded-full px-2 py-1 ${map[s] || "bg-line"}`}>{s.replace("_", " ")}</span>;
}
