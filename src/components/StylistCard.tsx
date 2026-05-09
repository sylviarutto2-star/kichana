import { Link } from "react-router-dom";
import { Star, MapPin, Verified } from "lucide-react";
import { Avatar } from "./Avatar";
import type { Stylist } from "@/lib/database.types";
import { KES } from "@/lib/utils";

export function StylistCard({ s, fromKes }: { s: Stylist & { profile?: { full_name?: string | null; avatar_url?: string | null } }; fromKes?: number }) {
  return (
    <Link
      to={`/stylist/${s.id}`}
      className="card overflow-hidden block group"
    >
      <div className="relative aspect-[4/3] bg-line">
        {s.hero_image_url ? (
          <img src={s.hero_image_url} alt={s.display_name} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-terracotta-100 to-aubergine-500" />
        )}
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
          <div className="mt-1 flex flex-wrap gap-1">
            {s.specialties?.slice(0, 2).map((sp) => (
              <span key={sp} className="text-[10px] uppercase tracking-wider text-mute">{sp}</span>
            ))}
          </div>
        </div>
        {fromKes != null && (
          <div className="text-right">
            <div className="text-[10px] uppercase text-mute">from</div>
            <div className="font-display text-lg">{KES(fromKes)}</div>
          </div>
        )}
      </div>
    </Link>
  );
}
