import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { addDays } from "date-fns";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";
import { isDemo } from "@/lib/demoData";

export default function GroupBooking() {
  const { stylistId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [date, setDate] = useState<string>(addDays(new Date(), 7).toISOString().slice(0, 10));
  const [time, setTime] = useState<string>("10:00");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const start = async () => {
    if (!user || !stylistId) return;
    if (isDemo(stylistId)) return toast.error("Pick a real stylist for group bookings.");
    setBusy(true);
    try {
      const inv = Math.random().toString(36).slice(2, 8).toUpperCase();
      const scheduled = new Date(`${date}T${time}:00`).toISOString();
      const { error } = await supabase.from("group_bookings").insert({
        host_id: user.id, stylist_id: stylistId, scheduled_for: scheduled, invite_code: inv, notes,
      });
      if (error) throw error;
      setCode(inv);
      toast.success("Group session created. Share the code!");
    } catch (e: any) {
      toast.error(e.message || "Couldn't create group");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-24 min-h-screen">
      <PageHeader title="Group booking" subtitle="Bring the girlies. Everyone pays their own deposit." back />
      <div className="container-app">
        {!code ? (
          <div className="space-y-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Start time</label>
              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Group note</label>
              <textarea rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pre-wedding crew, 4 of us, all braids" />
            </div>
            <button onClick={start} disabled={busy} className="btn-primary w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Create group session
            </button>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <div className="h-eyebrow">Group code</div>
            <div className="font-display text-5xl mt-2 tracking-wider">{code}</div>
            <p className="text-mute text-sm mt-3">Share this code or link with your group. Each person books and pays their own deposit.</p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => { navigator.clipboard.writeText(code); toast.success("Code copied"); }}
                className="btn-outline"
              ><Copy className="h-4 w-4" /> Copy code</button>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/book/${stylistId}?group=${code}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Join link copied");
                }}
                className="btn-outline"
              ><Copy className="h-4 w-4" /> Copy join link</button>
            </div>
            <button onClick={() => nav("/bookings")} className="btn-primary mt-3 w-full">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
