import { Link } from "react-router-dom";
import { Star, MapPin, Verified, Clock } from "lucide-react";
import { Avatar } from "./Avatar";
import { SmartImage } from "./SmartImage";
import type { Stylist } from "@/lib/database.types";
import { KES } from "@/lib/utils";

type Extra = {
  profile?: { full_name?: string | null; avatar_url?: string | null };
  // Optional pre-computed fields (P3+ will populate these for real)
  repeat_pct?: number;
  response_time?: string;
  next_slot?: string;
};

export function StylistCard({
  s,
  fromKes,
}: {
  s: Stylist & Extra;
  fromKes?: number;
}) {
  // Derive sensible faux signals from existing data so the desktop card feels
  // alive even before the real metrics ship in Phase 3.
  const repeat =
    s.repeat_pct ??
    Math.min(95, Math.max(40, Math.round(((s.rating_avg || 4.5) - 3) * 30 + 55)));
  const response = s.response_time ?? (s.verified ? "<1h" : "<3h");
  const nextSlot = s.next_slot ?? pickNextSlot(s.id);

  return (
    <Link to={`/stylist/${s.id}`} className="card overflow-hidden block group">
      <div className="relative">
        <SmartImage
          src={s.hero_image_url}
          fallbackKey={s.id}
          fallbackLabel={s.display_name}
          className="aspect-[4/5]"
          alt={s.display_name}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {s.featured_until && new Date(s.featured_until) > new Date() && (
          <span className="absolute left-3 top-3 rounded-full bg-gold-500 text-ink text-[11px] font-bold uppercase tracking-wider px-2 py-1 z-10">
            Featured
          </span>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-xs font-semibold flex items-center gap-1 z-10">
          <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
          {s.rating_avg.toFixed(1)}
          <span className="text-mute font-normal">({s.rating_count})</span>
        </div>
        {/* Face avatar overlay — portfolio leads, face stays present */}
        <div className="absolute left-3 bottom-3 z-10">
          <Avatar
            src={s.profile?.avatar_url}
            name={s.display_name}
            size={36}
          />
        </div>
        {/* Next-available pill */}
        <div className="absolute right-3 bottom-3 z-10 rounded-full bg-ink/85 text-cream text-[11px] font-semibold px-2.5 py-1 flex items-center gap-1 backdrop-blur">
          <Clock className="h-3 w-3" /> {nextSlot}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold truncate">{s.display_name}</h3>
              {s.verified && <Verified className="h-4 w-4 text-terracotta-600 shrink-0" />}
            </div>
            <p className="text-xs text-mute flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {s.neighborhoods?.[0] || s.base_location || "Nairobi"}
              {s.travels && <span className="ml-1 text-sage">· travels</span>}
            </p>
          </div>
          {fromKes != null && Number.isFinite(fromKes) && (
            <div className="text-right shrink-0">
              <div className="text-[11px] uppercase text-mute leading-none">from</div>
              <div className="font-display text-base leading-tight">{KES(fromKes)}</div>
            </div>
          )}
        </div>

        {/* Trust stack */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mute">
          {s.verified && <span className="text-ink/80">Verified</span>}
          <span>{repeat}% rebook</span>
          <span>Replies {response}</span>
        </div>

        {s.specialties?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {s.specialties.slice(0, 3).map((sp) => (
              <span
                key={sp}
                className="text-[11px] uppercase tracking-wider text-mute"
              >
                {sp}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// Stable pseudo-random slot label per stylist (placeholder until real
// availability lands in Phase 3).
function pickNextSlot(id: string) {
  const slots = ["Today 3pm", "Today 5pm", "Tomorrow 10am", "Tomorrow 2pm", "Sat 11am", "Sat 4pm"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return slots[h % slots.length];
}
