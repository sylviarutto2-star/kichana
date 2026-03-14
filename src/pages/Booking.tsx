import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Home, MapPin, Camera, Upload } from "lucide-react";
import { mockStylists } from "@/data/mockData";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const Booking = () => {
  const { stylistId, serviceId } = useParams();
  const navigate = useNavigate();
  const [locationType, setLocationType] = useState<"home" | "salon">("home");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const stylist = mockStylists.find((s) => s.id === stylistId);
  const service = stylist?.services.find((s) => s.id === serviceId);
  if (!stylist || !service) return <div className="page-container">Not found</div>;

  const deposit = Math.ceil(service.price * 0.5);
  const commission = Math.ceil(service.price * 0.05);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      key: d.toISOString().split("T")[0],
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });

  const canProceed = selectedDate && selectedTime;

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-36">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-semibold tracking-tight">Book Appointment</h1>
      </div>

      <div className="px-5 space-y-6">
        {/* Service Summary */}
        <div className="bg-card border border-border rounded-inner p-4">
          <div className="flex items-center gap-3">
            <img src={stylist.image} alt={stylist.name} className="h-12 w-12 rounded-inner object-cover" />
            <div className="flex-1">
              <p className="font-display font-medium">{stylist.name}</p>
              <p className="text-sm text-muted-foreground">{service.name}</p>
            </div>
            <p className="font-display font-bold tabular-nums">KES {service.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Location Type */}
        <div>
          <label className="label-text">Where?</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setLocationType("home")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-inner border text-sm font-medium transition-colors ${
                locationType === "home"
                  ? "bg-primary/5 border-primary text-primary"
                  : "bg-card border-border text-foreground"
              }`}
            >
              <Home className="h-4 w-4" /> At Home
            </button>
            <button
              onClick={() => setLocationType("salon")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-inner border text-sm font-medium transition-colors ${
                locationType === "salon"
                  ? "bg-primary/5 border-primary text-primary"
                  : "bg-card border-border text-foreground"
              }`}
            >
              <MapPin className="h-4 w-4" /> At Salon
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="label-text">Pick a Date</label>
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
            {dates.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDate(d.key)}
                className={`flex-shrink-0 w-16 py-3 rounded-inner border text-center transition-colors ${
                  selectedDate === d.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                <p className="text-[10px] font-medium uppercase opacity-70">{d.day}</p>
                <p className="text-lg font-display font-bold tabular-nums">{d.date}</p>
                <p className="text-[10px] opacity-70">{d.month}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <label className="label-text">Pick a Time</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2.5 rounded-inner border text-sm font-medium transition-colors ${
                  selectedTime === time
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Inspo Photo */}
        <div>
          <label className="label-text">Inspiration Photo (Optional)</label>
          <button className="mt-2 w-full border-2 border-dashed border-border rounded-inner py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/30 transition-colors">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Upload a photo</p>
            <p className="text-xs">Show your stylist the look you want</p>
          </button>
        </div>

        {/* Price Breakdown */}
        <div className="bg-card border border-border rounded-inner p-4 space-y-2">
          <label className="label-text">Price Breakdown</label>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted-foreground">{service.name}</span>
            <span className="tabular-nums font-medium">KES {service.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee (5%)</span>
            <span className="tabular-nums font-medium">KES {commission.toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm">
            <span className="font-medium">Deposit (50%)</span>
            <span className="tabular-nums font-display font-bold text-primary">KES {deposit.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground">Remaining balance due after service completion</p>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky-action-bar">
        <div className="max-w-md mx-auto space-y-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!canProceed}
            onClick={() => navigate(`/payment/${stylistId}/${serviceId}`)}
            className={`w-full h-14 rounded-outer font-display font-semibold text-base transition-colors ${
              canProceed
                ? "mpesa-gradient text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Pay Deposit — KES {deposit.toLocaleString()}
          </motion.button>
          <p className="text-xs text-center text-muted-foreground">Secure your spot with a 50% deposit</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Booking;
