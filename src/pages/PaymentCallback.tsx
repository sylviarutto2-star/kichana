import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Check, Loader2, X } from "lucide-react";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [state, setState] = useState<"checking" | "success" | "failed">("checking");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) {
      setState("failed");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paystack-verify", {
          body: { reference },
        });
        setState(!error && (data as any)?.status === "success" ? "success" : "failed");
      } catch {
        setState("failed");
      }
    })();
  }, [params]);

  return (
    <div className="pb-nav min-h-screen">
      <PageHeader title="Payment" />
      <div className="container-app">
        <div className="card p-8 text-center mt-6 flex flex-col items-center gap-4">
          {state === "checking" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-terracotta-600" />
              <div className="font-semibold">Confirming your payment…</div>
              <p className="text-xs text-mute">This usually takes a few seconds.</p>
            </>
          )}
          {state === "success" && (
            <>
              <div className="rounded-full bg-sage/20 p-3"><Check className="h-8 w-8 text-aubergine-700" /></div>
              <div className="font-semibold">Booking confirmed 💛</div>
              <p className="text-xs text-mute">Your stylist has been notified. We'll remind you before your appointment.</p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <button onClick={() => nav("/home")} className="btn-primary">Back to home</button>
                <button onClick={() => nav("/bookings")} className="btn-outline">View my bookings</button>
              </div>
            </>
          )}
          {state === "failed" && (
            <>
              <div className="rounded-full bg-line p-3"><X className="h-8 w-8 text-mute" /></div>
              <div className="font-semibold">Payment didn't go through</div>
              <p className="text-xs text-mute">If you were charged, the amount will be refunded shortly. You can retry from My Bookings.</p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <button onClick={() => nav("/home")} className="btn-primary">Back to home</button>
                <button onClick={() => nav("/bookings")} className="btn-outline">Go to my bookings</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
