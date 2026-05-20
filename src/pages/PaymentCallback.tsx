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
    <div className="pb-24 min-h-screen">
      <PageHeader title="Payment" />
      <div className="container-app">
        <div className="card p-8 text-center mt-6 flex flex-col items-center gap-4">
          {state === "checking" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-terracotta-600" />
              <div className="font-semibold">Confirming your payment…</div>
            </>
          )}
          {state === "success" && (
            <>
              <div className="rounded-full bg-sage/20 p-3"><Check className="h-8 w-8 text-aubergine-700" /></div>
              <div className="font-semibold">Deposit received — booking confirmed!</div>
              <button onClick={() => nav("/bookings")} className="btn-primary">View my bookings</button>
            </>
          )}
          {state === "failed" && (
            <>
              <div className="rounded-full bg-line p-3"><X className="h-8 w-8 text-mute" /></div>
              <div className="font-semibold">We couldn't confirm that payment.</div>
              <p className="text-xs text-mute">If you were charged, it'll be reconciled shortly. You can also retry from My Bookings.</p>
              <button onClick={() => nav("/bookings")} className="btn-primary">Go to my bookings</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
