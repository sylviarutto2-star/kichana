import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Clock, Check, X, Plus, Settings, Image, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardBookings from "@/components/dashboard/DashboardBookings";
import DashboardServices from "@/components/dashboard/DashboardServices";
import DashboardSettings from "@/components/dashboard/DashboardSettings";
import DashboardPortfolio from "@/components/dashboard/DashboardPortfolio";

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
    if (!user) return;

    const fetchData = async () => {
      const { data: stylist } = await supabase
        .from("stylists")
        .select("*")
        .eq("user_id", user.id)
        .single();

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
            const { data: customerProfile } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", b.customer_id)
              .single();
            const { data: service } = await supabase
              .from("services")
              .select("name")
              .eq("id", b.service_id)
              .single();
            return {
              ...b,
              customer_name: customerProfile?.name || "Customer",
              service_name: service?.name || "Service",
            };
          })
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

    // Real-time booking updates
    const channel = supabase
      .channel("dashboard-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  };

  if (!user) {
    return (
      <motion.div {...pageTransition} className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-5">
        <p className="text-muted-foreground">Sign in as a stylist to access your dashboard</p>
        <button onClick={() => navigate("/auth")} className="mt-4 text-primary font-medium">Sign In</button>
      </motion.div>
    );
  }

  const upcoming = bookings.filter((b) => b.status === "pending" || b.status === "accepted");
  const isEarlyProgram = stylistData?.early_program && stylistData?.early_program_start;

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome, {profile?.name || "Stylist"}</p>
      </div>

      {/* Early Program Banner */}
      {isEarlyProgram && (
        <div className="px-5 mb-4">
          <div className="bg-accent/10 border border-accent/20 rounded-inner p-3 flex items-center gap-3">
            <Gift className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-accent">Early Stylist Program</p>
              <p className="text-xs text-muted-foreground">0% commission for 2 months — thank you for joining early!</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-5 grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-inner p-3 text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto" />
          <p className="font-display font-bold text-lg mt-1 tabular-nums">KES {earnings.total.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total Earned</p>
        </div>
        <div className="bg-card border border-border rounded-inner p-3 text-center">
          <Clock className="h-5 w-5 text-amber-500 mx-auto" />
          <p className="font-display font-bold text-lg mt-1 tabular-nums">{upcoming.length}</p>
          <p className="text-[10px] text-muted-foreground">Upcoming</p>
        </div>
        <div className="bg-card border border-border rounded-inner p-3 text-center">
          <Check className="h-5 w-5 text-accent mx-auto" />
          <p className="font-display font-bold text-lg mt-1 tabular-nums">{earnings.completed}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-6">
        <div className="flex gap-1 bg-secondary rounded-inner p-1 overflow-x-auto scrollbar-hide">
          {(["bookings", "services", "portfolio", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-sm text-sm font-medium capitalize transition-colors whitespace-nowrap px-3 ${
                activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        {activeTab === "bookings" && (
          <DashboardBookings
            bookings={bookings}
            earnings={earnings}
            onUpdateStatus={updateBookingStatus}
          />
        )}
        {activeTab === "services" && stylistData && (
          <DashboardServices stylistId={stylistData.id} />
        )}
        {activeTab === "portfolio" && stylistData && (
          <DashboardPortfolio stylistId={stylistData.id} />
        )}
        {activeTab === "settings" && stylistData && (
          <DashboardSettings stylistData={stylistData} onUpdate={setStylistData} />
        )}
      </div>
    </motion.div>
  );
};

export default StylistDashboard;
