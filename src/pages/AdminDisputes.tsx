import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { KES } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

type Dispute = {
  id: string;
  booking_id: string;
  customer_id: string;
  reason: string;
  description: string;
  evidence_urls: string[];
  status: "open" | "approved" | "rejected";
  approved_refund_kes: number | null;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  scheduled_for: string;
  deposit_kes: number;
  payment_status: string;
  refund_status: string;
  paystack_reference: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  stylist_name: string | null;
};

const REASON_LABEL: Record<string, string> = {
  stylist_no_show: "Stylist didn't show up",
  service_not_delivered: "Service not delivered as agreed",
  health_emergency: "Health / family emergency",
  other: "Other",
};

export default function AdminDisputes() {
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data } = await (supabase as any).rpc("is_admin");
      setAllowed(data === true);
    })();
  }, [user, loading]);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("admin_disputes_view")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setDisputes((data as Dispute[]) || []);

    const all = (data as Dispute[]) || [];
    const sm: Record<string, string> = {};
    for (const d of all) {
      for (const path of d.evidence_urls || []) {
        const { data: signed } = await supabase.storage
          .from("dispute-evidence")
          .createSignedUrl(path, 60 * 60);
        if (signed?.signedUrl) sm[path] = signed.signedUrl;
      }
    }
    setSignedUrls(sm);
  };

  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  if (loading || allowed === null) return <div className="container-app py-10">Loading…</div>;
  if (!allowed) return <Navigate to="/home" replace />;

  const filtered = disputes.filter((d) => (tab === "open" ? d.status === "open" : d.status !== "open"));

  const approve = async (d: Dispute) => {
    const amountRaw = refundAmounts[d.id] ?? String(d.deposit_kes);
    const amount = parseInt(amountRaw, 10);
    if (!amount || amount <= 0) {
      toast.error("Enter a refund amount.");
      return;
    }
    setBusyId(d.id);
    try {
      const { error: upErr } = await (supabase as any)
        .from("disputes")
        .update({
          status: "approved",
          approved_refund_kes: amount,
          admin_note: adminNotes[d.id] || null,
        })
        .eq("id", d.id);
      if (upErr) throw upErr;

      const { data, error } = await supabase.functions.invoke("process-dispute-refund", {
        body: { dispute_id: d.id },
      });
      if (error) throw error;
      if ((data as any)?.refunded) {
        toast.success(`Approved. ${KES(amount)} refunded to the customer.`);
      } else {
        toast.error((data as any)?.error || "Refund didn't complete — check Paystack.");
      }
      await load();
    } catch (e: any) {
      toast.error(e.message || "Couldn't process the refund.");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (d: Dispute) => {
    if (!adminNotes[d.id]) {
      toast.error("Add a note explaining the rejection.");
      return;
    }
    setBusyId(d.id);
    try {
      const now = new Date().toISOString();
      const { error } = await (supabase as any)
        .from("disputes")
        .update({
          status: "rejected",
          admin_note: adminNotes[d.id],
          resolved_at: now,
        })
        .eq("id", d.id);
      if (error) throw error;
      await (supabase as any)
        .from("bookings")
        .update({ refund_status: "denied" })
        .eq("id", d.booking_id);
      toast.success("Dispute rejected.");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Couldn't reject.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pb-nav-cta min-h-screen">
      <PageHeader title="Disputes" />
      <div className="container-app">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("open")} className={tab === "open" ? "chip-active" : "chip"}>
            Open ({disputes.filter((d) => d.status === "open").length})
          </button>
          <button onClick={() => setTab("resolved")} className={tab === "resolved" ? "chip-active" : "chip"}>
            Resolved
          </button>
        </div>

        {filtered.length === 0 && (
          <div className="card p-8 text-center text-mute">
            {tab === "open" ? "Nothing open. Inbox zero." : "No resolved disputes yet."}
          </div>
        )}

        <div className="grid gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{REASON_LABEL[d.reason] || d.reason}</div>
                  <div className="text-xs text-mute mt-0.5">
                    {d.customer_name || "Customer"} → {d.stylist_name || "Stylist"} ·{" "}
                    {format(new Date(d.scheduled_for), "EEE d MMM HH:mm")}
                  </div>
                  {d.customer_phone && (
                    <div className="text-xs text-mute">{d.customer_phone}</div>
                  )}
                </div>
                <div className="text-right text-xs">
                  <div className="font-display text-lg">{KES(d.deposit_kes)} deposit</div>
                  <div className="text-mute uppercase">{d.payment_status}</div>
                  <div className="text-mute uppercase">refund {d.refund_status}</div>
                  <div className="text-mute mt-1">
                    Filed {format(new Date(d.created_at), "d MMM HH:mm")}
                  </div>
                </div>
              </div>

              <p className="text-sm whitespace-pre-wrap">{d.description}</p>

              {d.evidence_urls?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {d.evidence_urls.map((path) => (
                    <a
                      key={path}
                      href={signedUrls[path]}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-line"
                    >
                      {signedUrls[path] ? (
                        <img src={signedUrls[path]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-xs text-mute">…</div>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {d.status === "open" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <div className="text-[11px] text-mute uppercase tracking-wider mb-1">
                        Refund amount (KES)
                      </div>
                      <input
                        type="number"
                        className="input"
                        value={refundAmounts[d.id] ?? String(d.deposit_kes)}
                        onChange={(e) =>
                          setRefundAmounts((m) => ({ ...m, [d.id]: e.target.value }))
                        }
                      />
                    </label>
                    <label className="block">
                      <div className="text-[11px] text-mute uppercase tracking-wider mb-1">
                        Note (required for reject)
                      </div>
                      <input
                        className="input"
                        value={adminNotes[d.id] ?? ""}
                        onChange={(e) =>
                          setAdminNotes((m) => ({ ...m, [d.id]: e.target.value }))
                        }
                        placeholder="Reason / decision"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="btn-outline"
                      onClick={() => reject(d)}
                      disabled={busyId === d.id}
                    >
                      Reject
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => approve(d)}
                      disabled={busyId === d.id}
                    >
                      {busyId === d.id ? "Processing…" : "Approve & refund"}
                    </button>
                  </div>
                </>
              )}

              {d.status !== "open" && (
                <div className="text-xs text-mute border-t border-line pt-2">
                  <strong className="uppercase">{d.status}</strong>
                  {d.approved_refund_kes ? ` · refunded ${KES(d.approved_refund_kes)}` : ""}
                  {d.admin_note ? ` · "${d.admin_note}"` : ""}
                  {d.resolved_at ? ` · ${format(new Date(d.resolved_at), "d MMM HH:mm")}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
