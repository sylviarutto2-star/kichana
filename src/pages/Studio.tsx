import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { SERVICE_CATEGORIES, KES, cn } from "@/lib/utils";
import { Plus, Trash2, Star, Calendar, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Studio() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [stylist, setStylist] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState<"today" | "services" | "settings">("today");
  const [loading, setLoading] = useState(true);

  // service form
  const [newSvc, setNewSvc] = useState({ title: "", price_kes: 0, duration_min: 60, category: "braids", description: "" });
  const [busy, setBusy] = useState(false);

  // settings
  const [bio, setBio] = useState("");
  const [hero, setHero] = useState("");
  const [travels, setTravels] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (profile && profile.role !== "stylist") {
      nav("/profile");
      return;
    }
    (async () => {
      const { data: s } = await supabase.from("stylists").select("*").eq("profile_id", user.id).maybeSingle();
      setStylist(s);
      setBio(s?.bio || ""); setHero(s?.hero_image_url || ""); setTravels(s?.travels || false);

      if (s) {
        const [{ data: svc }, { data: bks }] = await Promise.all([
          supabase.from("services").select("*").eq("stylist_id", s.id).order("created_at", { ascending: false }),
          supabase.from("bookings").select("*, services(title), profiles!bookings_customer_id_fkey(full_name, phone)").eq("stylist_id", s.id).order("scheduled_for", { ascending: true }),
        ]);
        setServices(svc || []); setBookings(bks || []);
      }
      setLoading(false);
    })();
  }, [user, profile]);

  const addSvc = async () => {
    if (!stylist) return;
    if (!newSvc.title || newSvc.price_kes <= 0) return toast.error("Title and price required");
    setBusy(true);
    const { data, error } = await supabase.from("services").insert({ ...newSvc, stylist_id: stylist.id }).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setServices([data, ...services]);
    setNewSvc({ title: "", price_kes: 0, duration_min: 60, category: "braids", description: "" });
    toast.success("Service added");
  };

  const removeSvc = async (id: string) => {
    await supabase.from("services").update({ active: false }).eq("id", id);
    setServices((s) => s.filter((x) => x.id !== id));
  };

  const saveSettings = async () => {
    if (!stylist) return;
    const { error } = await supabase.from("stylists").update({ bio, hero_image_url: hero || null, travels }).eq("id", stylist.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const acceptBooking = async (id: string) => {
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
    setBookings((bs) => bs.map((b) => b.id === id ? { ...b, status: "confirmed" } : b));
  };
  const completeBooking = async (id: string) => {
    await supabase.from("bookings").update({ status: "completed", payment_status: "paid" }).eq("id", id);
    setBookings((bs) => bs.map((b) => b.id === id ? { ...b, status: "completed", payment_status: "paid" } : b));
  };

  if (loading) return <div className="container-app py-10"><div className="skeleton h-32" /></div>;
  if (!stylist) return <div className="container-app py-10">Studio not set up. <button onClick={() => nav("/onboarding?role=stylist")} className="btn-primary mt-4">Finish setup</button></div>;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const today = bookings.filter((b) => b.scheduled_for.startsWith(todayStr));
  const upcoming = bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled" && b.scheduled_for >= new Date().toISOString());

  return (
    <div className="pb-28 min-h-screen">
      <PageHeader title="Studio" subtitle={stylist.display_name} />
      <div className="container-app">
        <div className="grid grid-cols-3 gap-2 card p-4">
          <Stat label="Rating" value={`${(stylist.rating_avg ?? 0).toFixed(1)}★`} icon={<Star className="h-4 w-4" />} />
          <Stat label="Today" value={today.length} icon={<Calendar className="h-4 w-4" />} />
          <Stat label="Tier" value={stylist.loyalty_tier} icon={<ImageIcon className="h-4 w-4" />} />
        </div>

        <div className="flex gap-2 mt-5">
          {(["today", "services", "settings"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? "chip-active" : "chip"}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "today" && (
          <div className="mt-5 space-y-3">
            <div className="label">Upcoming</div>
            {upcoming.length === 0 && <div className="card p-6 text-center text-mute">No upcoming bookings.</div>}
            {upcoming.map((b) => (
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{b.services?.title}</div>
                    <div className="text-xs text-mute">{b.profiles?.full_name} · {b.profiles?.phone || "no phone"}</div>
                    <div className="text-xs text-mute mt-1">
                      {format(new Date(b.scheduled_for), "EEE d MMM, HH:mm")} · {b.location_type === "salon" ? "Salon" : "Home"}
                    </div>
                    {b.notes && <p className="text-xs text-mute mt-1 italic">"{b.notes}"</p>}
                  </div>
                  <div className="text-right">
                    <div className="font-display">{KES(b.amount_kes)}</div>
                    <div className="text-[10px] uppercase text-mute">{b.payment_status}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {b.status === "pending" && <button onClick={() => acceptBooking(b.id)} className="btn-primary !py-2 !px-3 text-xs">Confirm</button>}
                  {b.status === "confirmed" && <button onClick={() => completeBooking(b.id)} className="btn-dark !py-2 !px-3 text-xs">Mark complete</button>}
                  <span className="ml-auto chip text-[10px] uppercase">{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "services" && (
          <div className="mt-5">
            <div className="card p-4 space-y-3">
              <div className="font-semibold">Add a service</div>
              <input className="input" placeholder="Title (e.g. Knotless braids – medium)" value={newSvc.title} onChange={(e) => setNewSvc({ ...newSvc, title: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Short description" value={newSvc.description} onChange={(e) => setNewSvc({ ...newSvc, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="input" placeholder="Price (KES)" value={newSvc.price_kes || ""} onChange={(e) => setNewSvc({ ...newSvc, price_kes: Number(e.target.value) })} />
                <input type="number" className="input" placeholder="Duration (min)" value={newSvc.duration_min} onChange={(e) => setNewSvc({ ...newSvc, duration_min: Number(e.target.value) })} />
              </div>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setNewSvc({ ...newSvc, category: c.id })} className={cn(newSvc.category === c.id ? "chip-active" : "chip")}>
                    <span className="mr-1">{c.emoji}</span>{c.label}
                  </button>
                ))}
              </div>
              <button onClick={addSvc} disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add service
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              {services.map((s) => (
                <div key={s.id} className="card p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{s.title}</div>
                    <div className="text-xs text-mute">{s.category} · {s.duration_min}min</div>
                  </div>
                  <div className="font-display">{KES(s.price_kes)}</div>
                  <button onClick={() => removeSvc(s.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-line">
                    <Trash2 className="h-4 w-4 text-terracotta-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="mt-5 card p-5 space-y-3">
            <div>
              <label className="label">Hero image URL</label>
              <input className="input" value={hero} onChange={(e) => setHero(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea rows={3} className="input" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={travels} onChange={(e) => setTravels(e.target.checked)} />
              I do home visits
            </label>
            <button onClick={saveSettings} className="btn-primary w-full">Save</button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="grid h-8 w-8 place-items-center mx-auto rounded-lg bg-terracotta-50 text-terracotta-600">{icon}</div>
      <div className="font-display text-lg mt-1">{value}</div>
      <div className="text-[10px] uppercase text-mute">{label}</div>
    </div>
  );
}
