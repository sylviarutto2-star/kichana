import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, TrendingUp } from "lucide-react";
import type { BookingData } from "@/pages/StylistDashboard";

interface Props {
  bookings: BookingData[];
  earnings: { total: number; pending: number; completed: number };
  onUpdateStatus: (id: string, status: string) => void;
}

const DashboardBookings = ({ bookings, earnings, onUpdateStatus }: Props) => {
  const [view, setView] = useState<"upcoming" | "completed" | "earnings">("upcoming");
  const upcoming = bookings.filter((b) => b.status === "pending" || b.status === "accepted");
  const completed = bookings.filter((b) => b.status === "completed");

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["upcoming", "completed", "earnings"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-full border text-sm font-medium capitalize transition-colors ${
              view === v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "upcoming" && (
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
                      onClick={() => onUpdateStatus(booking.id, "accepted")}
                      className="flex-1 py-2 rounded-sm bg-accent text-accent-foreground text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Check className="h-4 w-4" /> Accept
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onUpdateStatus(booking.id, "cancelled")}
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
                      onClick={() => onUpdateStatus(booking.id, "completed")}
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

      {view === "completed" && (
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
                  <span className="text-xs font-medium px-2 py-1 rounded-full text-accent bg-accent/10">Completed</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{new Date(booking.appointment_date).toLocaleDateString()}</span>
                  <span className="font-display font-bold tabular-nums text-sm">
                    KES {Math.ceil(booking.total_price * 0.95).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "earnings" && (
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
  );
};

export default DashboardBookings;
