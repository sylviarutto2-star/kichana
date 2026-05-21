import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { KES, withTimeout } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, Star } from "lucide-react";
import { toast } from "sonner";
import { LeaveReviewModal } from "@/components/LeaveReviewModal";
import { CancelBookingModal } from "@/components/CancelBookingModal";
import { ReviewStars } from "@/components/ReviewStars";

type Row = any;

export default function Bookings() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, { rating: number }>>({});
  const [reviewingBooking, setReviewingBooking] = useState<Row | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Row | null>(null);

  // Stylists/vendors don't have a customer "Bookings" page — their client
  // appointments live in Studio. Send them there.
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

        // Also fetch which of these bookings the customer already reviewed,
        // so we show "Your rating" instead of the Leave-a-review CTA.
        const ids = (data || []).map((b: any) => b.id);
        if (ids.length > 0) {
          const rv = await supabase
            .from("reviews")
            .select("booking_id, rating")
            .in("booking_id", ids);
          if (!cancelled && !rv.error && rv.data) {
            const map: Record<string, { rating: number }> = {};
            (rv.data as any[]).forEach((r) => {
              map[r.booking_id] = { rating: r.rating };
            });
            setReviewed(map);
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
        toast.success("Deposit confirmed (demo).");
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

  const now = Date.now();
  const filtered = rows.filter((r) => {
    const t = new Date(r.scheduled_for).getTime();
    return tab === "upcoming" ? t >= now - 3600_000 : t < now - 3600_000;
  });

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
            No bookings yet.
            <div className="mt-4">
              <Link to="/discover" className="btn-primary">Find a stylist</Link>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {filtered.map((b) => (
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
              {!["cancelled", "completed", "no_show"].includes(b.status) &&
                new Date(b.scheduled_for).getTime() > Date.now() && (
                  <button
                    onClick={() => setCancellingBooking(b)}
                    className="btn-outline w-full mt-2 !text-terracotta-600"
                  >
                    Cancel booking
                  </button>
                )}
              {b.status === "completed" && (
                reviewed[b.id] ? (
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-cream/70 border border-line px-3 py-2">
                    <span className="text-xs text-mute">Your review</span>
                    <ReviewStars value={reviewed[b.id].rating} size={14} />
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewingBooking(b)}
                    className="btn-outline w-full mt-3"
                  >
                    <Star className="h-4 w-4" /> Leave a review
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
      <CancelBookingModal
        open={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        booking={
          cancellingBooking
            ? {
                id: cancellingBooking.id,
                stylist_id: cancellingBooking.stylist_id,
                scheduled_for: cancellingBooking.scheduled_for,
                deposit_kes: cancellingBooking.deposit_kes || 0,
                payment_status: cancellingBooking.payment_status || "unpaid",
              }
            : null
        }
        onCancelled={(patch) => {
          setRows((rs) =>
            rs.map((r) => (r.id === cancellingBooking?.id ? { ...r, ...patch } : r)),
          );
        }}
      />
      <LeaveReviewModal
        open={!!reviewingBooking}
        onClose={() => setReviewingBooking(null)}
        booking={
          reviewingBooking
            ? {
                id: reviewingBooking.id,
                stylist_id: reviewingBooking.stylist_id,
                customer_id: reviewingBooking.customer_id,
                stylists: reviewingBooking.stylists,
                services: reviewingBooking.services,
              }
            : null
        }
        onSubmitted={(rating) => {
          if (reviewingBooking) {
            setReviewed((m) => ({ ...m, [reviewingBooking.id]: { rating } }));
          }
        }}
      />
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
