import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { withTimeout, cn } from "@/lib/utils";

type Booking = {
  id: string;
  customer_id: string;
  stylist_id: string;
  status: string;
  scheduled_for: string;
  services: { title: string | null } | null;
  stylists: { id: string; display_name: string | null } | null;
};

export default function ReviewWrite() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [existing, setExisting] = useState<{ rating: number; body: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !bookingId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error: bErr } = await supabase
          .from("bookings")
          .select("id, customer_id, stylist_id, status, scheduled_for, services(title), stylists(id, display_name)")
          .eq("id", bookingId)
          .maybeSingle();
        if (bErr) throw bErr;
        if (cancelled) return;
        if (!data) {
          setError("Booking not found.");
          return;
        }
        if (data.customer_id !== user.id) {
          setError("This booking isn't yours.");
          return;
        }
        if (data.status !== "completed") {
          setError("You can only review a completed booking.");
          return;
        }
        setBooking(data as unknown as Booking);

        const { data: r } = await (supabase as any)
          .from("reviews")
          .select("rating, body")
          .eq("booking_id", bookingId)
          .maybeSingle();
        if (cancelled) return;
        if (r) {
          setExisting(r);
          setRating(r.rating);
          setBody(r.body || "");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Couldn't load this booking.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, bookingId]);

  const stylistName = booking?.stylists?.display_name || "your stylist";
  const stylistId = booking?.stylists?.id;
  const serviceTitle = booking?.services?.title || "your service";

  const ratingHint = useMemo(() => {
    const v = hover || rating;
    return ["", "Disappointing", "Below expectations", "Good", "Great", "Loved it"][v] || "Tap a star to rate";
  }, [hover, rating]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !booking || !user) {
      toast.error("Tap a star to rate first.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        booking_id: booking.id,
        stylist_id: booking.stylist_id,
        customer_id: user.id,
        rating,
        body: body.trim() || null,
      };
      const result = (await withTimeout(
        existing
          ? (supabase as any).from("reviews").update({ rating, body: body.trim() || null }).eq("booking_id", booking.id)
          : (supabase as any).from("reviews").insert(payload),
        15000,
        "Submit review",
      )) as { error: any };
      const wErr = result.error;
      if (wErr) throw wErr;
      toast.success(existing ? "Review updated." : "Thanks — your review is live.");
      if (stylistId) nav(`/stylist/${stylistId}`, { replace: true });
      else nav("/bookings", { replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't submit your review. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="pb-nav min-h-screen">
        <PageHeader title="Write a review" back />
        <div className="container-app">
          <div className="card p-8 text-center">
            <div className="font-display text-xl">{error}</div>
            <Link to="/bookings" className="btn-primary mt-5 inline-flex">Back to bookings</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-nav min-h-screen">
      <PageHeader title={existing ? "Edit your review" : "Write a review"} back />
      <div className="container-app">
        <div className="card p-5">
          <div className="text-xs h-eyebrow">For</div>
          <div className="font-display text-xl mt-1">{stylistName}</div>
          <div className="text-sm text-mute mt-0.5">{serviceTitle}</div>
        </div>

        <form onSubmit={submit} className="card p-5 mt-4 space-y-5">
          <div>
            <label className="label">Your rating</label>
            <div
              className="flex items-center gap-1 mt-1"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((v) => {
                const filled = (hover || rating) >= v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRating(v)}
                    onMouseEnter={() => setHover(v)}
                    aria-label={`${v} star${v > 1 ? "s" : ""}`}
                    className="p-1 -m-1"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition",
                        filled ? "fill-gold-500 text-gold-500" : "text-line",
                      )}
                    />
                  </button>
                );
              })}
              <span className="ml-3 text-sm text-mute">{ratingHint}</span>
            </div>
          </div>

          <div>
            <label className="label">Tell other women what they should know <span className="text-mute font-normal">(optional)</span></label>
            <textarea
              rows={5}
              maxLength={1000}
              className="input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What was the experience like? Timekeeping, technique, the vibe in the chair…"
            />
            <div className="text-[11px] text-mute mt-1">{body.length}/1000</div>
          </div>

          <div className="text-xs text-mute leading-relaxed">
            Honest reviews are how Kichana stays trustworthy. Be specific, be fair —
            and never post anything you wouldn't say to her face.
          </div>

          <button disabled={submitting || !rating} className="btn-primary w-full">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {existing ? "Update review" : "Post review"}
          </button>
        </form>
      </div>
    </div>
  );
}
