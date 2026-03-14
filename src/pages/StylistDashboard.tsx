import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, DollarSign, Clock, Check, X, ChevronRight, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

interface Booking {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  total_price: number;
  location_type: string;
  customer_name?: string;
  service_name?: string;
}

const StylistDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, completed: 0 });
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "earnings">("upcoming");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get stylist record
      const { data: stylist } = await supabase
        .from("stylists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!stylist) return;

      // Get bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("stylist_id", stylist.id)
        .order("appointment_date", { ascending: true });

      if (bookingsData) {
        // Enrich with customer names and service names
        const enriched = await Promise.all(
          bookingsData.map(async (b) => {
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
  }, [user]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  const upcoming = bookings.filter((b) => b.status === "pending" || b.status === "accepted");
  const completed = bookings.filter((b) => b.status === "completed");

  if (!user) {
    return (
      <motion.div {...pageTransition} className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-5">
        <p className="text-muted-foreground">Sign in as a stylist to access your dashboard</p>
        <button onClick={() => navigate("/auth")} className="mt-4 text-primary font-medium">Sign In</button>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome, {profile?.name || "Stylist"}</p>
      </div>

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
        <div className="flex gap-1 bg-secondary rounded-inner p-1">
          {(["upcoming", "completed", "earnings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-sm text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        {activeTab === "upcoming" && (
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No upcoming bookings</p>
            ) : (
              upcoming.map((booking) => (
                <div key={booking.id} className="bg-card border border-border rounded-inner p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{booking.service_name}</p>
                    </div>
                    <p className="font-display font-bold tabular-nums text-sm">
                      KES {booking.total_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(booking.appointment_date).toLocaleDateString()}</span>
                    <span>{booking.appointment_time}</span>
                    <span className="capitalize">{booking.location_type}</span>
                  </div>
                  {booking.status === "pending" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => updateBookingStatus(booking.id, "accepted")}
                        className="flex-1 py-2 rounded-sm bg-accent text-accent-foreground text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <Check className="h-4 w-4" /> Accept
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => updateBookingStatus(booking.id, "cancelled")}
                        className="flex-1 py-2 rounded-sm bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <X className="h-4 w-4" /> Decline
                      </motion.button>
                    </div>
                  )}
                  {booking.status === "accepted" && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => updateBookingStatus(booking.id, "completed")}
                        className="w-full py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium"
                      >
                        Mark Complete
                      </motion.button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="space-y-3">
            {completed.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No completed bookings yet</p>
            ) : (
              completed.map((booking) => (
                <div key={booking.id} className="bg-card border border-border rounded-inner p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{booking.service_name}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full text-accent bg-accent/10">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(booking.appointment_date).toLocaleDateString()}
                    </span>
                    <span className="font-display font-bold tabular-nums text-sm">
                      KES {Math.ceil(booking.total_price * 0.95).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-inner p-5">
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="font-display text-[32px] font-bold tracking-tight tabular-nums mt-1">
                KES {earnings.total.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">After 5% platform commission</p>
            </div>
            <div className="bg-card border border-border rounded-inner p-5">
              <p className="text-sm text-muted-foreground">Pending Earnings</p>
              <p className="font-display text-xl font-bold tracking-tight tabular-nums mt-1">
                KES {earnings.pending.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">From {upcoming.length} upcoming bookings</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="w-full h-14 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base"
            >
              Request Payout
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StylistDashboard;
