// Daraja STK callback. Called by Safaricom with payment result.
// Set MPESA_CALLBACK_SECRET and include ?secret=<value> in MPESA_CALLBACK_URL
// to reject forged callbacks. Without this env var all callbacks are accepted
// (safe for sandbox / demo; must be set in production).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  try {
    // Reject forged callbacks when a shared secret is configured
    const expectedSecret = Deno.env.get("MPESA_CALLBACK_SECRET");
    if (expectedSecret) {
      const url = new URL(req.url);
      const secret = url.searchParams.get("secret");
      if (secret !== expectedSecret) {
        // Return 0 to Safaricom so it doesn't retry; silently discard
        return ok();
      }
    }

    const body = await req.json();
    const cb = body?.Body?.stkCallback;
    if (!cb) return ok();

    const checkoutId = cb.CheckoutRequestID as string;
    const success = cb.ResultCode === 0;
    const rawItems = cb.CallbackMetadata?.Item;
    // Safaricom may return Item as a single object or an array
    const items: any[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
    const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value as string | undefined;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking } = await sb
      .from("bookings")
      .select("id")
      .eq("mpesa_receipt", checkoutId)
      .maybeSingle();

    if (booking) {
      await sb.from("bookings").update({
        status: success ? "confirmed" : "pending",
        payment_status: success ? "deposit_paid" : "unpaid",
        mpesa_receipt: success ? (receipt || checkoutId) : null,
      }).eq("id", booking.id);
    }
    return ok();
  } catch {
    return ok();
  }
});

function ok() {
  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
    headers: { "Content-Type": "application/json" },
  });
}
