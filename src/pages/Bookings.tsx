import { motion } from "framer-motion";
import { ArrowLeft, Clock, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockStylists } from "@/data/mockData";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const mockBookings = [
  { id: "b1", stylistId: "1", serviceId: "s1", date: "Mar 18, 2026", time: "10:00 AM", status: "pending" as const, locationType: "home" },
  { id: "b2", stylistId: "4", serviceId: "s11", date: "Mar 10, 2026", time: "2:00 PM", status: "completed" as const, locationType: "salon" },
  { id: "b3", stylistId: "2", serviceId: "s5", date: "Feb 25, 2026", time: "11:00 AM", status: "completed" as const, locationType: "home" },
];

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50" },
  accepted: { label: "Accepted", icon: Check, color: "text-accent bg-accent/10" },
  completed: { label: "Completed", icon: Check, color: "text-accent bg-accent/10" },
  cancelled: { label: "Cancelled", icon: X, color: "text-destructive bg-destructive/10" },
};

const Bookings = () => {
  const navigate = useNavigate();

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">My Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your appointments</p>
      </div>

      <div className="px-5 space-y-3">
        {mockBookings.map((booking) => {
          const stylist = mockStylists.find((s) => s.id === booking.stylistId);
          const service = stylist?.services.find((s) => s.id === booking.serviceId);
          const status = statusConfig[booking.status];
          if (!stylist || !service) return null;

          return (
            <motion.div
              key={booking.id}
              whileTap={{ scale: 0.98 }}
              className="bg-card border border-border rounded-inner p-4 cursor-pointer"
              onClick={() => booking.status === "completed" ? null : navigate(`/stylist/${stylist.id}`)}
            >
              <div className="flex items-center gap-3">
                <img src={stylist.image} alt={stylist.name} className="h-14 w-14 rounded-inner object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-medium truncate">{stylist.name}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{service.name}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{booking.date}</span>
                    <span>{booking.time}</span>
                    <span className="capitalize">{booking.locationType}</span>
                  </div>
                </div>
              </div>
              {booking.status === "completed" && (
                <div className="mt-3 pt-3 border-t border-border flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/stylist/${stylist.id}`); }}
                    className="flex-1 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium"
                  >
                    Rebook
                  </button>
                  <button className="flex-1 py-2 rounded-sm bg-secondary text-secondary-foreground text-sm font-medium">
                    Leave Review
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Bookings;
