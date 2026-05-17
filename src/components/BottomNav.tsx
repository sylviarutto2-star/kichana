import { NavLink } from "react-router-dom";
import { Home, Search, Calendar, Bookmark, User } from "lucide-react";
import { Logo } from "@/components/Logo";
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
    <>
      {/* Mobile bottom nav */}
      <nav className="nav-bottom" aria-label="Primary">
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

      {/* Desktop side nav */}
      <aside className="nav-side" aria-label="Primary">
        <div className="px-2 mb-8">
          <Logo />
        </div>
        <ul className="flex flex-col gap-1">
          {items.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-terracotta-50 text-terracotta-700"
                      : "text-mute hover:text-ink hover:bg-line/40"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-auto text-[11px] text-mute px-3">
          Built in Nairobi · Kichana
        </div>
      </aside>
    </>
  );
}
