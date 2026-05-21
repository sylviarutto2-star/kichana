import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { KES, cn } from "@/lib/utils";
import { format, differenceInCalendarDays } from "date-fns";
import {
  TrendingUp, Calendar, Users, Award, Gift,
  Sparkles, Cake, Check, Megaphone, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/LoadingScreen";

/* ------------------------------------------------------------------ */
/* Types & demo fallback                                              */
/* ------------------------------------------------------------------ */

type Booking = {
  id: string;
  customer_id: string;
  scheduled_for: string;
  status: string;
  amount_kes: number;
  service?: { title?: string | null; category?: string | null } | null;
  customer?: {
    full_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    birthday?: string | null;
    marketing_opt_in?: boolean | null;
  } | null;
};

const DEMO_NAMES = [
  "Wanjiku K.", "Faith O.", "Akinyi M.", "Joy W.", "Tasha L.",
  "Brenda N.", "Cynthia A.", "Mercy W.", "Diana K.", "Sharon M.",
];
const DEMO_SERVICES = [
  { title: "Knotless Braids — Medium", price: 4500, category: "braids" },
  { title: "Silk Press", price: 3500, category: "natural" },
  { title: "Wig Install — HD Lace", price: 4500, category: "wigs" },
  { title: "Boho Braids", price: 6500, category: "braids" },
  { title: "Retwist", price: 2800, category: "locs" },
];

function buildDemoBookings(): Booking[] {
  const out: Booking[] = [];
  const now = Date.now();
  for (let i = 0; i < 32; i++) {
    const svc = DEMO_SERVICES[i % DEMO_SERVICES.length];
    const customerIdx = i % 7; // 7 customers, repeats baked in
    const past = i < 24;
    const offsetDays = past ? -(i * 2 + 1) : i - 22;
    out.push({
      id: `demo-b${i}`,
      customer_id: `demo-c${customerIdx}`,
      scheduled_for: new Date(now + offsetDays * 86400000).toISOString(),
      status: past ? "completed" : i % 3 === 0 ? "pending" : "confirmed",
      amount_kes: svc.price,
      service: { title: svc.title, category: svc.category },
      customer: {
        full_name: DEMO_NAMES[customerIdx],
        phone: `07${10 + customerIdx} ${100 + customerIdx} ${200 + customerIdx}`,
        avatar_url: null,
        birthday: customerIdx < 3
          ? new Date(1996, new Date().getMonth(), 5 + customerIdx * 4).toISOString()
          : null,
        marketing_opt_in: customerIdx !== 4,
      },
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function Business() {
  const { user, profile, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [stylist, setStylist] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activated, setActivated] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    if (profile && profile.role && profile.role !== "stylist") {
      setLoading(false);
      nav("/home");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: s } = await supabase
          .from("stylists")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        setStylist(s);

        let rows: Booking[] = [];
        if (s) {
          const { data } = await supabase
            .from("bookings")
            .select(
              "id, customer_id, scheduled_for, status, amount_kes, services(title, category), profiles:profiles!bookings_customer_id_fkey(full_name, phone, avatar_url, birthday, marketing_opt_in)"
            )
            .eq("stylist_id", (s as any).id);
          rows = (data || []).map((r: any) => ({
            id: r.id,
            customer_id: r.customer_id,
            scheduled_for: r.scheduled_for,
            status: r.status,
            amount_kes: r.amount_kes || 0,
            service: r.services,
            customer: r.profiles,
          }));
        }
        if (rows.length === 0) {
          rows = buildDemoBookings();
          if (!cancelled) setIsDemo(true);
        }
        if (!cancelled) setBookings(rows);
      } catch {
        if (!cancelled) {
          setBookings(buildDemoBookings());
          setIsDemo(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile, authLoading]);

  const stats = useMemo(() => computeStats(bookings), [bookings]);
  const customers = useMemo(() => computeCustomers(bookings), [bookings]);
  const offers = useMemo(() => buildOffers(customers), [customers]);

  const activate = async (offer: SuggestedOffer) => {
    if (isDemo || !stylist) {
      setActivated((a) => ({ ...a, [offer.id]: true }));
      toast.success(`"${offer.title}" is live — opted-in customers will see it.`);
      return;
    }
    try {
      const { error } = await supabase.from("promotions").insert({
        stylist_id: stylist.id,
        title: offer.title,
        kind: offer.kind,
        discount_percent: offer.discount,
        audience: offer.audience,
      });
      if (error) throw error;
      setActivated((a) => ({ ...a, [offer.id]: true }));
      toast.success(`"${offer.title}" is live ✨`);
    } catch (e: any) {
      console.error("Promotion activate failed:", e);
      toast.error(e?.message || "Couldn't activate this offer. Try again.");
    }
  };

  if (authLoading) return <LoadingScreen />;
  if (loading) {
    return (
      <div className="container-shell py-10 with-sidenav">
        <div className="skeleton h-40 rounded-3xl" />
      </div>
    );
  }

  const reachable = customers.filter((c) => c.optIn).length;

  return (
    <div className="pb-28 lg:pb-12 min-h-screen with-sidenav">
      <PageHeader
        title="Business"
        subtitle={stylist?.display_name || profile?.full_name || "Your business"}
        right={
          isDemo ? (
            <span className="hidden lg:inline chip text-[10px]">Sample data</span>
          ) : undefined
        }
      />

      <div className="container-shell space-y-8">
        {isDemo && (
          <div className="card p-4 bg-aubergine-700 text-cream flex items-start gap-3">
            <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              This is a preview with sample numbers, so you can feel what's coming.
              As real clients book you in, your dashboard fills with your story —
              your revenue, your regulars, your growth.
            </p>
          </div>
        )}

        {/* KPI grid */}
        <section>
          <SectionTitle icon={<TrendingUp className="h-4 w-4" />}>
            Performance
          </SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mt-3">
            <Kpi label="Revenue · 30d" value={KES(stats.revenue30)} accent
              sub={`${stats.completed30} completed`} />
            <Kpi label="Revenue · all time" value={KES(stats.revenueAll)} />
            <Kpi label="Avg order" value={KES(stats.avgOrder)} />
            <Kpi label="Upcoming pipeline" value={KES(stats.pipeline)}
              sub={`${stats.upcoming.length} bookings`} />
            <Kpi label="Repeat rate" value={`${stats.repeatRate}%`}
              sub={`${stats.repeatCustomers} loyal clients`} />
            <Kpi label="Total clients" value={String(customers.length)}
              sub={`${stats.newThisMonth} new this month`} />
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming bookings */}
          <section className="lg:col-span-2">
            <SectionTitle icon={<Calendar className="h-4 w-4" />}>
              Upcoming bookings
            </SectionTitle>
            <div className="mt-3 space-y-2">
              {stats.upcoming.length === 0 && (
                <div className="card p-6 text-center text-mute text-sm">
                  Calendar's quiet for now — the right clients are on their way.
                </div>
              )}
              {stats.upcoming.slice(0, 8).map((b) => (
                <div key={b.id} className="card p-4 flex items-center gap-3">
                  <Avatar src={b.customer?.avatar_url} name={b.customer?.full_name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">
                      {b.service?.title || "Service"}
                    </div>
                    <div className="text-xs text-mute truncate">
                      {b.customer?.full_name || "Client"} ·{" "}
                      {format(new Date(b.scheduled_for), "EEE d MMM, HH:mm")}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display">{KES(b.amount_kes)}</div>
                    <StatusPill status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Best sellers */}
          <section>
            <SectionTitle icon={<Award className="h-4 w-4" />}>
              Best sellers
            </SectionTitle>
            <div className="card p-5 mt-3 space-y-4">
              {stats.topServices.length === 0 && (
                <p className="text-sm text-mute">No finished services yet — your best sellers will show up here once you're rolling.</p>
              )}
              {stats.topServices.map((s, i) => (
                <div key={s.title}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate pr-2">
                      {i + 1}. {s.title}
                    </span>
                    <span className="text-mute shrink-0">{s.count}×</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full bg-terracotta-500"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-mute mt-1">
                    {KES(s.revenue)} earned
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Marketing offers — suggested by Kichana */}
        <section>
          <SectionTitle icon={<Megaphone className="h-4 w-4" />}>
            Offers to grow revenue
          </SectionTitle>
          <p className="text-sm text-mute mt-1">
            Hand-picked by Kichana from what works best for hair businesses —
            seasonal moments, flash sales and win-back campaigns. Offers reach
            only the <strong>{reachable}</strong> customer
            {reachable === 1 ? "" : "s"} who opted in to hear from you.
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
            {offers.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                activated={!!activated[o.id]}
                onActivate={() => activate(o)}
              />
            ))}
          </div>
        </section>

        {/* Customer database */}
        <section>
          <SectionTitle icon={<Users className="h-4 w-4" />}>
            Customer database
          </SectionTitle>
          <div className="card mt-3 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 border-b border-line text-[10px] uppercase tracking-wider text-mute font-semibold">
              <span>Customer</span>
              <span className="text-right">Visits</span>
              <span className="text-right">Spent</span>
              <span className="text-right">Last seen</span>
            </div>
            {customers.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 border-b border-line last:border-0 items-center"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar src={c.avatar} name={c.name} size={32} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {c.name}
                      {c.birthdaySoon && (
                        <Cake className="h-3.5 w-3.5 text-terracotta-600" />
                      )}
                    </div>
                    <div className="text-[11px] text-mute truncate">
                      {c.optIn ? "Reachable" : "Not opted in"}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-right">{c.visits}</span>
                <span className="text-sm text-right font-medium">{KES(c.spent)}</span>
                <span className="text-xs text-mute text-right">
                  {c.lastDays === 0 ? "Today" : `${c.lastDays}d ago`}
                </span>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="p-6 text-center text-sm text-mute">
                No customers yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analytics                                                          */
/* ------------------------------------------------------------------ */

function computeStats(bookings: Booking[]) {
  const now = Date.now();
  const d30 = now - 30 * 86400000;
  const completed = bookings.filter((b) => b.status === "completed");
  const completed30 = completed.filter(
    (b) => new Date(b.scheduled_for).getTime() >= d30
  );
  const revenue30 = completed30.reduce((s, b) => s + b.amount_kes, 0);
  const revenueAll = completed.reduce((s, b) => s + b.amount_kes, 0);
  const avgOrder = completed.length
    ? Math.round(revenueAll / completed.length)
    : 0;

  const upcoming = bookings
    .filter(
      (b) =>
        ["pending", "confirmed", "in_progress"].includes(b.status) &&
        new Date(b.scheduled_for).getTime() >= now - 3600_000
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
    );
  const pipeline = upcoming.reduce((s, b) => s + b.amount_kes, 0);

  // repeat customers
  const visitCount: Record<string, number> = {};
  bookings.forEach((b) => {
    visitCount[b.customer_id] = (visitCount[b.customer_id] || 0) + 1;
  });
  const ids = Object.keys(visitCount);
  const repeatCustomers = ids.filter((id) => visitCount[id] > 1).length;
  const repeatRate = ids.length
    ? Math.round((repeatCustomers / ids.length) * 100)
    : 0;

  // new this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const firstSeen: Record<string, number> = {};
  bookings.forEach((b) => {
    const t = new Date(b.scheduled_for).getTime();
    firstSeen[b.customer_id] = Math.min(
      firstSeen[b.customer_id] ?? Infinity,
      t
    );
  });
  const newThisMonth = Object.values(firstSeen).filter(
    (t) => t >= monthStart.getTime()
  ).length;

  // top services
  const svc: Record<string, { count: number; revenue: number }> = {};
  completed.forEach((b) => {
    const t = b.service?.title || "Other";
    svc[t] = svc[t] || { count: 0, revenue: 0 };
    svc[t].count += 1;
    svc[t].revenue += b.amount_kes;
  });
  const maxCount = Math.max(1, ...Object.values(svc).map((v) => v.count));
  const topServices = Object.entries(svc)
    .map(([title, v]) => ({
      title,
      count: v.count,
      revenue: v.revenue,
      pct: Math.round((v.count / maxCount) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    revenue30,
    revenueAll,
    avgOrder,
    completed30: completed30.length,
    upcoming,
    pipeline,
    repeatRate,
    repeatCustomers,
    newThisMonth,
    topServices,
  };
}

type CustomerRow = {
  id: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  visits: number;
  spent: number;
  lastDays: number;
  optIn: boolean;
  birthdaySoon: boolean;
  lapsed: boolean;
};

function computeCustomers(bookings: Booking[]): CustomerRow[] {
  const map: Record<string, CustomerRow & { lastTs: number }> = {};
  const now = Date.now();
  bookings.forEach((b) => {
    const c = b.customer;
    const id = b.customer_id;
    const ts = new Date(b.scheduled_for).getTime();
    if (!map[id]) {
      let birthdaySoon = false;
      if (c?.birthday) {
        const bd = new Date(c.birthday);
        const next = new Date(now);
        next.setMonth(bd.getMonth(), bd.getDate());
        const days = differenceInCalendarDays(next, new Date());
        birthdaySoon = days >= 0 && days <= 30;
      }
      map[id] = {
        id,
        name: c?.full_name || "Client",
        phone: c?.phone,
        avatar: c?.avatar_url,
        visits: 0,
        spent: 0,
        lastDays: 0,
        lastTs: 0,
        optIn: c?.marketing_opt_in !== false,
        birthdaySoon,
        lapsed: false,
      };
    }
    map[id].visits += 1;
    if (b.status === "completed") map[id].spent += b.amount_kes;
    if (ts > map[id].lastTs && ts <= now) map[id].lastTs = ts;
  });
  return Object.values(map)
    .map((c) => {
      const lastDays = c.lastTs
        ? Math.max(0, Math.round((now - c.lastTs) / 86400000))
        : 0;
      return { ...c, lastDays, lapsed: lastDays >= 60 };
    })
    .sort((a, b) => b.spent - a.spent);
}

/* ------------------------------------------------------------------ */
/* Offers — suggested by Kichana                                      */
/* ------------------------------------------------------------------ */

type SuggestedOffer = {
  id: string;
  title: string;
  why: string;
  discount: number;
  kind: string;
  audience: string;
  tag: string;
  when?: string;
};

// Kenyan retail calendar — high-intent moments for hair spend.
const CALENDAR: { name: string; month: number; day: number; tag: string }[] = [
  { name: "Valentine's Glow", month: 1, day: 14, tag: "Seasonal" },
  { name: "Easter Refresh", month: 3, day: 5, tag: "Seasonal" },
  { name: "Mother's Day Treat", month: 4, day: 10, tag: "Seasonal" },
  { name: "Madaraka Day Special", month: 5, day: 1, tag: "Holiday" },
  { name: "Mid-Year School-Holiday Rush", month: 7, day: 5, tag: "Seasonal" },
  { name: "Jamhuri Day Festive Looks", month: 11, day: 12, tag: "Holiday" },
  { name: "Christmas & New Year Glam", month: 11, day: 20, tag: "Seasonal" },
];

function buildOffers(customers: CustomerRow[]): SuggestedOffer[] {
  const now = new Date();
  const offers: SuggestedOffer[] = [];

  // Next 2 calendar moments
  const upcoming = CALENDAR.map((e) => {
    const d = new Date(now.getFullYear(), e.month, e.day);
    if (d < now) d.setFullYear(now.getFullYear() + 1);
    return { ...e, date: d };
  })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 2);

  upcoming.forEach((e) => {
    offers.push({
      id: `cal-${e.name}`,
      title: e.name,
      why: `${differenceInCalendarDays(e.date, now)} days away — book the calendar early, it's a peak hair-spend window.`,
      discount: 15,
      kind: "seasonal",
      audience: "all",
      tag: e.tag,
      when: format(e.date, "d MMM"),
    });
  });

  // Evergreen, behaviour-driven
  offers.push({
    id: "new-client",
    title: "New Client — 15% Off First Visit",
    why: "First-visit discounts are the single highest-ROI offer for service businesses. Turns browsers into bookings.",
    discount: 15,
    kind: "acquisition",
    audience: "new",
    tag: "Evergreen",
  });

  const lapsed = customers.filter((c) => c.lapsed).length;
  offers.push({
    id: "win-back",
    title: "We Miss You — Win-Back 20%",
    why: lapsed
      ? `${lapsed} customer${lapsed === 1 ? "" : "s"} haven't booked in 60+ days. A nudge brings most of them back.`
      : "Reach customers who haven't booked in 60+ days before they go elsewhere.",
    discount: 20,
    kind: "retention",
    audience: "lapsed",
    tag: "Retention",
  });

  const bdays = customers.filter((c) => c.birthdaySoon).length;
  offers.push({
    id: "birthday",
    title: "Birthday Treat — 25% Off",
    why: bdays
      ? `${bdays} customer${bdays === 1 ? "'s" : "s'"} birthday${bdays === 1 ? " is" : "s are"} within 30 days. A birthday offer feels personal and converts.`
      : "Auto-sends a discount in each customer's birthday month — personal, and a strong rebooking trigger.",
    discount: 25,
    kind: "loyalty",
    audience: "birthday",
    tag: "Loyalty",
  });

  offers.push({
    id: "loyalty",
    title: "5th Visit Free Add-On",
    why: "Rewarding repeat visits lifts retention. Loyal clients spend 3–4× more over their lifetime.",
    discount: 10,
    kind: "loyalty",
    audience: "repeat",
    tag: "Loyalty",
  });

  offers.push({
    id: "flash",
    title: "Quiet-Day Flash Sale",
    why: "Fill your slowest weekday with a 24-hour flash discount. Converts idle chair time into revenue.",
    discount: 20,
    kind: "flash",
    audience: "all",
    tag: "Flash sale",
  });

  return offers;
}

/* ------------------------------------------------------------------ */
/* UI bits                                                            */
/* ------------------------------------------------------------------ */

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 font-display text-xl">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-terracotta-50 text-terracotta-700">
        {icon}
      </span>
      {children}
    </h2>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("card p-4", accent && "bg-aubergine-700 text-cream")}>
      <div
        className={cn(
          "text-[10px] uppercase tracking-wider",
          accent ? "text-cream/70" : "text-mute"
        )}
      >
        {label}
      </div>
      <div className="font-display text-2xl mt-1">{value}</div>
      {sub && (
        <div
          className={cn(
            "text-[11px] mt-0.5",
            accent ? "text-cream/70" : "text-mute"
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-gold-400/30 text-aubergine-700",
    confirmed: "bg-sage/20 text-aubergine-700",
    in_progress: "bg-terracotta-100 text-terracotta-700",
    completed: "bg-aubergine-700 text-cream",
  };
  return (
    <span
      className={cn(
        "inline-block text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 mt-1",
        map[status] || "bg-line text-mute"
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function OfferCard({
  offer,
  activated,
  onActivate,
}: {
  offer: SuggestedOffer;
  activated: boolean;
  onActivate: () => void;
}) {
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <span className="chip text-[10px]">{offer.tag}</span>
        <span className="font-display text-lg text-terracotta-600">
          {offer.discount}% off
        </span>
      </div>
      <h3 className="font-semibold mt-2 leading-snug">{offer.title}</h3>
      <p className="text-xs text-mute mt-1.5 flex-1">{offer.why}</p>
      {offer.when && (
        <div className="text-[11px] text-mute mt-2 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Runs around {offer.when}
        </div>
      )}
      <button
        onClick={onActivate}
        disabled={activated}
        className={cn(
          "mt-3 w-full",
          activated ? "btn-outline !text-mpesa-700" : "btn-primary"
        )}
      >
        {activated ? (
          <>
            <Check className="h-4 w-4" /> Activated
          </>
        ) : (
          <>
            <Gift className="h-4 w-4" /> Activate offer
          </>
        )}
      </button>
    </div>
  );
}
