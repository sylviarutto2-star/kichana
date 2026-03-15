import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const titles: Record<string, string> = {
  "/profile/payments": "Payment Methods",
  "/profile/reviews": "My Reviews",
  "/profile/settings": "Settings",
  "/profile/help": "Help & Support",
};

const ProfilePlaceholder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const title = titles[location.pathname] || "Page";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-[24px] font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="px-5 mt-12 text-center">
        <p className="text-muted-foreground text-sm">Coming soon</p>
      </div>
    </motion.div>
  );
};

export default ProfilePlaceholder;
