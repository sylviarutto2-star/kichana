import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Smartphone, CreditCard } from "lucide-react";
import { mockStylists } from "@/data/mockData";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] },
};

const Payment = () => {
  const { stylistId, serviceId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa");
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const stylist = mockStylists.find((s) => s.id === stylistId);
  const service = stylist?.services.find((s) => s.id === serviceId);
  if (!stylist || !service) return <div className="page-container">Not found</div>;

  const deposit = Math.ceil(service.price * 0.5);

  const handlePay = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setIsPaid(true);
    }, 2000);
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

        <h1 className="font-display text-[24px] font-semibold tracking-tight mt-6 text-center">
          Booking Confirmed!
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 text-center leading-relaxed max-w-[280px]">
          Your deposit of KES {deposit.toLocaleString()} has been received. {stylist.name} will confirm your appointment shortly.
        </p>

        <div className="bg-card border border-border rounded-inner p-4 mt-6 w-full max-w-sm">
          <div className="flex items-center gap-3">
            <img src={stylist.image} alt={stylist.name} className="h-12 w-12 rounded-inner object-cover" />
            <div>
              <p className="font-display font-medium">{stylist.name}</p>
              <p className="text-sm text-muted-foreground">{service.name}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="text-accent font-medium">Pending Confirmation</span>
          </div>
        </div>

        <div className="mt-8 w-full max-w-sm space-y-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/bookings")}
            className="w-full h-14 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base"
          >
            View My Bookings
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/")}
            className="w-full h-14 rounded-outer bg-secondary text-secondary-foreground font-display font-medium text-base"
          >
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
        {/* Amount */}
        <div className="text-center py-6">
          <p className="label-text">Deposit Amount</p>
          <p className="font-display text-[40px] font-bold tracking-tight tabular-nums mt-2">
            KES {deposit.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">50% of total service price</p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="label-text">Payment Method</label>
          <div className="space-y-2 mt-2">
            <button
              onClick={() => setPaymentMethod("mpesa")}
              className={`w-full flex items-center gap-3 p-4 rounded-inner border transition-colors ${
                paymentMethod === "mpesa" ? "border-accent bg-accent/5" : "border-border bg-card"
              }`}
            >
              <div className={`h-10 w-10 rounded-inner flex items-center justify-center ${
                paymentMethod === "mpesa" ? "mpesa-gradient" : "bg-secondary"
              }`}>
                <Smartphone className={`h-5 w-5 ${paymentMethod === "mpesa" ? "text-primary-foreground" : "text-foreground"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">M-PESA</p>
                <p className="text-xs text-muted-foreground">Pay via mobile money</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === "mpesa" ? "border-accent" : "border-border"
              }`}>
                {paymentMethod === "mpesa" && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full flex items-center gap-3 p-4 rounded-inner border transition-colors ${
                paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className={`h-10 w-10 rounded-inner flex items-center justify-center ${
                paymentMethod === "card" ? "bg-primary" : "bg-secondary"
              }`}>
                <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? "text-primary-foreground" : "text-foreground"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Card Payment</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === "card" ? "border-primary" : "border-border"
              }`}>
                {paymentMethod === "card" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
            </button>
          </div>
        </div>

        {paymentMethod === "mpesa" && (
          <div>
            <label className="label-text">M-PESA Phone Number</label>
            <div className="flex mt-1.5">
              <span className="h-12 px-3 flex items-center rounded-l-inner border border-r-0 border-border bg-secondary text-sm font-medium text-muted-foreground">
                +254
              </span>
              <input
                type="tel"
                placeholder="712 345 678"
                className="flex-1 h-12 px-4 rounded-r-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">You'll receive an STK push on this number</p>
          </div>
        )}
      </div>

      {/* Sticky Action */}
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
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="inline-block h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
                Processing...
              </span>
            ) : (
              `Pay KES ${deposit.toLocaleString()}`
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Payment;
