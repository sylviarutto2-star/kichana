// Daraja STK callback. Called by Safaricom with payment result.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const cb = body?.Body?.stkCallback;
    if (!cb) return ok();

    const checkoutId = cb.CheckoutRequestID as string;
    const success = cb.ResultCode === 0;
    const items: any[] = cb.CallbackMetadata?.Item || [];
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
