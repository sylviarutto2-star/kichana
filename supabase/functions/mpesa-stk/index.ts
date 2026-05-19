// Daraja STK Push initiation. Falls back to a "simulated" success
// when MPESA_* env vars are not configured (useful for demo/dev).
//
// Required secrets in production:
//   MPESA_CONSUMER_KEY
//   MPESA_CONSUMER_SECRET
//   MPESA_SHORTCODE          (paybill or till)
//   MPESA_PASSKEY
//   MPESA_CALLBACK_URL       (https://<project>.supabase.co/functions/v1/mpesa-callback)
//   MPESA_ENV                "sandbox" | "production"   (default: sandbox)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { booking_id, phone, amount } = await req.json();
    if (!booking_id || !phone || !amount) {
      return json({ error: "booking_id, phone, amount required" }, 400);
    }

    const KEY = Deno.env.get("MPESA_CONSUMER_KEY");
    const SECRET = Deno.env.get("MPESA_CONSUMER_SECRET");
    const SHORT = Deno.env.get("MPESA_SHORTCODE");
    const PASSKEY = Deno.env.get("MPESA_PASSKEY");
    const CB = Deno.env.get("MPESA_CALLBACK_URL");
    const ENV = Deno.env.get("MPESA_ENV") || "sandbox";

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Demo mode if Daraja creds aren't configured
    if (!KEY || !SECRET || !SHORT || !PASSKEY) {
      await sb.from("bookings").update({
        status: "confirmed",
        payment_status: "deposit_paid",
        mpesa_receipt: `SIM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      }).eq("id", booking_id);
      return json({ simulated: true, message: "M-Pesa demo mode (no creds set)" });
    }

    const base = ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: "Basic " + btoa(`${KEY}:${SECRET}`) },
    });
    const tokenJson = await tokenRes.json();
    const token = tokenJson.access_token;
    if (!token) return json({ error: "Daraja auth failed", details: tokenJson }, 502);

    const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const password = btoa(`${SHORT}${PASSKEY}${ts}`);

    const stkRes = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: SHORT,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: normalizePhone(phone),
        PartyB: SHORT,
        PhoneNumber: normalizePhone(phone),
        CallBackURL: CB,
        AccountReference: `KICHANA-${booking_id.slice(0, 8)}`,
        TransactionDesc: "Kichana booking deposit",
      }),
    });
    const stkJson = await stkRes.json();

    if (stkJson.ResponseCode === "0") {
      await sb.from("bookings").update({
        // Track checkout request id in mpesa_receipt placeholder; callback will overwrite
        mpesa_receipt: stkJson.CheckoutRequestID,
        mpesa_merchant_request_id: stkJson.MerchantRequestID,
      }).eq("id", booking_id);
      return json({ ok: true, request: stkJson });
    }
    return json({ error: "STK push failed", details: stkJson }, 502);
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
function normalizePhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.startsWith("254")) return d;
  if (d.startsWith("0")) return "254" + d.slice(1);
  if (d.startsWith("7") || d.startsWith("1")) return "254" + d;
  return d;
}
