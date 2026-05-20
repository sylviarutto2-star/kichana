import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Kichana brand mark — a stylised afro with an afro-pick comb at its centre,
 * drawn from the official logo. Inline SVG so it stays crisp at every size
 * and inherits no external asset load.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Kichana"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Afro — clean core with curl bumps around the crown */}
      <g fill="#1A1512">
        <circle cx="32" cy="32" r="22" />
        <circle cx="14" cy="24" r="9" />
        <circle cx="22" cy="13" r="8.5" />
        <circle cx="32" cy="9" r="8.5" />
        <circle cx="42" cy="13" r="8.5" />
        <circle cx="50" cy="24" r="9" />
        <circle cx="13" cy="36" r="8" />
        <circle cx="51" cy="36" r="8" />
        <circle cx="20" cy="46" r="7.5" />
        <circle cx="44" cy="46" r="7.5" />
      </g>
      {/* Afro-pick comb — wooden, centred */}
      <g fill="#8A5A2E">
        <circle cx="32" cy="20" r="4.4" />
        <path d="M27.6 24.5c1-1.4 2.6-2.3 4.4-2.3s3.4.9 4.4 2.3c1.5 2.1 1.9 5 1.9 8.3h-12.6c0-3.3.4-6.2 1.9-8.3Z" />
        <rect x="24.4" y="32.4" width="3.1" height="18" rx="1.55" />
        <rect x="29.4" y="32.4" width="3.1" height="21.5" rx="1.55" />
        <rect x="34.5" y="32.4" width="3.1" height="21.5" rx="1.55" />
        <rect x="39.5" y="32.4" width="3.1" height="18" rx="1.55" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  mark = false,
  size = "md",
  linked = true,
}: {
  className?: string;
  mark?: boolean;
  size?: "sm" | "md" | "lg";
  linked?: boolean;
}) {
  const { session, profile } = useAuth();
  const markSize =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const textSize =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";

  const to = !session
    ? "/"
    : profile?.role === "stylist"
      ? "/studio"
      : "/home";

  const inner = mark ? (
    <LogoMark className={cn(markSize, className)} />
  ) : (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markSize} />
      <span className={cn("font-display tracking-tight lowercase", textSize)}>
        kichana
      </span>
    </div>
  );

  if (!linked) return inner;
  return (
    <Link to={to} aria-label="Kichana home" className="inline-flex items-center">
      {inner}
    </Link>
  );
}
