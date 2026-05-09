import { Link } from "react-router-dom";
import { Star, MapPin, Verified } from "lucide-react";
import { Avatar } from "./Avatar";
import type { Stylist } from "@/lib/database.types";
import { KES } from "@/lib/utils";

const GRADIENTS = [
  "from-terracotta-700 via-terracotta-500 to-aubergine-700",
  "from-aubergine-700 via-terracotta-600 to-gold-500",
  "from-terracotta-300 via-terracotta-500 to-aubergine-500",
  "from-aubergine-500 via-aubergine-700 to-terracotta-700",
  "from-gold-400 via-terracotta-500 to-aubergine-700",
  "from-terracotta-500 via-aubergine-500 to-aubergine-700",
];
const pickGradient = (key: string) => {
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
};

export function StylistCard({ s, fromKes }: { s: Stylist & { profile?: { full_name?: string | null; avatar_url?: string | null } }; fromKes?: number }) {
  const grad = pickGradient(s.id);
  return (
    <Link to={`/stylist/${s.id}`} className="card overflow-hidden block group">
      <div className={`relative aspect-[4/3] bg-gradient-to-br ${grad}`}>
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(216,168,90,0.55),transparent_50%)]" />
        <div className="absolute inset-0 p-5 flex flex-col justify-end text-cream">
          <div className="font-display text-2xl leading-tight drop-shadow-sm">{s.display_name}</div>
          <div className="text-xs text-cream/85 mt-0.5">{s.specialties?.slice(0, 3).join(" · ")}</div>
        </div>
        {s.featured_until && new Date(s.featured_until) > new Date() && (
          <span className="absolute left-3 top-3 rounded-full bg-gold-500 text-ink text-[10px] font-bold uppercase tracking-wider px-2 py-1">Featured</span>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-xs font-semibold flex items-center gap-1">
          <Star className="h-3 w-3 fill-gold-500 text-gold-500" /> {s.rating_avg.toFixed(1)}
        </div>
      </div>
      <div className="p-4 flex gap-3">
        <Avatar src={s.profile?.avatar_url} name={s.display_name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold truncate">{s.display_name}</h3>
            {s.verified && <Verified className="h-4 w-4 text-terracotta-600" />}
          </div>
          <p className="text-xs text-mute flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {s.neighborhoods?.[0] || s.base_location || "Nairobi"}
            {s.travels && <span className="ml-1 text-sage">• travels</span>}
          </p>
        </div>
        {fromKes != null && Number.isFinite(fromKes) && (
          <div className="text-right">
            <div className="text-[10px] uppercase text-mute">from</div>
            <div className="font-display text-lg">{KES(fromKes)}</div>
          </div>
        )}
      </div>
    </Link>
  );
}
