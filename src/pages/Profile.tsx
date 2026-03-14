import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Settings, CreditCard, Star, HelpCircle, LogOut, ChevronRight } from "lucide-react";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] },
};

const menuItems = [
  { icon: User, label: "Edit Profile", path: "/profile/edit" },
  { icon: CreditCard, label: "Payment Methods", path: "/profile/payments" },
  { icon: Star, label: "My Reviews", path: "/profile/reviews" },
  { icon: Settings, label: "Settings", path: "/profile/settings" },
  { icon: HelpCircle, label: "Help & Support", path: "/profile/help" },
];

const Profile = () => {
  const navigate = useNavigate();

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="px-5">
        <div className="bg-card border border-border rounded-inner p-5 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-lg">Guest User</p>
            <p className="text-sm text-muted-foreground">Sign in to manage your account</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-5 mt-6 space-y-1">
        {menuItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 py-3.5 px-1 border-b border-border"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-[15px] font-medium">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="px-5 mt-6">
        <button
          onClick={() => navigate("/welcome")}
          className="w-full flex items-center gap-3 py-3.5 px-1 text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[15px] font-medium">Sign Out</span>
        </button>
      </div>

      <p className="px-5 mt-8 text-xs text-muted-foreground text-center">KICHANA v1.0 — Nairobi, Kenya</p>
    </motion.div>
  );
};

export default Profile;
