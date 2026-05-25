// Admin-triggered refund for a dispute the team approved.
//
// Auth: either the project service-role key OR a signed-in admin user
// (email allow-listed in the public.is_admin() Postgres function).
//
// Usage from the admin UI:
//   1. PATCH disputes SET status='approved', approved_refund_kes=<amount>
//      (RLS allows this only for admins)
//   2. Invoke this function with { dispute_id: '<uuid>' }
//
// Required secret: PAYSTACK_SECRET_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") || "";

    let authorized = auth === `Bearer ${serviceKey}`;
    if (!authorized && auth.startsWith("Bearer ")) {
      const anonClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: auth } },
      });
      const { data } = await anonClient.rpc("is_admin");
      authorized = data === true;
    }
    if (!authorized) return json({ error: "Admin only" }, 403);

    const { dispute_id } = await req.json();
    if (!dispute_id) return json({ error: "dispute_id required" }, 400);

    const sb = createClient(url, serviceKey);

    const { data: dispute, error: dErr } = await sb
      .from("disputes")
      .select("id, booking_id, status, approved_refund_kes")
      .eq("id", dispute_id)
      .maybeSingle();
    if (dErr || !dispute) return json({ error: "Dispute not found" }, 404);
    if (dispute.status !== "approved") {
      return json({ error: `Dispute status is '${dispute.status}', must be 'approved'` }, 409);
    }
    if (!dispute.approved_refund_kes || dispute.approved_refund_kes <= 0) {
      return json({ error: "Set approved_refund_kes on the dispute row first" }, 400);
    }

    const { data: booking, error: bErr } = await sb
      .from("bookings")
      .select("id, deposit_kes, paystack_reference, refund_status")
      .eq("id", dispute.booking_id)
      .maybeSingle();
    if (bErr || !booking) return json({ error: "Booking not found" }, 404);
    if (booking.refund_status === "refunded") {
      return json({ error: "Booking already refunded" }, 409);
    }
    if (!booking.paystack_reference) {
      return json({ error: "Booking has no Paystack reference — refund manually" }, 400);
    }

    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!SECRET) return json({ error: "PAYSTACK_SECRET_KEY not configured" }, 500);

    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction: booking.paystack_reference,
        amount: dispute.approved_refund_kes * 100,
      }),
    });
    const body = await res.json();
    if (!body.status) {
      return json({ error: "Paystack refund failed", details: body }, 502);
    }

    const now = new Date().toISOString();
    await sb.from("bookings").update({
      refund_status: "refunded",
      refund_kes: dispute.approved_refund_kes,
      paystack_refund_id: String(body.data?.id ?? ""),
      refund_processed_at: now,
    }).eq("id", booking.id);

    await sb.from("disputes").update({ resolved_at: now }).eq("id", dispute.id);

    return json({ refunded: true, paystack_refund_id: body.data?.id });
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
