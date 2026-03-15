import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Settings, CreditCard, Star, HelpCircle, LogOut, ChevronRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
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
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/welcome");
  };

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Profile</h1>
      </div>

      <div className="px-5">
        <div className="bg-card border border-border rounded-inner p-5 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            {profile?.profile_photo ? (
              <img src={profile.profile_photo} className="h-16 w-16 rounded-full object-cover" alt="" />
            ) : (
              <User className="h-7 w-7 text-primary" />
            )}
          </div>
          <div>
            <p className="font-display font-semibold text-lg">{profile?.name || "Guest User"}</p>
            <p className="text-sm text-muted-foreground">
              {user ? profile?.email || user.email : "Sign in to manage your account"}
            </p>
          </div>
        </div>
      </div>

      {profile?.role === "stylist" && (
        <div className="px-5 mt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 p-4 rounded-inner border border-primary bg-primary/5"
          >
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="flex-1 text-left text-[15px] font-medium text-primary">Stylist Dashboard</span>
            <ChevronRight className="h-4 w-4 text-primary" />
          </motion.button>
        </div>
      )}

      <div className="px-5 mt-6 space-y-1">
        {menuItems.map(({ icon: Icon, label, path }) => (
          <button key={label} onClick={() => navigate(path)} className="w-full flex items-center gap-3 py-3.5 px-1 border-b border-border">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-[15px] font-medium">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="px-5 mt-6">
        {user ? (
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 py-3.5 px-1 text-destructive">
            <LogOut className="h-5 w-5" />
            <span className="text-[15px] font-medium">Sign Out</span>
          </button>
        ) : (
          <button onClick={() => navigate("/auth")} className="w-full flex items-center gap-3 py-3.5 px-1 text-primary">
            <User className="h-5 w-5" />
            <span className="text-[15px] font-medium">Sign In</span>
          </button>
        )}
      </div>

      <p className="px-5 mt-8 text-xs text-muted-foreground text-center">kichana v1.0 — Nairobi, Kenya</p>
    </motion.div>
  );
};

export default Profile;
