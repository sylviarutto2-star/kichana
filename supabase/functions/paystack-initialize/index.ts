// Paystack: initialize a transaction for a booking deposit.
// Falls back to a "simulated" success when PAYSTACK_SECRET_KEY is not
// configured (useful for demo/dev).
//
// Required secret in production:
//   PAYSTACK_SECRET_KEY   (sk_test_... or sk_live_...)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { booking_id, callback_url } = await req.json();
    if (!booking_id || !callback_url) {
      return json({ error: "booking_id, callback_url required" }, 400);
    }

    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking, error: bErr } = await sb
      .from("bookings")
      .select("id, customer_id, deposit_kes, payment_status")
      .eq("id", booking_id)
      .maybeSingle();
    if (bErr || !booking) return json({ error: "Booking not found" }, 404);
    if (booking.payment_status === "deposit_paid" || booking.payment_status === "paid") {
      return json({ error: "Deposit already paid" }, 409);
    }

    // Demo mode if Paystack key isn't configured
    if (!SECRET) {
      await sb.from("bookings").update({
        status: "confirmed",
        payment_status: "deposit_paid",
      }).eq("id", booking_id);
      return json({ simulated: true, message: "Paystack demo mode (no key set)" });
    }

    const { data: userData, error: uErr } = await sb.auth.admin.getUserById(booking.customer_id);
    const email = userData?.user?.email;
    if (uErr || !email) return json({ error: "Customer email not found" }, 400);

    const reference = `KCH-${booking_id.slice(0, 8)}-${Date.now()}`;
    await sb.from("bookings").update({ paystack_reference: reference }).eq("id", booking_id);

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: booking.deposit_kes * 100,
        currency: "KES",
        reference,
        callback_url,
        metadata: { booking_id },
      }),
    });
    const body = await res.json();
    if (!body.status || !body.data?.authorization_url) {
      return json({ error: "Paystack init failed", details: body }, 502);
    }

    return json({
      authorization_url: body.data.authorization_url,
      reference: body.data.reference,
    });
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
