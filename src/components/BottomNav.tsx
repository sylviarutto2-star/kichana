import { NavLink } from "react-router-dom";
import { Home, Search, Calendar, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/discover", label: "Discover", Icon: Search },
  { to: "/bookings", label: "Bookings", Icon: Calendar },
  { to: "/vault", label: "Vault", Icon: Bookmark },
  { to: "/profile", label: "Me", Icon: User },
];

export function BottomNav() {
  return (
    <nav className="nav-bottom">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-medium",
                  isActive ? "text-terracotta-600" : "text-mute hover:text-ink"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
