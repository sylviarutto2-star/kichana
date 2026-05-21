import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { DEFAULT_POLICY, decideCancellation, type StylistPolicy } from "@/lib/policy";
import { withTimeout, KES } from "@/lib/utils";

type Booking = {
  id: string;
  stylist_id: string;
  scheduled_for: string;
  deposit_kes: number;
  payment_status: string;
};

export function CancelBookingModal({
  open,
  onClose,
  booking,
  onCancelled,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  onCancelled: (updated: { status: string; payment_status: string }) => void;
}) {
  const [policy, setPolicy] = useState<StylistPolicy>(DEFAULT_POLICY);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  useEffect(() => {
    if (!open || !booking?.stylist_id) return;
    let cancelled = false;
    (async () => {
      setLoadingPolicy(true);
      const { data } = await supabase
        .from("stylist_policies" as any)
        .select("*")
        .eq("stylist_id", booking.stylist_id)
        .maybeSingle();
      if (!cancelled) {
        setPolicy(data ? { ...DEFAULT_POLICY, ...(data as any) } : DEFAULT_POLICY);
        setLoadingPolicy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, booking?.stylist_id]);

  useEffect(() => {
    if (open) setReason("");
  }, [open, booking?.id]);

  const decision = useMemo(() => {
    if (!booking) return null;
    return decideCancellation(booking.scheduled_for, policy, booking.deposit_kes || 0);
  }, [booking, policy]);

  if (!open || !booking || !decision) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      // Refund logic mirrors the policy decision. We don't call the Paystack
      // refund API here — the stylist resolves that out-of-band — but we
      // mark payment_status so both sides see who owes what.
      const newPaymentStatus = (() => {
        if (booking.payment_status === "deposit_paid" || booking.payment_status === "paid") {
          return decision.refundDeposit ? "refunded" : booking.payment_status;
        }
        return booking.payment_status;
      })();
      const patch = {
        status: "cancelled",
        payment_status: newPaymentStatus,
        cancelled_at: new Date().toISOString(),
        cancelled_by: "customer",
        notes: reason.trim() ? `[Cancelled by customer] ${reason.trim()}` : undefined,
      };
      // Drop undefined notes so we don't blank an existing booking note.
      if (!patch.notes) delete (patch as any).notes;
      const { error } = await withTimeout(
        supabase.from("bookings").update(patch as any).eq("id", booking.id),
        15000,
        "Cancelling booking",
      );
      if (error) {
        console.error("Cancel booking failed", error);
        toast.error(error.message || "Couldn't cancel.");
        return;
      }
      onCancelled({ status: "cancelled", payment_status: newPaymentStatus });
      toast.success(
        decision.refundDeposit
          ? "Cancelled. Deposit will be refunded."
          : "Cancelled. Deposit was kept per the stylist's policy.",
      );
      onClose();
    } catch (e: any) {
      console.error("Cancel booking threw", e);
      toast.error(e?.message || "Couldn't cancel.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-ink/40 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full sm:max-w-md bg-cream rounded-t-3xl sm:rounded-3xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="cancel-modal-title" className="font-display text-2xl">Cancel booking?</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-line"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loadingPolicy ? (
          <div className="skeleton h-20 rounded-2xl mt-4" />
        ) : (
          <div
            className={`mt-4 rounded-2xl border p-3 ${
              decision.free
                ? "bg-sage/15 border-sage/40"
                : decision.refundDeposit
                ? "bg-gold-400/15 border-gold-400/40"
                : "bg-terracotta-100 border-terracotta-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {!decision.refundDeposit && (
                <AlertTriangle className="h-4 w-4 text-terracotta-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-sm">{decision.headline}</div>
                <p className="text-xs text-mute mt-1">{decision.detail}</p>
              </div>
            </div>
          </div>
        )}

        <label className="label mt-4 block">Reason (optional, shown to the stylist)</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Something came up — sorry for the late notice."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={400}
        />

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} disabled={submitting} className="btn-outline flex-1">
            Keep booking
          </button>
          <button onClick={submit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting
              ? "Cancelling…"
              : decision.refundDeposit
              ? "Confirm cancel"
              : `Cancel & forfeit ${KES(booking.deposit_kes || 0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
