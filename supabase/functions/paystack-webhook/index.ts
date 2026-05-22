// Paystack webhook. Backstop for the verify call — confirms the booking
// when a charge.success event arrives. Idempotent: safe if verify ran first.
//
// The x-paystack-signature header is an HMAC-SHA512 of the raw request body
// signed with PAYSTACK_SECRET_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  try {
    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!SECRET) return new Response("not configured", { status: 500 });

    const raw = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";
    if (!(await verify(SECRET, raw, signature))) {
      return new Response("invalid signature", { status: 401 });
    }

    const event = JSON.parse(raw);
    if (event?.event === "charge.success") {
      const reference = event.data?.reference as string | undefined;
      const amount = event.data?.amount as number | undefined;
      if (reference) {
        const sb = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const { data: booking } = await sb
          .from("bookings")
          .select("id, deposit_kes, payment_status")
          .eq("paystack_reference", reference)
          .maybeSingle();
        if (
          booking &&
          booking.payment_status !== "deposit_paid" &&
          booking.payment_status !== "paid" &&
          (amount ?? 0) >= booking.deposit_kes * 100
        ) {
          await sb.from("bookings").update({
            status: "confirmed",
            payment_status: "deposit_paid",
          }).eq("id", booking.id);
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch {
    return new Response("ok", { status: 200 });
  }
});

async function verify(secret: string, body: string, signature: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const computed = [...new Uint8Array(sigBuf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
