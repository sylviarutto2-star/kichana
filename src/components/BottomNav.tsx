import { Home, Search, MapPin, Calendar, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: MapPin, label: "Map", path: "/map" },
  { icon: Calendar, label: "Bookings", path: "/bookings" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (
    location.pathname === "/welcome" ||
    location.pathname === "/auth" ||
    location.pathname === "/map" ||
    (!user && location.pathname === "/")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-50 pb-safe">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-3 py-2">
        {tabs.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex min-w-[52px] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
