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
    const paidAmount = Number(items.find((i) => i.Name === "Amount")?.Value ?? 0);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking } = await sb
      .from("bookings")
      .select("id, deposit_kes")
      .eq("mpesa_receipt", checkoutId)
      .maybeSingle();

    if (booking) {
      // Only confirm when Safaricom reports success AND the customer paid
      // at least the expected deposit. An underpayment is recorded but
      // left unpaid for manual review.
      const amountOk = paidAmount >= Number(booking.deposit_kes ?? 0);
      const paid = success && amountOk;
      await sb.from("bookings").update({
        status: paid ? "confirmed" : "pending",
        payment_status: paid ? "deposit_paid" : "unpaid",
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
