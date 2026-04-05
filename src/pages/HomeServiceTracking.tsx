import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Home, MapPin, Clock, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

interface HomeBooking {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  total_price: number;
  stylist_name?: string;
  service_name?: string;
  customer_name?: string;
}

const HomeServiceTracking = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<HomeBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHomeBookings = async () => {
      // For customers: show their home bookings
      // For stylists: show home bookings assigned to them
      const isStylist = profile?.role === "stylist";

      let query = supabase
        .from("bookings")
        .select("*")
        .eq("location_type", "home")
        .order("appointment_date", { ascending: true });

      if (isStylist) {
        const { data: stylist } = await supabase
          .from("stylists")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (stylist) {
          query = query.eq("stylist_id", stylist.id);
        }
      } else {
        query = query.eq("customer_id", user.id);
      }

      const { data } = await query;
      if (data) {
        const enriched = await Promise.all(
          data.map(async (b: any) => {
            const { data: stylistProfile } = await supabase
              .from("profiles_public")
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
              customer_name: stylistProfile?.name || "Customer",
              service_name: service?.name || "Service",
            };
          })
        );
        setBookings(enriched);
      }
      setLoading(false);
    };

    fetchHomeBookings();
  }, [user, profile]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "text-accent bg-accent/10";
      case "pending": return "text-amber-600 bg-amber-100";
      case "completed": return "text-primary bg-primary/10";
      case "cancelled": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-secondary";
    }
  };

  if (!user) {
    return (
      <motion.div {...pageTransition} className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-5">
        <p className="text-muted-foreground">Sign in to view home service bookings</p>
        <button onClick={() => navigate("/auth")} className="mt-4 text-primary font-medium">Sign In</button>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-semibold tracking-tight">Home Service Bookings</h1>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
              <Home className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No home service bookings</p>
            <p className="text-sm text-muted-foreground mt-1">Home service bookings will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-card border border-border rounded-inner p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-medium">{booking.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{booking.service_name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(booking.appointment_date).toLocaleDateString()} • {booking.appointment_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Home className="h-3 w-3" /> Home visit
                  </span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display font-bold tabular-nums text-sm">
                    KES {booking.total_price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HomeServiceTracking;
