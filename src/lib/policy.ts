// Single source of truth for cancellation / no-show policy decisions.
// Kept in /lib so Booking, Bookings, Studio and StylistProfile all reason
// from the same numbers — divergence here is what makes refund disputes.

export type StylistPolicy = {
  cancellation_hours: number;
  late_grace_min: number;
  no_show_fee_percent: number;
  deposit_refundable: boolean;
  custom_terms?: string | null;
};

export const DEFAULT_POLICY: StylistPolicy = {
  cancellation_hours: 24,
  late_grace_min: 15,
  no_show_fee_percent: 50,
  deposit_refundable: false,
  custom_terms: "",
};

export type CancelDecision = {
  // Hours until the scheduled time (negative once it's in the past).
  hoursUntil: number;
  // True if we're inside the free-cancellation window.
  free: boolean;
  // True if the deposit will be refunded on cancellation.
  refundDeposit: boolean;
  // Headline shown to the customer in the confirm dialog.
  headline: string;
  // Sub-copy explaining the consequence in money terms.
  detail: string;
};

export function decideCancellation(
  scheduledFor: string | Date,
  policy: StylistPolicy,
  depositKes: number,
): CancelDecision {
  const t = typeof scheduledFor === "string" ? new Date(scheduledFor) : scheduledFor;
  const hoursUntil = (t.getTime() - Date.now()) / 36e5;
  const free = hoursUntil >= policy.cancellation_hours;
  const refundDeposit = free || policy.deposit_refundable;
  if (free) {
    return {
      hoursUntil,
      free: true,
      refundDeposit: true,
      headline: "Free cancellation",
      detail: depositKes > 0
        ? `You're cancelling more than ${policy.cancellation_hours}h ahead — your KES ${depositKes.toLocaleString()} deposit will be refunded.`
        : `You're cancelling more than ${policy.cancellation_hours}h ahead — no charge.`,
    };
  }
  if (refundDeposit) {
    return {
      hoursUntil,
      free: false,
      refundDeposit: true,
      headline: "Late cancellation",
      detail: depositKes > 0
        ? `Inside the ${policy.cancellation_hours}h window — but this stylist marks deposits as refundable, so your KES ${depositKes.toLocaleString()} comes back.`
        : `Inside the ${policy.cancellation_hours}h window — no money on the line.`,
    };
  }
  return {
    hoursUntil,
    free: false,
    refundDeposit: false,
    headline: "Deposit forfeited",
    detail: depositKes > 0
      ? `You're inside the ${policy.cancellation_hours}h cancellation window. The KES ${depositKes.toLocaleString()} deposit will not be refunded.`
      : `You're inside the ${policy.cancellation_hours}h cancellation window. The stylist will be notified.`,
  };
}

export function policySummary(policy: StylistPolicy): string {
  const parts: string[] = [];
  parts.push(`Free cancellation up to ${policy.cancellation_hours}h before.`);
  parts.push(`After that, ${policy.deposit_refundable ? "the deposit is still refundable" : "the deposit is non-refundable"}.`);
  parts.push(`No-show fee: ${policy.no_show_fee_percent}% of the total.`);
  parts.push(`Late grace: ${policy.late_grace_min} minutes.`);
  return parts.join(" ");
}
