import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { KES, isValidPhone, withTimeout } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

type Row = any;

export default function Bookings() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Stylists/vendors don't have a customer "Bookings" page — their client
  // appointments live in Studio. Send them there.
  useEffect(() => {
    if (profile?.role === "stylist") nav("/studio", { replace: true });
  }, [profile, nav]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("bookings")
          .select("*, services(title), stylists(display_name, base_location)")
          .eq("customer_id", user.id)
          .order("scheduled_for", { ascending: false });
        if (!cancelled) setRows(data || []);
      } catch {
        if (!cancelled) toast.error("Couldn't load your bookings. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const payDeposit = async (b: Row) => {
    const phone = (profile?.phone || window.prompt("M-Pesa phone (07XX XXX XXX)") || "").trim();
    if (!phone) return;
    if (!isValidPhone(phone)) {
      toast.error("That phone number doesn't look right. Update it in your Profile.");
      return;
    }
    setPayingId(b.id);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("mpesa-stk", {
          body: { booking_id: b.id, phone, amount: b.deposit_kes },
        }),
        20000,
        "Starting M-Pesa",
      );
      if (error) throw error;
      if ((data as any)?.simulated) {
        toast.success("Deposit confirmed (demo).");
        setRows((rs) => rs.map((r) => (r.id === b.id ? { ...r, status: "confirmed", payment_status: "deposit_paid" } : r)));
      } else {
        toast.success("Check your phone for the M-Pesa prompt 📲");
      }
    } catch (e: any) {
      toast.error(e.message || "Couldn't start payment. Try again.");
    } finally {
      setPayingId(null);
    }
  };

  const now = Date.now();
  const filtered = rows.filter((r) => {
    const t = new Date(r.scheduled_for).getTime();
    return tab === "upcoming" ? t >= now - 3600_000 : t < now - 3600_000;
  });

  return (
    <div className="pb-28 min-h-screen">
      <PageHeader title="My bookings" />
      <div className="container-app">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("upcoming")} className={tab === "upcoming" ? "chip-active" : "chip"}>Upcoming</button>
          <button onClick={() => setTab("past")} className={tab === "past" ? "chip-active" : "chip"}>Past</button>
        </div>

        {loading && <div className="skeleton h-32 rounded-2xl" />}

        {!loading && filtered.length === 0 && (
          <div className="card p-8 text-center text-mute">
            No bookings yet.
            <div className="mt-4">
              <Link to="/discover" className="btn-primary">Find a stylist</Link>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {filtered.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{b.services?.title || "Service"}</div>
                  <div className="text-xs text-mute mt-1">with {b.stylists?.display_name || "your stylist"}</div>
                  <div className="mt-2 text-xs text-mute flex flex-wrap gap-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(b.scheduled_for), "EEE d MMM")}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(b.scheduled_for), "HH:mm")}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.location_type === "salon" ? b.stylists?.base_location : "Home"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Status s={b.status} />
                  <div className="font-display text-lg mt-2">{KES(b.amount_kes)}</div>
                  <div className="text-[10px] text-mute uppercase">{(b.payment_status || "unpaid").replace("_", " ")}</div>
                </div>
              </div>
              {(b.payment_status || "unpaid") === "unpaid" && !["cancelled", "completed", "no_show"].includes(b.status) && (
                <button
                  onClick={() => payDeposit(b)}
                  disabled={payingId === b.id}
                  className="btn-primary w-full mt-3"
                >
                  {payingId === b.id ? "Starting payment…" : `Pay deposit ${KES(b.deposit_kes)}`}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Status({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending: "bg-gold-400/30 text-aubergine-700",
    confirmed: "bg-sage/20 text-aubergine-700",
    in_progress: "bg-terracotta-100 text-terracotta-700",
    completed: "bg-aubergine-700 text-cream",
    cancelled: "bg-line text-mute",
    no_show: "bg-line text-mute",
  };
  return <span className={`inline-block text-[10px] uppercase tracking-wider rounded-full px-2 py-1 ${map[s] || "bg-line"}`}>{s.replace("_", " ")}</span>;
}
