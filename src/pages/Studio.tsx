import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { SERVICE_CATEGORIES, KES, cn, withTimeout } from "@/lib/utils";
import {
  Plus, Trash2, Star, Calendar, Loader2, Image as ImageIcon, Sparkles,
  GripVertical, Check, X, ChevronUp, ChevronDown, Settings as SettingsIcon,
  Scissors, ListChecks, Clock, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LoadingScreen } from "@/components/LoadingScreen";

type Tab = "today" | "services" | "portfolio" | "hours" | "policies" | "profile";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HAIR_TYPES = ["4A", "4B", "4C", "3A", "3B", "3C", "Relaxed", "Locs"];

export default function Studio() {
  const { user, profile, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [stylist, setStylist] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    if (profile && profile.role && profile.role !== "stylist") {
      setLoading(false);
      nav("/profile");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Look up the stylist row, retrying once after a short delay if it
        // isn't readable yet — covers the replica-lag window right after
        // onboarding inserts a fresh row.
        let s: any = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          const { data, error } = await withTimeout(
            supabase.from("stylists" as any).select("*").eq("profile_id", user.id).maybeSingle(),
            15000,
            "Loading studio",
          );
          if (error) {
            console.error("Studio: stylist lookup failed", error);
            break;
          }
          if (data) { s = data; break; }
          if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
        }
        if (cancelled) return;
        setStylist(s);

        if (s) {
          const [svc, port, bks, av, pol] = await Promise.all([
            withTimeout(supabase.from("services" as any).select("*").eq("stylist_id", (s as any).id).order("sort_order").order("created_at", { ascending: false }), 15000, "Loading services"),
            withTimeout(supabase.from("portfolio_images" as any).select("*").eq("stylist_id", (s as any).id).order("is_cover", { ascending: false }).order("sort_order"), 15000, "Loading portfolio"),
            withTimeout(supabase.from("bookings" as any).select("*, services(title), profiles:profiles!bookings_customer_id_fkey(full_name, phone)").eq("stylist_id", (s as any).id).order("scheduled_for"), 15000, "Loading bookings"),
            withTimeout(supabase.from("stylist_availability" as any).select("*").eq("stylist_id", (s as any).id).order("weekday").order("start_time"), 15000, "Loading hours"),
            withTimeout(supabase.from("stylist_policies" as any).select("*").eq("stylist_id", (s as any).id).maybeSingle(), 15000, "Loading policies"),
          ]);
          if (svc.error) console.error("Studio: services query failed", svc.error);
          if (port.error) console.error("Studio: portfolio query failed", port.error);
          if (bks.error) console.error("Studio: bookings query failed", bks.error);
          if (av.error) console.error("Studio: availability query failed", av.error);
          if (pol.error) console.error("Studio: policies query failed", pol.error);
          setServices((svc.data as any[]) || []);
          setPortfolio((port.data as any[]) || []);
          setBookings((bks.data as any[]) || []);
          setAvailability((av.data as any[]) || []);
          setPolicies(pol.data || {
            stylist_id: (s as any).id, cancellation_hours: 24, late_grace_min: 15,
            no_show_fee_percent: 50, deposit_refundable: false, custom_terms: "",
          });
        }
      } catch (e: any) {
        console.error("Studio: load threw", e);
        if (!cancelled) toast.error(e?.message || "Couldn't load your studio. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile, authLoading]);

  if (authLoading) return <LoadingScreen />;
  if (loading) return <div className="container-app py-10"><div className="skeleton h-32" /></div>;
  if (!stylist) {
    return (
      <div className="container-app py-10 with-sidenav">
        <div className="card p-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-terracotta-600" />
          <h2 className="font-display text-2xl mt-2">Finish setting up your studio</h2>
          <p className="text-mute text-sm mt-1">Complete onboarding to add services, portfolio, hours, and policies.</p>
          <button onClick={() => nav("/onboarding?role=stylist")} className="btn-primary mt-5">Finish setup</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const bookingDate = (b: any) =>
    b.scheduled_for ? format(new Date(b.scheduled_for), "yyyy-MM-dd") : "";
  const today = bookings.filter((b) => bookingDate(b) === todayStr);
  const upcoming = bookings.filter(
    (b) => !["completed", "cancelled"].includes(b.status) && bookingDate(b) >= todayStr,
  );
  const upcomingRevenue = upcoming.reduce((s, b) => s + (b.amount_kes || 0), 0);

  const TABS: { id: Tab; label: string; Icon: any }[] = [
    { id: "today", label: "Today", Icon: Calendar },
    { id: "services", label: "Services", Icon: Scissors },
    { id: "portfolio", label: "Portfolio", Icon: ImageIcon },
    { id: "hours", label: "Hours", Icon: Clock },
    { id: "policies", label: "Policies", Icon: Shield },
    { id: "profile", label: "Profile", Icon: SettingsIcon },
  ];

  return (
    <div className="pb-28 min-h-screen with-sidenav">
      <PageHeader
        title="Studio"
        subtitle={stylist.display_name || profile?.full_name || "Your business"}
        right={
          <div className="hidden lg:flex gap-2 items-center">
            <span className="chip">{stylist.verified ? "Verified" : "Pending verify"}</span>
            <span className="chip">{Number(stylist.rating || 0).toFixed(1)}★</span>
          </div>
        }
      />

      <div className="container-shell">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Rating" value={`${Number(stylist.rating || 0).toFixed(1)}★`} sub={`${stylist.review_count || 0} reviews`} />
          <Stat label="Today" value={today.length} sub={`${upcoming.length} upcoming`} />
          <Stat label="Pipeline" value={KES(upcomingRevenue)} sub="next 30 days" />
          <Stat label="Completed" value={stylist.completed_bookings_count || 0} sub="all-time" />
        </div>

        {/* Tabs */}
        <div className="mt-5 overflow-x-auto no-scrollbar -mx-5 px-5">
          <div className="flex gap-2 min-w-max">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition border",
                    active
                      ? "bg-ink text-cream border-ink"
                      : "bg-white text-ink border-line hover:bg-line/40",
                  )}
                >
                  <t.Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "today" && (
          <TodayTab bookings={bookings} upcoming={upcoming} onChange={setBookings} />
        )}
        {tab === "services" && (
          <ServicesTab stylistId={stylist.id} services={services} onChange={setServices} />
        )}
        {tab === "portfolio" && (
          <PortfolioTab
            stylistId={stylist.id}
            services={services}
            items={portfolio}
            onChange={setPortfolio}
          />
        )}
        {tab === "hours" && (
          <HoursTab stylistId={stylist.id} availability={availability} onChange={setAvailability} />
        )}
        {tab === "policies" && (
          <PoliciesTab stylistId={stylist.id} policies={policies} onChange={setPolicies} />
        )}
        {tab === "profile" && (
          <ProfileTab stylist={stylist} onChange={setStylist} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Today                                                              */
/* ------------------------------------------------------------------ */

function TodayTab({
  bookings, upcoming, onChange,
}: { bookings: any[]; upcoming: any[]; onChange: (b: any[]) => void }) {
  const setStatus = async (id: string, status: string) => {
    try {
      const { error } = await withTimeout(
        supabase.from("bookings" as any).update({ status }).eq("id", id),
        15000, "Updating booking",
      );
      if (error) { console.error(error); return toast.error(error.message); }
      onChange(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
      toast.success(`Booking ${status}`);
    } catch (e: any) {
      console.error("setStatus failed:", e);
      toast.error(e.message || "Couldn't update booking.");
    }
  };

  return (
    <div className="mt-6 grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <div className="label">Upcoming</div>
        {upcoming.length === 0 && (
          <div className="card p-8 text-center text-mute">No upcoming bookings. Once you publish your services, clients can find you in Discover.</div>
        )}
        {upcoming.map((b) => (
          <div key={b.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{b.services?.title || "Service"}</div>
                <div className="text-xs text-mute mt-0.5">
                  {b.profiles?.full_name || "Client"} · {b.profiles?.phone || "no phone"}
                </div>
                <div className="text-xs text-mute mt-1">
                  {b.scheduled_for ? format(new Date(b.scheduled_for), "EEE d MMM, HH:mm") : "—"}
                  {" · "}
                  {b.location_type === "salon" ? "At salon" : "Home visit"}
                </div>
                {b.notes && <p className="text-xs text-mute mt-2 italic">"{b.notes}"</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-lg">{KES(b.amount_kes || 0)}</div>
                <div className="text-[10px] uppercase text-mute tracking-wider">
                  {["deposit_paid", "paid"].includes(b.payment_status) ? "deposit paid" : "unpaid"}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {b.status === "pending" && (
                <>
                  <button onClick={() => setStatus(b.id, "confirmed")} className="btn-primary !py-2 !px-3 text-xs">
                    <Check className="h-4 w-4" /> Confirm
                  </button>
                  <button onClick={() => setStatus(b.id, "cancelled")} className="btn-outline !py-2 !px-3 text-xs">
                    <X className="h-4 w-4" /> Decline
                  </button>
                </>
              )}
              {b.status === "confirmed" && (
                <button onClick={() => setStatus(b.id, "completed")} className="btn-dark !py-2 !px-3 text-xs">
                  Mark complete
                </button>
              )}
              <span className="ml-auto chip text-[10px] uppercase tracking-wider">{b.status}</span>
            </div>
          </div>
        ))}
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <div className="label">Pending requests</div>
          <div className="font-display text-3xl">
            {upcoming.filter((b) => b.status === "pending").length}
          </div>
          <p className="text-xs text-mute mt-1">Confirm within 2h to stay in fast-responders list.</p>
        </div>
        <div className="card p-4">
          <div className="label">No-show rate</div>
          <div className="font-display text-3xl">—</div>
          <p className="text-xs text-mute mt-1">Tracked from Phase 3.</p>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

function ServicesTab({
  stylistId, services, onChange,
}: { stylistId: string; services: any[]; onChange: (s: any[]) => void }) {
  const [form, setForm] = useState<any>({
    name: "", description: "", price: "", duration_min: 60,
    category: "braids", subcategory: "", hair_type_tags: [] as string[],
    intro_offer_active: false, intro_offer_percent: 15,
  });
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!form.name || !form.price) return toast.error("Name and price required");
    setBusy(true);
    const payload = {
      stylist_id: stylistId,
      title: form.name,
      description: form.description || null,
      price_kes: Number(form.price),
      duration_min: Number(form.duration_min) || 60,
      category: form.category,
      subcategory: form.subcategory || null,
      hair_type_tags: form.hair_type_tags,
      intro_offer_active: form.intro_offer_active,
      intro_offer_percent: form.intro_offer_active ? Number(form.intro_offer_percent) || null : null,
      active: true,
    };
    try {
      const { data, error } = await withTimeout(
        supabase.from("services" as any).insert(payload).select().single(),
        15000, "Saving service",
      );
      setBusy(false);
      if (error) { console.error(error); return toast.error(error.message); }
      onChange([data, ...services]);
    } catch (e: any) {
      setBusy(false);
      console.error("Add service failed:", e);
      return toast.error(e.message || "Couldn't add service.");
    }
    setForm({ ...form, name: "", description: "", price: "", subcategory: "" });
    toast.success("Service added");
  };

  const toggleActive = async (id: string, active: boolean) => {
    const prev = services;
    onChange(services.map((s) => (s.id === id ? { ...s, active } : s)));
    const { error } = await supabase.from("services" as any).update({ active }).eq("id", id);
    if (error) {
      console.error("toggleActive:", error);
      onChange(prev);
      toast.error(error.message || "Couldn't update.");
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this service permanently?")) return;
    const { error } = await supabase.from("services" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange(services.filter((s) => s.id !== id));
    toast.success("Deleted");
  };
  const toggleIntro = async (id: string, on: boolean) => {
    const prev = services;
    onChange(services.map((s) => (s.id === id ? { ...s, intro_offer_active: on } : s)));
    const { error } = await supabase.from("services" as any).update({ intro_offer_active: on }).eq("id", id);
    if (error) {
      console.error("toggleIntro:", error);
      onChange(prev);
      toast.error(error.message || "Couldn't update.");
    }
  };

  return (
    <div className="mt-6 grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2 card p-5 space-y-3 h-fit lg:sticky lg:top-6">
        <div className="font-display text-xl">Add service</div>
        <input className="input" placeholder="Title (e.g. Knotless braids – medium)"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea className="input" rows={2} placeholder="What's included"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Price (KES)</label>
            <input type="number" className="input" placeholder="3500"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" className="input" placeholder="60"
              value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {SERVICE_CATEGORIES.map((c) => (
              <button key={c.id} type="button"
                onClick={() => setForm({ ...form, category: c.id })}
                className={cn(form.category === c.id ? "chip-active" : "chip", "text-xs")}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <input className="input" placeholder="Sub-style (optional, e.g. Boho, Jumbo)"
          value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
        <div>
          <label className="label">Hair types this suits</label>
          <div className="flex flex-wrap gap-1.5">
            {HAIR_TYPES.map((h) => {
              const on = form.hair_type_tags.includes(h);
              return (
                <button key={h} type="button"
                  onClick={() => setForm({
                    ...form,
                    hair_type_tags: on
                      ? form.hair_type_tags.filter((x: string) => x !== h)
                      : [...form.hair_type_tags, h],
                  })}
                  className={cn(on ? "chip-active" : "chip", "text-xs")}>
                  {h}
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex items-center justify-between rounded-2xl border border-line p-3">
          <div>
            <div className="font-semibold text-sm">New-client intro offer</div>
            <div className="text-xs text-mute">Auto-applied at checkout for first-time clients.</div>
          </div>
          <input type="checkbox" className="h-5 w-5"
            checked={form.intro_offer_active}
            onChange={(e) => setForm({ ...form, intro_offer_active: e.target.checked })} />
        </label>
        {form.intro_offer_active && (
          <div className="flex items-center gap-2">
            <input type="number" className="input" min={5} max={50}
              value={form.intro_offer_percent}
              onChange={(e) => setForm({ ...form, intro_offer_percent: e.target.value })} />
            <span className="text-sm text-mute">% off</span>
          </div>
        )}
        <button onClick={add} disabled={busy} className="btn-primary w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add service
        </button>
      </div>

      <div className="lg:col-span-3 space-y-2">
        <div className="label">Your menu ({services.length})</div>
        {services.length === 0 && (
          <div className="card p-8 text-center text-mute">No services yet. Add your first on the left.</div>
        )}
        {services.map((s) => (
          <div key={s.id} className={cn("card p-4", !s.active && "opacity-60")}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold truncate">{s.title}</div>
                  {s.intro_offer_active && (
                    <span className="chip text-[10px] bg-mpesa-50 text-mpesa-700 border-mpesa-200">
                      Intro -{s.intro_offer_percent || 15}%
                    </span>
                  )}
                  {!s.active && <span className="chip text-[10px]">Hidden</span>}
                </div>
                <div className="text-xs text-mute mt-0.5">
                  {(SERVICE_CATEGORIES.find((c) => c.id === s.category)?.label) || s.category}
                  {s.subcategory ? ` · ${s.subcategory}` : ""}
                  {s.duration_min ? ` · ${s.duration_min}min` : ""}
                </div>
                {s.description && <p className="text-xs text-mute mt-1.5 line-clamp-2">{s.description}</p>}
                {s.hair_type_tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {s.hair_type_tags.map((h: string) => (
                      <span key={h} className="text-[10px] px-1.5 py-0.5 rounded bg-line text-mute">{h}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-lg">{KES(s.price_kes)}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => toggleActive(s.id, !s.active)} className="chip text-xs">
                {s.active ? "Hide" : "Show"}
              </button>
              <button onClick={() => toggleIntro(s.id, !s.intro_offer_active)} className="chip text-xs">
                {s.intro_offer_active ? "Stop intro" : "Add intro offer"}
              </button>
              <button onClick={() => remove(s.id)} className="ml-auto grid h-8 w-8 place-items-center rounded-full hover:bg-line">
                <Trash2 className="h-4 w-4 text-terracotta-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Portfolio                                                           */
/* ------------------------------------------------------------------ */

function PortfolioTab({
  stylistId, services, items, onChange,
}: { stylistId: string; services: any[]; items: any[]; onChange: (i: any[]) => void }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (f, i) => {
          const path = `${stylistId}/${Date.now()}-${i}-${f.name.replace(/[^a-z0-9.]/gi, "_")}`;
          const { error } = await supabase.storage.from("portfolio").upload(path, f, { upsert: false });
          if (error) throw error;
          const { data: pub } = supabase.storage.from("portfolio").getPublicUrl(path);
          return pub.publicUrl;
        }),
      );
      const rows = uploads.map((url, idx) => ({
        stylist_id: stylistId,
        image_url: url,
        sort_order: items.length + idx,
        is_cover: items.length === 0 && idx === 0,
      }));
      const { data, error } = await supabase.from("portfolio_images" as any).insert(rows).select();
      if (error) throw error;
      onChange([...items, ...(data as any[])]);
      toast.success(`${uploads.length} image${uploads.length > 1 ? "s" : ""} added`);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setCover = async (id: string) => {
    const prev = items;
    // Optimistic update first.
    onChange(items.map((it) => ({ ...it, is_cover: it.id === id })));
    // Two writes in parallel so a partial failure can be diagnosed and
    // rolled back rather than leaving every image with is_cover=false.
    const [clr, set] = await Promise.all([
      supabase.from("portfolio_images" as any).update({ is_cover: false }).eq("stylist_id", stylistId).neq("id", id),
      supabase.from("portfolio_images" as any).update({ is_cover: true }).eq("id", id),
    ]);
    if (clr.error || set.error) {
      console.error("setCover failed:", clr.error || set.error);
      onChange(prev);
      toast.error("Couldn't update cover.");
      return;
    }
    toast.success("Cover updated");
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this image?")) return;
    const { error } = await supabase.from("portfolio_images" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange(items.filter((i) => i.id !== id));
  };

  const updateCaption = async (id: string, caption: string) => {
    const prev = items;
    onChange(items.map((i) => (i.id === id ? { ...i, caption } : i)));
    const { error } = await supabase.from("portfolio_images" as any).update({ caption }).eq("id", id);
    if (error) {
      console.error("updateCaption:", error);
      onChange(prev);
      toast.error("Couldn't save caption.");
    }
  };
  const linkService = async (id: string, service_id: string | null) => {
    const prev = items;
    onChange(items.map((i) => (i.id === id ? { ...i, service_id } : i)));
    const { error } = await supabase.from("portfolio_images" as any).update({ service_id }).eq("id", id);
    if (error) {
      console.error("linkService:", error);
      onChange(prev);
      toast.error("Couldn't link service.");
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= items.length) return;
    const prev = items;
    const next = [...items];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const ordered = next.map((it, i) => ({ ...it, sort_order: i }));
    onChange(ordered);
    const results = await Promise.all(
      ordered.map((it, i) => supabase.from("portfolio_images" as any).update({ sort_order: i }).eq("id", it.id)),
    );
    const failed = results.find((r) => r.error);
    if (failed) {
      console.error("Reorder portfolio failed:", failed.error);
      onChange(prev);
      toast.error("Couldn't reorder portfolio.");
    }
  };

  return (
    <div className="mt-6">
      <div className="card p-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-display text-lg">Portfolio</div>
          <p className="text-xs text-mute">First image is your cover. Tag each shot to a service so clients see relevant work.</p>
        </div>
        <label className="btn-primary cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Upload images
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => upload(e.target.files)} disabled={uploading} />
        </label>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-mute mt-4">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-mute" />
          No portfolio images yet. Your best work is your best advert.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
          {items.map((it, idx) => (
            <div key={it.id} className="card overflow-hidden group">
              <div className="relative aspect-[4/5] bg-line">
                <img src={it.image_url} alt={it.caption || "Portfolio"} className="w-full h-full object-cover" loading="lazy" />
                {it.is_cover && (
                  <span className="absolute top-2 left-2 chip-active text-[10px] tracking-wider">
                    <Star className="h-3 w-3" /> Cover
                  </span>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => move(it.id, -1)} disabled={idx === 0}
                    className="h-7 w-7 grid place-items-center rounded-full bg-white/90 disabled:opacity-40">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(it.id, 1)} disabled={idx === items.length - 1}
                    className="h-7 w-7 grid place-items-center rounded-full bg-white/90 disabled:opacity-40">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                <input
                  className="input !py-1.5 !px-2 text-xs"
                  placeholder="Caption (optional)"
                  defaultValue={it.caption || ""}
                  onBlur={(e) => e.target.value !== (it.caption || "") && updateCaption(it.id, e.target.value)}
                />
                <select
                  className="input !py-1.5 !px-2 text-xs"
                  value={it.service_id || ""}
                  onChange={(e) => linkService(it.id, e.target.value || null)}
                >
                  <option value="">Tag a service…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <div className="flex items-center justify-between">
                  {!it.is_cover ? (
                    <button onClick={() => setCover(it.id)} className="text-[11px] underline text-ink">Make cover</button>
                  ) : <span />}
                  <button onClick={() => remove(it.id)} className="text-[11px] text-terracotta-600">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hours                                                               */
/* ------------------------------------------------------------------ */

function HoursTab({
  stylistId, availability, onChange,
}: { stylistId: string; availability: any[]; onChange: (a: any[]) => void }) {
  const byDay = useMemo(() => {
    const m: Record<number, any[]> = {};
    for (let i = 0; i < 7; i++) m[i] = [];
    availability.forEach((a) => m[a.weekday]?.push(a));
    return m;
  }, [availability]);

  const addBlock = async (weekday: number) => {
    const payload = { stylist_id: stylistId, weekday, start_time: "09:00", end_time: "17:00" };
    const { data, error } = await supabase.from("stylist_availability" as any).insert(payload).select().single();
    if (error) return toast.error(error.message);
    onChange([...availability, data]);
  };
  const updateBlock = async (id: string, patch: any) => {
    const prev = availability;
    const merged = availability.map((a) => (a.id === id ? { ...a, ...patch } : a));
    const target = merged.find((a) => a.id === id);
    if (target && target.start_time && target.end_time && target.start_time >= target.end_time) {
      toast.error("End time must be after start time.");
      return;
    }
    onChange(merged);
    const { error } = await supabase.from("stylist_availability" as any).update(patch).eq("id", id);
    if (error) {
      console.error("updateBlock:", error);
      onChange(prev);
      toast.error(error.message || "Couldn't update hours.");
    }
  };
  const removeBlock = async (id: string) => {
    const prev = availability;
    onChange(availability.filter((a) => a.id !== id));
    const { error } = await supabase.from("stylist_availability" as any).delete().eq("id", id);
    if (error) {
      console.error("removeBlock:", error);
      onChange(prev);
      toast.error(error.message || "Couldn't remove hours.");
    }
  };

  return (
    <div className="mt-6">
      <div className="card p-5">
        <div className="font-display text-lg">Weekly hours</div>
        <p className="text-xs text-mute">When clients can book you. Add multiple blocks per day for splits (e.g. AM + evening).</p>
      </div>
      <div className="mt-4 grid lg:grid-cols-2 gap-3">
        {WEEKDAYS.map((wd, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{wd}</div>
              <button onClick={() => addBlock(i)} className="chip text-xs">
                <Plus className="h-3 w-3" /> Add hours
              </button>
            </div>
            {byDay[i].length === 0 ? (
              <div className="text-xs text-mute mt-2">Closed</div>
            ) : (
              <div className="mt-2 space-y-2">
                {byDay[i].map((blk) => (
                  <div key={blk.id} className="flex items-center gap-2">
                    <input type="time" className="input !py-1.5 !px-2 text-sm" value={blk.start_time?.slice(0, 5)}
                      onChange={(e) => updateBlock(blk.id, { start_time: e.target.value })} />
                    <span className="text-mute text-sm">–</span>
                    <input type="time" className="input !py-1.5 !px-2 text-sm" value={blk.end_time?.slice(0, 5)}
                      onChange={(e) => updateBlock(blk.id, { end_time: e.target.value })} />
                    <button onClick={() => removeBlock(blk.id)} className="ml-auto grid h-8 w-8 place-items-center rounded-full hover:bg-line">
                      <Trash2 className="h-4 w-4 text-terracotta-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Policies                                                            */
/* ------------------------------------------------------------------ */

function PoliciesTab({
  stylistId, policies, onChange,
}: { stylistId: string; policies: any; onChange: (p: any) => void }) {
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const payload = { ...policies, stylist_id: stylistId };
      const { data, error } = await withTimeout(
        supabase
          .from("stylist_policies" as any)
          .upsert(payload, { onConflict: "stylist_id" })
          .select()
          .single(),
        15000, "Saving policies",
      );
      setBusy(false);
      if (error) { console.error(error); return toast.error(error.message); }
      onChange(data);
      toast.success("Policies saved");
    } catch (e: any) {
      setBusy(false);
      console.error("Save policies failed:", e);
      toast.error(e.message || "Couldn't save policies.");
    }
  };

  return (
    <div className="mt-6 max-w-2xl card p-5 space-y-4">
      <div>
        <div className="font-display text-lg">Booking policies</div>
        <p className="text-xs text-mute">Clients see these before they confirm. Clear policies = fewer no-shows.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Free cancellation window (hours)">
          <input type="number" min={0} max={168} className="input"
            value={policies.cancellation_hours}
            onChange={(e) => onChange({ ...policies, cancellation_hours: Number(e.target.value) })} />
        </Field>
        <Field label="Late grace (minutes)">
          <input type="number" min={0} max={60} className="input"
            value={policies.late_grace_min}
            onChange={(e) => onChange({ ...policies, late_grace_min: Number(e.target.value) })} />
        </Field>
        <Field label="No-show fee (% of total)">
          <input type="number" min={0} max={100} className="input"
            value={policies.no_show_fee_percent}
            onChange={(e) => onChange({ ...policies, no_show_fee_percent: Number(e.target.value) })} />
        </Field>
        <Field label="Deposit refundable?">
          <select className="input"
            value={policies.deposit_refundable ? "yes" : "no"}
            onChange={(e) => onChange({ ...policies, deposit_refundable: e.target.value === "yes" })}>
            <option value="no">No — non-refundable</option>
            <option value="yes">Yes — refundable in window</option>
          </select>
        </Field>
      </div>
      <Field label="Custom terms (optional)">
        <textarea rows={3} className="input"
          placeholder="e.g. Please come with hair washed and detangled."
          value={policies.custom_terms || ""}
          onChange={(e) => onChange({ ...policies, custom_terms: e.target.value })} />
      </Field>
      <button onClick={save} disabled={busy} className="btn-primary w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save policies
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile (stylist-level)                                             */
/* ------------------------------------------------------------------ */

function ProfileTab({ stylist, onChange }: { stylist: any; onChange: (s: any) => void }) {
  const [form, setForm] = useState({
    display_name: stylist.display_name || "",
    bio: stylist.bio || "",
    hero_image_url: stylist.hero_image_url || "",
    specialties: (stylist.specialties || []) as string[],
    travels: !!stylist.travels,
    home_service_enabled: !!stylist.home_service_enabled,
    transport_fee: stylist.transport_fee || 0,
    deposit_percentage: stylist.deposit_percentage || 50,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("stylists" as any)
          .update(form)
          .eq("id", stylist.id)
          .select()
          .single(),
        15000, "Saving profile",
      );
      setBusy(false);
      if (error) { console.error(error); return toast.error(error.message); }
      onChange(data);
      toast.success("Profile saved");
    } catch (e: any) {
      setBusy(false);
      console.error("Save stylist profile failed:", e);
      toast.error(e.message || "Couldn't save profile.");
    }
  };

  const toggleSpec = (s: string) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }));
  };

  return (
    <div className="mt-6 max-w-2xl card p-5 space-y-4">
      <div className="font-display text-lg">Business profile</div>
      <Field label="Business / display name">
        <input className="input" value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          placeholder="e.g. Naomi's Braid Bar" />
      </Field>
      <Field label="Bio">
        <textarea rows={3} className="input" value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="What clients love about your work…" />
      </Field>
      <Field label="Cover image URL">
        <input className="input" value={form.hero_image_url}
          onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
          placeholder="https://…" />
      </Field>
      <Field label="Specialties">
        <div className="flex flex-wrap gap-1.5">
          {SERVICE_CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => toggleSpec(c.id)}
              className={cn(form.specialties.includes(c.id) ? "chip-active" : "chip", "text-xs")}>
              {c.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Default deposit (%)">
          <input type="number" min={0} max={100} className="input"
            value={form.deposit_percentage}
            onChange={(e) => setForm({ ...form, deposit_percentage: Number(e.target.value) })} />
        </Field>
        <Field label="Transport fee (KES)">
          <input type="number" min={0} className="input"
            value={form.transport_fee}
            onChange={(e) => setForm({ ...form, transport_fee: Number(e.target.value) })} />
        </Field>
      </div>
      <label className="flex items-center justify-between rounded-2xl border border-line p-3">
        <div>
          <div className="font-semibold text-sm">Home visits</div>
          <div className="text-xs text-mute">Offer to travel to clients.</div>
        </div>
        <input type="checkbox" className="h-5 w-5"
          checked={form.home_service_enabled}
          onChange={(e) => setForm({ ...form, home_service_enabled: e.target.checked, travels: e.target.checked })} />
      </label>
      <button onClick={save} disabled={busy} className="btn-primary w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small bits                                                          */
/* ------------------------------------------------------------------ */

function Stat({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-wider text-mute">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
      {sub && <div className="text-[11px] text-mute mt-0.5">{sub}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
