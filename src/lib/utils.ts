import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const KES = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export const initials = (name?: string | null) =>
  (name || "").split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "K";

// Accepts Kenyan-style numbers: 07XX XXX XXX, 01XX…, or +254 / 254 prefixed.
export function isValidPhone(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 12;
}

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
