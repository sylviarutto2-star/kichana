// Customer-initiated cancel with conditional Paystack refund.
//
// Refund eligibility (auto): cancel within 1 hour of creating the booking,
// OR more than 4 hours before the appointment. Outside that, the booking
// is cancelled with no refund — the customer can then file a dispute.
//
// Required secret: PAYSTACK_SECRET_KEY (sk_test_... / sk_live_...).
// Without it we run in demo mode: booking is cancelled, refund is marked
// as 'refunded' but no money moves.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REFUND_WINDOW_BEFORE_MS = 4 * 60 * 60 * 1000; // 4h
const GRACE_AFTER_CREATE_MS = 60 * 60 * 1000;       // 1h

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const { booking_id } = await req.json();
    if (!booking_id) return json({ error: "booking_id required" }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, serviceKey);

    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: booking, error: bErr } = await sb
      .from("bookings")
      .select("id, customer_id, status, scheduled_for, created_at, deposit_kes, payment_status, paystack_reference, refund_status")
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr || !booking) return json({ error: "Booking not found" }, 404);
    if (booking.customer_id !== user.id) return json({ error: "Not your booking" }, 403);
    if (booking.status === "cancelled") return json({ error: "Already cancelled" }, 409);
    if (booking.status === "completed" || booking.status === "in_progress") {
      return json({ error: "Can't cancel an appointment that's started or completed" }, 409);
    }

    const now = Date.now();
    const createdMs = new Date(booking.created_at).getTime();
    const scheduledMs = new Date(booking.scheduled_for).getTime();
    const inGrace = now - createdMs <= GRACE_AFTER_CREATE_MS;
    const beforeWindow = scheduledMs - now >= REFUND_WINDOW_BEFORE_MS;
    const eligible = inGrace || beforeWindow;

    const wasPaid = booking.payment_status === "deposit_paid" || booking.payment_status === "paid";
    const shouldRefund = eligible && wasPaid;

    // Always mark cancelled first — even if Paystack refund fails, the
    // booking should free the slot. Refund state is tracked separately so
    // we can retry/dispute without losing the cancellation.
    const { error: cErr } = await sb.from("bookings").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: "customer",
    }).eq("id", booking_id);
    if (cErr) return json({ error: "Cancel failed", details: cErr.message }, 500);

    if (!shouldRefund) {
      return json({
        cancelled: true,
        refunded: false,
        eligible,
        reason: eligible ? "No deposit to refund" : "Outside refund window — file a dispute if needed",
      });
    }

    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!SECRET) {
      // Demo mode: pretend the refund succeeded so the UI flow can be exercised.
      await sb.from("bookings").update({
        refund_status: "refunded",
        refund_kes: booking.deposit_kes,
        refund_processed_at: new Date().toISOString(),
      }).eq("id", booking_id);
      return json({ cancelled: true, refunded: true, simulated: true });
    }

    if (!booking.paystack_reference) {
      // Marked paid but no Paystack ref — likely a legacy/demo payment.
      // Park as pending so it surfaces in the admin queue.
      await sb.from("bookings").update({ refund_status: "pending" }).eq("id", booking_id);
      return json({ cancelled: true, refunded: false, pending: true, reason: "No Paystack reference on file" });
    }

    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction: booking.paystack_reference,
        amount: booking.deposit_kes * 100,
      }),
    });
    const body = await res.json();
    if (!body.status) {
      await sb.from("bookings").update({ refund_status: "pending" }).eq("id", booking_id);
      return json({ cancelled: true, refunded: false, pending: true, details: body }, 202);
    }

    await sb.from("bookings").update({
      refund_status: "refunded",
      refund_kes: booking.deposit_kes,
      paystack_refund_id: String(body.data?.id ?? ""),
      refund_processed_at: new Date().toISOString(),
    }).eq("id", booking_id);

    return json({ cancelled: true, refunded: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
