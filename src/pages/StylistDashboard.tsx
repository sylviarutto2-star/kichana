import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Clock, Check, Plus, Image, Gift, Search, CalendarClock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardBookings from "@/components/dashboard/DashboardBookings";
import DashboardServices from "@/components/dashboard/DashboardServices";
import DashboardSettings from "@/components/dashboard/DashboardSettings";
import DashboardPortfolio from "@/components/dashboard/DashboardPortfolio";
import StylistCard from "@/components/StylistCard";
import { mockStylists } from "@/data/mockData";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

export interface StylistData {
  id: string;
  buffer_minutes: number;
  transport_fee: number;
  deposit_percentage: number;
  home_service_enabled: boolean;
  completed_bookings_count: number;
  early_program: boolean;
  early_program_start: string | null;
}

export interface BookingData {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  total_price: number;
  location_type: string;
  deposit_amount: number;
  platform_fee: number;
  remaining_balance: number;
  customer_name?: string;
  service_name?: string;
}

const StylistDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [stylistData, setStylistData] = useState<StylistData | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, completed: 0 });
  const [activeTab, setActiveTab] = useState<"bookings" | "services" | "portfolio" | "settings">("bookings");

  useEffect(() => {
    if (!user || profile?.role !== "stylist") return;

    const fetchData = async () => {
      const { data: stylist } = await supabase.from("stylists").select("*").eq("user_id", user.id).single();
      if (!stylist) return;
      setStylistData(stylist as unknown as StylistData);

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("stylist_id", stylist.id)
        .order("appointment_date", { ascending: true });

      if (bookingsData) {
        const enriched = await Promise.all(
          bookingsData.map(async (b: any) => {
            const { data: customerProfile } = await supabase.from("profiles").select("name").eq("user_id", b.customer_id).single();
            const { data: service } = await supabase.from("services").select("name").eq("id", b.service_id).single();
            return {
              ...b,
              customer_name: customerProfile?.name || "Customer",
              service_name: service?.name || "Service",
            };
          }),
        );
        setBookings(enriched);

        const completed = enriched.filter((b) => b.status === "completed");
        const pending = enriched.filter((b) => b.status === "pending" || b.status === "accepted");
        setEarnings({
          total: completed.reduce((sum, b) => sum + Math.ceil(b.total_price * 0.95), 0),
          pending: pending.reduce((sum, b) => sum + Math.ceil(b.total_price * 0.95), 0),
          completed: completed.length,
        });
      }
    };

    fetchData();
    const channel = supabase
      .channel("dashboard-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  };

  if (!user) {
    return (
      <motion.div {...pageTransition} className="flex min-h-screen flex-col items-center justify-center bg-background px-5 pb-24 text-center">
        <p className="text-muted-foreground">Sign in to access your dashboard</p>
        <button onClick={() => navigate("/auth")} className="mt-4 font-medium text-primary">Sign In</button>
      </motion.div>
    );
  }

  if (profile?.role !== "stylist") {
    return (
      <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-6 md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-[28px] font-semibold tracking-tight">Welcome back{profile?.name ? `, ${profile.name}` : ""}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your home for rebooking, discovery and urgent help.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quick actions</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Search, title: "Find a stylist", body: "Search by service and area", href: "/explore" },
                  { icon: CalendarClock, title: "My bookings", body: "Track upcoming appointments", href: "/bookings" },
                  { icon: ArrowRight, title: "Hair SOS", body: "Get urgent repair help", href: "/sos" },
                ].map(({ icon: Icon, title, body, href }) => (
                  <button key={title} onClick={() => navigate(href)} className="rounded-2xl bg-secondary p-4 text-left">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Account</p>
              <p className="mt-4 font-display text-xl font-semibold text-foreground">Start where you left off</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Use the Kichana logo any time to return here when you’re signed in.</p>
              <button onClick={() => navigate("/profile")} className="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Manage profile
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">Recommended now</h2>
                <p className="mt-1 text-sm text-muted-foreground">Top-rated professionals with review counts shown clearly.</p>
              </div>
              <button onClick={() => navigate("/explore")} className="text-sm font-semibold text-primary">Explore all</button>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {mockStylists.slice(0, 4).map((stylist) => (
                <StylistCard
                  key={stylist.id}
                  compact
                  name={stylist.name}
                  image={stylist.image}
                  rating={stylist.rating}
                  reviews={stylist.reviews}
                  category={stylist.category}
                  startingPrice={stylist.startingPrice}
                  onClick={() => navigate(`/stylist/${stylist.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const upcoming = bookings.filter((b) => b.status === "pending" || b.status === "accepted");
  const isEarlyProgram = stylistData?.early_program && stylistData?.early_program_start;

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pb-4 pt-6">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome, {profile?.name || "Stylist"}</p>
      </div>

      {isEarlyProgram && (
        <div className="px-5 mb-4">
          <div className="rounded-inner border border-accent/20 bg-accent/10 p-3 flex items-center gap-3">
            <Gift className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-accent">Early Stylist Program</p>
              <p className="text-xs text-muted-foreground">0% commission for 2 months — thank you for joining early!</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 px-5">
        <div className="rounded-inner border border-border bg-card p-3 text-center">
          <TrendingUp className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-1 font-display text-lg font-bold tabular-nums">KES {earnings.total.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total Earned</p>
        </div>
        <div className="rounded-inner border border-border bg-card p-3 text-center">
          <Clock className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-1 font-display text-lg font-bold tabular-nums">{upcoming.length}</p>
          <p className="text-[10px] text-muted-foreground">Upcoming</p>
        </div>
        <div className="rounded-inner border border-border bg-card p-3 text-center">
          <Check className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-1 font-display text-lg font-bold tabular-nums">{earnings.completed}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="mt-6 px-5">
        <div className="flex gap-1 overflow-x-auto rounded-inner bg-secondary p-1 scrollbar-hide">
          {(["bookings", "services", "portfolio", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 whitespace-nowrap rounded-sm px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 px-5">
        {activeTab === "bookings" && <DashboardBookings bookings={bookings} earnings={earnings} onUpdateStatus={updateBookingStatus} />}
        {activeTab === "services" && stylistData && <DashboardServices stylistId={stylistData.id} />}
        {activeTab === "portfolio" && stylistData && <DashboardPortfolio stylistId={stylistData.id} />}
        {activeTab === "settings" && stylistData && <DashboardSettings stylistData={stylistData} onUpdate={setStylistData} />}
      </div>
    </motion.div>
  );
};

export default StylistDashboard;
