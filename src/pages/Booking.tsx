import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Home, MapPin, Camera, AlertCircle, Check } from "lucide-react";
import { mockStylists } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
const LocationPickerMap = lazy(() => import("@/components/LocationPickerMap"));

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const allTimeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const Booking = () => {
  const { stylistId, serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [locationType, setLocationType] = useState<"home" | "salon">("salon");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);

  const stylist = mockStylists.find((s) => s.id === stylistId);
  const service = stylist?.services.find((s) => s.id === serviceId);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate || !stylistId) return;
    const fetchBookedSlots = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("appointment_time")
        .eq("stylist_id", stylistId)
        .eq("appointment_date", selectedDate)
        .in("status", ["pending", "accepted", "confirmed"]);

      if (data) {
        const slots = data.map((b) => {
          const [h, m] = b.appointment_time.split(":");
          const hour = parseInt(h);
          const ampm = hour >= 12 ? "PM" : "AM";
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          return `${displayHour}:${m} ${ampm}`;
        });
        setBookedSlots(slots);
      }
    };
    fetchBookedSlots();
  }, [selectedDate, stylistId]);

  if (!stylist || !service) return <div className="page-container">Not found</div>;

  const homeEligible = stylist.homeServiceEnabled && stylist.completedBookings >= 3;
  const depositPercent = stylist.depositPercentage;
  const platformFee = Math.ceil(service.price * 0.05);
  const deposit = Math.ceil(service.price * (depositPercent / 100));
  const totalDue = deposit + platformFee;
  const remaining = service.price - deposit;
  const transportFee = locationType === "home" && homeEligible ? stylist.transportFee : 0;

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



  const handleProceed = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to book an appointment", variant: "destructive" });
      navigate("/auth");
      return;
    }
    // Navigate to payment with booking details in state
    navigate(`/payment/${stylistId}/${serviceId}`, {
      state: {
        date: selectedDate,
        time: selectedTime,
        locationType,
        deposit,
        platformFee,
        totalDue: totalDue + transportFee,
        remaining,
        transportFee,
        depositPercent,
        homeLocation: locationType === "home" ? homeLocation : null,
      },
    });
  };

  const canProceed = selectedDate && selectedTime && (locationType === "salon" || homeLocation);
  const isSlotBooked = (slot: string) => bookedSlots.includes(slot);

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
              onClick={() => setLocationType("salon")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-inner border text-sm font-medium transition-colors ${
                locationType === "salon" ? "bg-primary/5 border-primary text-primary" : "bg-card border-border text-foreground"
              }`}
            >
              <MapPin className="h-4 w-4" /> At Salon
            </button>
            <button
              onClick={() => {
                if (!homeEligible) {
                  toast({
                    title: "Home service unavailable",
                    description: stylist.homeServiceEnabled
                      ? "This stylist needs at least 3 completed bookings for home service"
                      : "This stylist doesn't offer home service",
                    variant: "destructive",
                  });
                  return;
                }
                setLocationType("home");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-inner border text-sm font-medium transition-colors ${
                locationType === "home" ? "bg-primary/5 border-primary text-primary" : "bg-card border-border text-foreground"
              } ${!homeEligible ? "opacity-50" : ""}`}
            >
              <Home className="h-4 w-4" /> At Home
            </button>
          </div>
          {locationType === "home" && homeEligible && transportFee > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Transport fee of KES {transportFee.toLocaleString()} applies
            </p>
          )}
        </div>

        {/* Home Location Picker */}
        {locationType === "home" && homeEligible && (
          <div>
            <label className="label-text">Your Location</label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">Select where the stylist should come</p>
            {homeLocation ? (
              <div className="bg-card border border-accent rounded-inner p-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{homeLocation.address || "Location selected"}</p>
                </div>
                <button
                  onClick={() => setHomeLocation(null)}
                  className="text-xs text-primary font-medium flex-shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <Suspense fallback={<div className="h-[50vh] rounded-inner bg-secondary animate-pulse" />}>
                <LocationPickerMap
                  onLocationSelect={(lat, lng, address) => setHomeLocation({ lat, lng, address })}
                />
              </Suspense>
            )}
          </div>
        )}

        {/* Date Selection */}
        <div>
          <label className="label-text">Pick a Date</label>
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
            {dates.map((d) => (
              <button
                key={d.key}
                onClick={() => { setSelectedDate(d.key); setSelectedTime(""); }}
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
            {allTimeSlots.map((time) => {
              const booked = isSlotBooked(time);
              return (
                <button
                  key={time}
                  onClick={() => !booked && setSelectedTime(time)}
                  disabled={booked}
                  className={`py-2.5 rounded-inner border text-sm font-medium transition-colors ${
                    booked
                      ? "bg-destructive/10 border-destructive/20 text-destructive/50 line-through cursor-not-allowed"
                      : selectedTime === time
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
          {bookedSlots.length > 0 && selectedDate && (
            <p className="text-xs text-muted-foreground mt-1.5">Strikethrough slots are already booked</p>
          )}
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
            <span className="tabular-nums font-medium">KES {platformFee.toLocaleString()}</span>
          </div>
          {transportFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transport fee</span>
              <span className="tabular-nums font-medium">KES {transportFee.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm">
            <span className="font-medium">Deposit ({depositPercent}%)</span>
            <span className="tabular-nums font-display font-bold text-primary">KES {deposit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Due now</span>
            <span className="tabular-nums font-display font-bold">KES {(totalDue + transportFee).toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Remaining KES {remaining.toLocaleString()} due after service completion
          </p>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky-action-bar">
        <div className="max-w-md mx-auto space-y-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!canProceed}
            onClick={handleProceed}
            className={`w-full h-14 rounded-outer font-display font-semibold text-base transition-colors ${
              canProceed ? "mpesa-gradient text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Pay KES {(totalDue + transportFee).toLocaleString()}
          </motion.button>
          <p className="text-xs text-center text-muted-foreground">
            Secure your spot with a {depositPercent}% deposit + platform fee
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Booking;
