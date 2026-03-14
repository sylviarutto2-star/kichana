import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import KichanaLogo from "@/components/KichanaLogo";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [method, setMethod] = useState<"phone" | "email">("phone");

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background page-container">
      <button onClick={() => navigate("/welcome")} className="mb-6">
        <ArrowLeft className="h-6 w-6 text-foreground" />
      </button>

      <KichanaLogo />

      <h1 className="font-display text-[28px] font-semibold tracking-tight leading-[1.1] mt-6">
        {mode === "login" ? "Welcome back" : "Create account"}
      </h1>
      <p className="text-[15px] text-muted-foreground mt-2">
        {mode === "login"
          ? "Sign in to manage your bookings"
          : "Join Kichana to discover amazing stylists"}
      </p>

      {/* Method Tabs */}
      <div className="flex gap-2 mt-8">
        <button
          onClick={() => setMethod("phone")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-inner border text-sm font-medium transition-colors ${
            method === "phone" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
          }`}
        >
          <Phone className="h-4 w-4" /> Phone
        </button>
        <button
          onClick={() => setMethod("email")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-inner border text-sm font-medium transition-colors ${
            method === "email" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
          }`}
        >
          <Mail className="h-4 w-4" /> Email
        </button>
      </div>

      {/* Form */}
      <div className="mt-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="label-text">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Amina Wanjiku"
              className="w-full mt-1.5 h-12 px-4 rounded-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        )}

        {method === "phone" ? (
          <div>
            <label className="label-text">{mode === "signup" ? "Phone Number" : "Phone"}</label>
            <div className="flex mt-1.5">
              <span className="h-12 px-3 flex items-center rounded-l-inner border border-r-0 border-border bg-secondary text-sm font-medium text-muted-foreground">
                +254
              </span>
              <input
                type="tel"
                placeholder="712 345 678"
                className="flex-1 h-12 px-4 rounded-r-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="label-text">Email</label>
            <input
              type="email"
              placeholder="amina@email.com"
              className="w-full mt-1.5 h-12 px-4 rounded-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        )}

        <div>
          <label className="label-text">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full mt-1.5 h-12 px-4 rounded-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {mode === "signup" && (
          <div>
            <label className="label-text">I want to</label>
            <div className="flex gap-2 mt-1.5">
              <button className="flex-1 py-3 rounded-inner border border-primary bg-primary/5 text-sm font-medium text-primary">
                Book services
              </button>
              <button className="flex-1 py-3 rounded-inner border border-border text-sm font-medium text-muted-foreground">
                Offer services
              </button>
            </div>
          </div>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate("/")}
        className="w-full h-14 mt-8 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base"
      >
        {mode === "login" ? "Sign In" : "Create Account"}
      </motion.button>

      <p className="text-center text-sm text-muted-foreground mt-4">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-primary font-medium"
        >
          {mode === "login" ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </motion.div>
  );
};

export default Auth;
