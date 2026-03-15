import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import KichanaLogo from "@/components/KichanaLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [method, setMethod] = useState<"email">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"customer" | "stylist">("customer");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, name, role);
        toast({ title: "Account created!", description: "Check your email to verify your account." });
      } else {
        await signIn(email, password);
        toast({ title: "Welcome back!" });
        navigate("/");
      }
    } catch (error: any) {
      const msg = error?.message || "Something went wrong";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="mt-8 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="label-text">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amina Wanjiku"
              className="w-full mt-1.5 h-12 px-4 rounded-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        )}

        <div>
          <label className="label-text">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="amina@email.com"
            className="w-full mt-1.5 h-12 px-4 rounded-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label className="label-text">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1.5 h-12 px-4 rounded-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {mode === "signup" && (
          <div>
            <label className="label-text">I want to</label>
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={() => setRole("customer")}
                className={`flex-1 py-3 rounded-inner border text-sm font-medium transition-colors ${
                  role === "customer" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                Book services
              </button>
              <button
                onClick={() => setRole("stylist")}
                className={`flex-1 py-3 rounded-inner border text-sm font-medium transition-colors ${
                  role === "stylist" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                Offer services
              </button>
            </div>
          </div>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full h-14 mt-8 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base disabled:opacity-50"
      >
        {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
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
