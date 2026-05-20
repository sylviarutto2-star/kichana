// Paystack: verify a transaction by reference and confirm the booking.
// Called from the frontend callback page after the customer returns from
// Paystack's hosted checkout.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { reference } = await req.json();
    if (!reference) return json({ error: "reference required" }, 400);

    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!SECRET) return json({ error: "Paystack not configured" }, 500);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking } = await sb
      .from("bookings")
      .select("id, deposit_kes, payment_status")
      .eq("paystack_reference", reference)
      .maybeSingle();
    if (!booking) return json({ error: "Booking not found for reference" }, 404);

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${SECRET}` } },
    );
    const body = await res.json();
    const tx = body?.data;

    if (tx?.status === "success" && tx.amount >= booking.deposit_kes * 100) {
      if (booking.payment_status !== "deposit_paid" && booking.payment_status !== "paid") {
        await sb.from("bookings").update({
          status: "confirmed",
          payment_status: "deposit_paid",
        }).eq("id", booking.id);
      }
      return json({ status: "success" });
    }

    return json({ status: "failed", paystack_status: tx?.status ?? "unknown" });
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
