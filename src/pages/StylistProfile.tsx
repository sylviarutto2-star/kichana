import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, MapPin, Clock, Verified, Users, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { demoStylists, demoServices, isDemo } from "@/lib/demoData";
import { Avatar } from "@/components/Avatar";
import { SmartImage } from "@/components/SmartImage";
import { StylistMap } from "@/components/StylistMap";
import { ReviewsSection } from "@/components/ReviewsSection";
import { KES } from "@/lib/utils";
import type { Stylist, Service } from "@/lib/database.types";

export default function StylistProfile() {
  const { id } = useParams();
  const [stylist, setStylist] = useState<(Stylist & { profile?: any }) | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<{ id: string; image_url: string }[]>([]);
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
        const [sRes, svcRes, pfRes] = await Promise.all([
          supabase.from("stylists").select("*, profiles:profiles!stylists_profile_id_fkey(full_name, avatar_url)").eq("id", id).maybeSingle(),
          supabase.from("services").select("*").eq("stylist_id", id).eq("active", true),
          supabase.from("portfolio_images").select("id, image_url").eq("stylist_id", id).order("sort_order").limit(12),
        ]);
        if (cancelled) return;
        if (sRes.error) console.error("StylistProfile: stylist query failed", sRes.error);
        if (svcRes.error) console.error("StylistProfile: services query failed", svcRes.error);
        if (pfRes.error) console.error("StylistProfile: portfolio query failed", pfRes.error);
        setStylist(sRes.data as any);
        setServices((svcRes.data as Service[]) || []);
        setPortfolio((pfRes.data as any) || []);
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
        <p className="text-mute mt-2 text-sm">This profile may have been removed or is unavailable.</p>
        <Link to="/discover" className="btn-primary mt-6 inline-flex">Back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen">
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
          {services.length === 0 && <div className="text-mute text-sm">No services yet.</div>}
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

        <div className="mt-8">
          <ReviewsSection
            stylistId={stylist.id}
            ratingAvg={Number(stylist.rating_avg ?? 0)}
            ratingCount={Number(stylist.rating_count ?? 0)}
          />
        </div>

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
