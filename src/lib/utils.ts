import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const KES = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n)
    ? "—"
    : new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export const initials = (name?: string | null) =>
  (name || "").split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "K";

export const NAIROBI_AREAS = [
  "Westlands", "Kilimani", "Lavington", "Karen", "Runda", "Parklands",
  "South B", "South C", "Langata", "Kileleshwa", "Hurlingham", "Upperhill",
  "Eastleigh", "Donholm", "Buruburu", "Embakasi", "Ruaka", "Kasarani",
  "Kahawa", "Roysambu", "Ngong Road", "Ruiru", "Thika Road",
] as const;

export const SERVICE_CATEGORIES = [
  { id: "braids", label: "Braids", emoji: "👑" },
  { id: "wigs", label: "Wigs & Installs", emoji: "💇🏾‍♀️" },
  { id: "natural", label: "Natural Hair", emoji: "🌿" },
  { id: "locs", label: "Locs", emoji: "🪢" },
  { id: "color", label: "Color", emoji: "🎨" },
  { id: "barber", label: "Barber", emoji: "✂️" },
  { id: "nails", label: "Nails", emoji: "💅🏾" },
  { id: "lashes", label: "Lashes & Brows", emoji: "👁️" },
] as const;

export type CategoryId = (typeof SERVICE_CATEGORIES)[number]["id"];
