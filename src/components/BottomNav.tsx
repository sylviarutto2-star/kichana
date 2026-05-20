import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Search,
  Calendar,
  Bookmark,
  User,
  Scissors,
  BarChart3,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Item = { to: string; label: string; Icon: typeof Home };

const CUSTOMER_NAV: Item[] = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/discover", label: "Discover", Icon: Search },
  { to: "/bookings", label: "Bookings", Icon: Calendar },
  { to: "/vault", label: "Vault", Icon: Bookmark },
  { to: "/profile", label: "Me", Icon: User },
];

const STYLIST_NAV: Item[] = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/discover", label: "Discover", Icon: Search },
  { to: "/studio", label: "Studio", Icon: Scissors },
  { to: "/business", label: "Business", Icon: BarChart3 },
  { to: "/profile", label: "Me", Icon: User },
];

export function BottomNav() {
  const { user, profile } = useAuth();
  const items = profile?.role === "stylist" ? STYLIST_NAV : CUSTOMER_NAV;
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  useEffect(() => {
    if (!user || profile?.role === "stylist") { setHasActiveBooking(false); return; }
    let cancelled = false;
    (async () => {
      const cutoff = new Date(Date.now() - 3600_000).toISOString();
      const { data, error } = await supabase
        .from("bookings")
        .select("id")
        .eq("customer_id", user.id)
        .not("status", "in", "(cancelled,completed,no_show)")
        .gte("scheduled_for", cutoff)
        .limit(1);
      if (cancelled) return;
      setHasActiveBooking(!error && !!data && data.length > 0);
    })();
    return () => { cancelled = true; };
  }, [user, profile?.role]);

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="nav-bottom" aria-label="Primary">
        <ul className="grid grid-cols-5">
          {items.map(({ to, label, Icon }) => {
            const showDot = hasActiveBooking && to === "/bookings";
            return (
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
                <span className="relative inline-flex">
                  <Icon className="h-5 w-5" />
                  {showDot && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-terracotta-600"
                    />
                  )}
                </span>
                <span>{label}</span>
              </NavLink>
            </li>
            );
          })}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Desktop side nav */}
      <aside className="nav-side" aria-label="Primary">
        <div className="px-2 mb-8">
          <Logo />
        </div>
        <ul className="flex flex-col gap-1">
          {items.map(({ to, label, Icon }) => {
            const showDot = hasActiveBooking && to === "/bookings";
            return (
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
                {showDot && (
                  <span
                    aria-hidden="true"
                    className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-terracotta-600"
                  />
                )}
              </NavLink>
            </li>
            );
          })}
        </ul>
        <div className="mt-auto text-[11px] text-mute px-3">
          {profile?.role === "stylist"
            ? "Studio · Kichana for business"
            : "Built in Nairobi · Kichana"}
        </div>
      </aside>
    </>
  );
}
