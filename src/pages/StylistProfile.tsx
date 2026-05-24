import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, MapPin, Clock, Verified, Users, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { demoStylists, demoServices, isDemo } from "@/lib/demoData";
import { Avatar } from "@/components/Avatar";
import { SmartImage } from "@/components/SmartImage";
import { StylistMap } from "@/components/StylistMap";
import { KES, cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Stylist, Service } from "@/lib/database.types";

type Review = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  reply: string | null;
  reply_at: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export default function StylistProfile() {
  const { id } = useParams();
  const [stylist, setStylist] = useState<(Stylist & { profile?: any }) | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<{ id: string; image_url: string }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      if (!id) {
        if (!cancelled) { setError(true); setLoading(false); }
        return;
      }
      try {
        if (isDemo(id)) {
          const s = demoStylists.find((x) => x.id === id);
          if (cancelled) return;
          setStylist(s as any);
          setServices(demoServices[id] || []);
          setPortfolio([]);
          setLoading(false);
          return;
        }
        const [sRes, svcRes, pfRes, revRes] = await Promise.all([
          supabase.from("stylists").select("*, profiles:profiles!stylists_profile_id_fkey(full_name, avatar_url)").eq("id", id).maybeSingle(),
          supabase.from("services").select("*").eq("stylist_id", id).eq("active", true),
          supabase.from("portfolio_images").select("id, image_url").eq("stylist_id", id).order("sort_order").limit(12),
          (supabase as any)
            .from("reviews")
            .select("id, rating, body, created_at, reply, reply_at, profiles:profiles!reviews_customer_id_fkey(full_name, avatar_url)")
            .eq("stylist_id", id)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);
        if (cancelled) return;
        if (sRes.error) console.error("StylistProfile: stylist query failed", sRes.error);
        if (svcRes.error) console.error("StylistProfile: services query failed", svcRes.error);
        if (pfRes.error) console.error("StylistProfile: portfolio query failed", pfRes.error);
        if (revRes.error) console.error("StylistProfile: reviews query failed", revRes.error);
        setStylist(sRes.data as any);
        setServices((svcRes.data as Service[]) || []);
        setPortfolio((pfRes.data as any) || []);
        setReviews((revRes.data as Review[]) || []);
      } catch (e) {
        console.error("StylistProfile: fetch threw", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="container-app py-10"><div className="skeleton h-72 rounded-3xl" /></div>;
  if (error || !stylist) {
    return (
      <div className="container-app py-16 text-center">
        <div className="font-display text-3xl">Stylist not found</div>
        <p className="text-mute mt-2 text-sm">This profile is no longer active. Browse other stylists in Discover.</p>
        <Link to="/discover" className="btn-primary mt-6 inline-flex">Back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="pb-nav min-h-screen">
      <div className="relative h-64 md:h-80">
        <SmartImage
          src={stylist.hero_image_url}
          fallbackKey={stylist.id}
          fallbackLabel={stylist.display_name}
          className="absolute inset-0"
          alt={stylist.display_name}
        />
        <Link to="/discover" className="absolute top-4 left-4 grid h-10 w-10 place-items-center rounded-full bg-cream/95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="container-app -mt-10 relative">
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <Avatar src={stylist.profile?.avatar_url} name={stylist.display_name} size={64} className="-mt-12 ring-4 ring-cream" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h1 className="font-display text-2xl truncate">{stylist.display_name}</h1>
                {stylist.verified && <Verified className="h-5 w-5 text-terracotta-600" />}
              </div>
              <div className="text-sm text-mute mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold-500 text-gold-500" /> {(stylist.rating_avg ?? 0).toFixed(1)} ({stylist.rating_count ?? 0})</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {stylist.neighborhoods?.join(", ")}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {stylist.bookings_count} done</span>
              </div>
            </div>
          </div>
          {stylist.bio && <p className="text-sm text-mute mt-4">{stylist.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-1">
            {stylist.specialties?.map((sp) => <span key={sp} className="chip">{sp}</span>)}
          </div>
        </div>

        <h2 className="font-display text-2xl mt-8 mb-3">Services</h2>
        <div className="grid gap-3">
          {services.map((s) => (
            <div key={s.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{s.title}</div>
                {s.description && <p className="text-xs text-mute mt-0.5">{s.description}</p>}
                <div className="text-xs text-mute mt-1 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {Math.round(s.duration_min/60*10)/10}h
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg">{KES(s.price_kes)}</div>
                <Link to={`/book/${stylist.id}?service=${s.id}`} className="btn-primary !py-2 !px-3 text-xs mt-2">Book</Link>
              </div>
            </div>
          ))}
          {services.length === 0 && <div className="text-mute text-sm">{stylist.display_name} hasn't listed services yet.</div>}
        </div>

        <div className="flex items-center justify-between mt-8 mb-3">
          <h2 className="font-display text-2xl">Portfolio</h2>
          <Link to={`/group/${stylist.id}`} className="text-sm font-semibold text-terracotta-600">Group booking →</Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {portfolio.length > 0 ? (
            portfolio.map((p) => <img key={p.id} src={p.image_url} className="aspect-square rounded-xl object-cover" />)
          ) : (
            <div className="col-span-3 text-mute text-sm">No portfolio images yet.</div>
          )}
        </div>

        <ReviewsBlock
          reviews={reviews}
          ratingAvg={Number(stylist.rating_avg ?? 0)}
          ratingCount={Number(stylist.rating_count ?? 0)}
        />

        {stylist.lat != null && stylist.lng != null && (
          <>
            <h2 className="font-display text-2xl mt-8 mb-3">Where to find them</h2>
            <StylistMap
              stylists={[{
                id: stylist.id,
                display_name: stylist.display_name,
                lat: stylist.lat,
                lng: stylist.lng,
                rating_avg: stylist.rating_avg,
                base_location: stylist.base_location,
              }]}
              height={240}
            />
            <p className="text-xs text-mute mt-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {stylist.base_location || stylist.neighborhoods?.join(", ")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewsBlock({
  reviews,
  ratingAvg,
  ratingCount,
}: {
  reviews: Review[];
  ratingAvg: number;
  ratingCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? reviews : reviews.slice(0, 5);

  // Distribution count per star (1..5)
  const dist = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length;

  return (
    <>
      <h2 className="font-display text-2xl mt-8 mb-3">Reviews</h2>
      {ratingCount === 0 || reviews.length === 0 ? (
        <div className="card p-6 text-mute text-sm">
          No reviews yet. Be the first to share your experience after your appointment.
        </div>
      ) : (
        <div className="card p-5">
          <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="text-center sm:text-left">
              <div className="font-display text-5xl leading-none">{ratingAvg.toFixed(1)}</div>
              <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "h-4 w-4",
                      s <= Math.round(ratingAvg) ? "fill-gold-500 text-gold-500" : "text-line",
                    )}
                  />
                ))}
              </div>
              <div className="text-xs text-mute mt-1">{ratingCount} review{ratingCount === 1 ? "" : "s"}</div>
            </div>
            <div className="space-y-1.5">
              {dist.slice().reverse().map(({ star, count }) => {
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-mute">{star}</span>
                    <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                    <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                      <div
                        className="h-full bg-gold-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-mute">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {visible.map((r) => (
              <div key={r.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-start gap-3">
                  <Avatar src={r.profiles?.avatar_url} name={r.profiles?.full_name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">
                        {r.profiles?.full_name || "Kichana customer"}
                      </div>
                      <div className="text-[11px] text-mute shrink-0">
                        {format(new Date(r.created_at), "d MMM yyyy")}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3.5 w-3.5",
                            s <= r.rating ? "fill-gold-500 text-gold-500" : "text-line",
                          )}
                        />
                      ))}
                    </div>
                    {r.body && (
                      <p className="text-sm text-ink/85 mt-2 leading-relaxed whitespace-pre-line">
                        {r.body}
                      </p>
                    )}
                    {r.reply && (
                      <div className="mt-3 ml-1 pl-3 border-l-2 border-line">
                        <div className="text-[11px] font-semibold text-mute uppercase tracking-wider">
                          Reply from the stylist
                        </div>
                        <p className="text-sm text-mute mt-1 whitespace-pre-line">{r.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length > 5 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="btn-outline w-full mt-5 text-sm"
            >
              {expanded ? "Show fewer" : `Show all ${reviews.length} reviews`}
            </button>
          )}
        </div>
      )}
    </>
  );
}
