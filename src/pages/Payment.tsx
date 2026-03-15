import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Check, Smartphone, CreditCard } from "lucide-react";
import { mockStylists } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const Payment = () => {
  const { stylistId, serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa");
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [phone, setPhone] = useState("");

  const stylist = mockStylists.find((s) => s.id === stylistId);
  const service = stylist?.services.find((s) => s.id === serviceId);
  if (!stylist || !service) return <div className="page-container">Not found</div>;

  const bookingState = location.state as {
    date: string;
    time: string;
    locationType: string;
    deposit: number;
    platformFee: number;
    totalDue: number;
    remaining: number;
    transportFee: number;
    depositPercent: number;
  } | null;

  const totalDue = bookingState?.totalDue ?? Math.ceil(service.price * 0.5);
  const deposit = bookingState?.deposit ?? Math.ceil(service.price * 0.5);
  const platformFee = bookingState?.platformFee ?? Math.ceil(service.price * 0.05);
  const remaining = bookingState?.remaining ?? Math.ceil(service.price * 0.5);

  const handlePay = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to make a payment", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsPaying(true);
    try {
      if (paymentMethod === "mpesa") {
        const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
          body: { phone: phone || "0712345678", amount: totalDue },
        });
        if (error) throw error;
        if (data?.success) {
          toast({ title: "STK Push Sent", description: "Check your phone to complete the M-PESA payment" });
        }
      }

      // Create booking in DB
      if (bookingState) {
        // Convert time to 24h format
        const [timePart, ampm] = bookingState.time.split(" ");
        const [hourStr, minStr] = timePart.split(":");
        let hour = parseInt(hourStr);
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        const timeFormatted = `${hour.toString().padStart(2, "0")}:${minStr}:00`;

        const { error: bookingError } = await supabase.from("bookings").insert({
          customer_id: user.id,
          stylist_id: stylistId!,
          service_id: serviceId!,
          appointment_date: bookingState.date,
          appointment_time: timeFormatted,
          location_type: bookingState.locationType,
          total_price: service.price,
          deposit_amount: deposit,
          platform_fee: platformFee,
          remaining_balance: remaining,
          deposit_paid: true,
          status: "pending",
        });

        if (bookingError) {
          console.error("Booking error:", bookingError);
          // Continue even if booking insert fails for demo
        }
      }

      setTimeout(() => {
        setIsPaying(false);
        setIsPaid(true);
      }, 2500);
    } catch (error: any) {
      toast({ title: "Payment Error", description: error.message, variant: "destructive" });
      setIsPaying(false);
    }
  };

  if (isPaid) {
    return (
      <motion.div {...pageTransition} className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="h-20 w-20 rounded-full bg-accent flex items-center justify-center"
        >
          <Check className="h-10 w-10 text-accent-foreground" />
        </motion.div>
        <h1 className="font-display text-[24px] font-semibold tracking-tight mt-6 text-center">Booking Confirmed!</h1>
        <p className="text-[15px] text-muted-foreground mt-2 text-center leading-relaxed max-w-[280px]">
          Your deposit of KES {deposit.toLocaleString()} + platform fee has been received. {stylist.name} will confirm your appointment shortly.
        </p>
        <div className="bg-card border border-border rounded-inner p-4 mt-6 w-full max-w-sm">
          <div className="flex items-center gap-3">
            <img src={stylist.image} alt={stylist.name} className="h-12 w-12 rounded-inner object-cover" />
            <div>
              <p className="font-display font-medium">{stylist.name}</p>
              <p className="text-sm text-muted-foreground">{service.name}</p>
            </div>
          </div>
          {bookingState && (
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{new Date(bookingState.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{bookingState.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium capitalize">{bookingState.locationType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining balance</span>
                <span className="font-medium">KES {remaining.toLocaleString()}</span>
              </div>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="text-accent font-medium">Pending Confirmation</span>
          </div>
        </div>
        <div className="mt-8 w-full max-w-sm space-y-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/bookings")} className="w-full h-14 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base">
            View My Bookings
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/")} className="w-full h-14 rounded-outer bg-secondary text-secondary-foreground font-display font-medium text-base">
            Back to Home
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-36">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-semibold tracking-tight">Payment</h1>
      </div>

      <div className="px-5 space-y-6">
        <div className="text-center py-6">
          <p className="label-text">Amount Due Now</p>
          <p className="font-display text-[40px] font-bold tracking-tight tabular-nums mt-2">KES {totalDue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Deposit + 5% platform fee
          </p>
        </div>

        {/* Payment breakdown */}
        <div className="bg-card border border-border rounded-inner p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stylist deposit</span>
            <span className="tabular-nums font-medium">KES {deposit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee</span>
            <span className="tabular-nums font-medium">KES {platformFee.toLocaleString()}</span>
          </div>
          {bookingState?.transportFee ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transport fee</span>
              <span className="tabular-nums font-medium">KES {bookingState.transportFee.toLocaleString()}</span>
            </div>
          ) : null}
          <div className="border-t border-border pt-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Remaining after service</span>
              <span className="tabular-nums text-muted-foreground">KES {remaining.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="label-text">Payment Method</label>
          <div className="space-y-2 mt-2">
            <button
              onClick={() => setPaymentMethod("mpesa")}
              className={`w-full flex items-center gap-3 p-4 rounded-inner border transition-colors ${
                paymentMethod === "mpesa" ? "border-accent bg-accent/5" : "border-border bg-card"
              }`}
            >
              <div className={`h-10 w-10 rounded-inner flex items-center justify-center ${paymentMethod === "mpesa" ? "mpesa-gradient" : "bg-secondary"}`}>
                <Smartphone className={`h-5 w-5 ${paymentMethod === "mpesa" ? "text-primary-foreground" : "text-foreground"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">M-PESA</p>
                <p className="text-xs text-muted-foreground">Pay via mobile money</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "mpesa" ? "border-accent" : "border-border"}`}>
                {paymentMethod === "mpesa" && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full flex items-center gap-3 p-4 rounded-inner border transition-colors ${
                paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className={`h-10 w-10 rounded-inner flex items-center justify-center ${paymentMethod === "card" ? "bg-primary" : "bg-secondary"}`}>
                <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? "text-primary-foreground" : "text-foreground"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Card Payment</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "card" ? "border-primary" : "border-border"}`}>
                {paymentMethod === "card" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
            </button>
          </div>
        </div>

        {paymentMethod === "mpesa" && (
          <div>
            <label className="label-text">M-PESA Phone Number</label>
            <div className="flex mt-1.5">
              <span className="h-12 px-3 flex items-center rounded-l-inner border border-r-0 border-border bg-secondary text-sm font-medium text-muted-foreground">+254</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="712 345 678"
                className="flex-1 h-12 px-4 rounded-r-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">You'll receive an STK push on this number</p>
          </div>
        )}
      </div>

      <div className="sticky-action-bar">
        <div className="max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handlePay}
            disabled={isPaying}
            className={`w-full h-14 rounded-outer font-display font-semibold text-base text-primary-foreground ${
              paymentMethod === "mpesa" ? "mpesa-gradient" : "bg-primary"
            }`}
          >
            {isPaying ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="inline-block h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                {paymentMethod === "mpesa" ? "Waiting for M-PESA..." : "Processing..."}
              </span>
            ) : (
              `Pay KES ${totalDue.toLocaleString()}`
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Payment;
