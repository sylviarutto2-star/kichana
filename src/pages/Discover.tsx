import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, MapPin, Map as MapIcon, LayoutGrid, Navigation } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { StylistCard } from "@/components/StylistCard";
import { StylistMap } from "@/components/StylistMap";
import { NAIROBI_AREAS, SERVICE_CATEGORIES, cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Stylist } from "@/lib/database.types";
import { demoStylists } from "@/lib/demoData";

type Row = Stylist & {
  profile?: { full_name: string | null; avatar_url: string | null };
  from_kes?: number;
  is_featured?: boolean;
};

type SortKey = "rating" | "nearest" | "price_asc" | "price_desc" | "next";

const HAIR_TYPES = ["4A", "4B", "4C", "3A/3B", "3C", "Relaxed", "Locs"];
const LANGUAGES = ["English", "Swahili", "Sheng"];
const VIBES = ["Kid-friendly", "Quiet space", "Music", "Wheelchair", "Female-only"];
const AVAIL = ["Any", "Today", "Tomorrow", "This weekend"] as const;
type Avail = (typeof AVAIL)[number];

export default function Discover() {
  const [sp, setSp] = useSearchParams();

  // URL-synced filter state
  const [q, setQ] = useState(sp.get("q") || "");
  const [area, setArea] = useState<string | "all">(sp.get("area") || "all");
  const [cat, setCat] = useState<string | "all">(sp.get("cat") || "all");
  const [hairTypes, setHairTypes] = useState<string[]>(
    sp.get("hair")?.split(",").filter(Boolean) || []
  );
  const [langs, setLangs] = useState<string[]>(
    sp.get("lang")?.split(",").filter(Boolean) || []
  );
  const [vibes, setVibes] = useState<string[]>(
    sp.get("vibe")?.split(",").filter(Boolean) || []
  );
  const [minPrice, setMinPrice] = useState<number>(Number(sp.get("min") || 0));
  const [maxPrice, setMaxPrice] = useState<number>(Number(sp.get("max") || 25000));
  const [minRating, setMinRating] = useState<number>(Number(sp.get("rating") || 0));
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(sp.get("verified") === "1");
  const [travelsOnly, setTravelsOnly] = useState<boolean>(sp.get("travels") === "1");
  const [avail, setAvail] = useState<Avail>((sp.get("avail") as Avail) || "Any");
  const [sort, setSort] = useState<SortKey>((sp.get("sort") as SortKey) || "rating");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"grid" | "map">(
    (sp.get("view") as "grid" | "map") || "grid"
  );
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(Number(sp.get("radius") || 0));

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Persist filters in URL
  useEffect(() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (area !== "all") next.set("area", area);
    if (cat !== "all") next.set("cat", cat);
    if (hairTypes.length) next.set("hair", hairTypes.join(","));
    if (langs.length) next.set("lang", langs.join(","));
    if (vibes.length) next.set("vibe", vibes.join(","));
    if (minPrice > 0) next.set("min", String(minPrice));
    if (maxPrice < 25000) next.set("max", String(maxPrice));
    if (minRating > 0) next.set("rating", String(minRating));
    if (verifiedOnly) next.set("verified", "1");
    if (travelsOnly) next.set("travels", "1");
    if (avail !== "Any") next.set("avail", avail);
    if (sort !== "rating") next.set("sort", sort);
    if (view !== "grid") next.set("view", view);
    if (radiusKm > 0) next.set("radius", String(radiusKm));
    setSp(next, { replace: true });
  }, [q, area, cat, hairTypes, langs, vibes, minPrice, maxPrice, minRating, verifiedOnly, travelsOnly, avail, sort, view, radiusKm, setSp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("stylists")
          .select(
            "*, profiles:profiles!stylists_profile_id_fkey(full_name, avatar_url), services(price_kes)"
          )
          .order("rating_avg", { ascending: false })
          .limit(120);
        if (error) {
          console.error("Discover: stylists query failed", error);
          // Surface the error in dev — falling silently to demo data is what
          // was hiding real profiles from the admin in production.
          if (!cancelled) setRows(demoStylists as any);
          return;
        }
        const now = Date.now();
        const live: Row[] = (data || []).map((s: any) => {
          const prices: number[] = (s.services || []).map((x: any) => x.price_kes);
          return {
            ...s,
            profile: s.profiles,
            from_kes: prices.length ? Math.min(...prices) : undefined,
            // Boolean — easier to read in filter UI than parsing the date twice.
            is_featured:
              !!s.featured_until && new Date(s.featured_until).getTime() > now,
          };
        });
        // Currently-featured stylists float to the top. Expired featureds
        // fall back into the normal rating-sorted list — paying for a boost
        // should not be a permanent advantage.
        live.sort((a, b) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          return (b.rating_avg || 0) - (a.rating_avg || 0);
        });
        // Always show real stylists when they exist. Pad with demos only if
        // the live set is too thin to fill a page, so we never hide a real
        // profile behind demo data.
        const next: Row[] = live.length >= 12
          ? live
          : [...live, ...(demoStylists as any[])];
        if (!cancelled) setRows(next);
      } catch (e) {
        console.error("Discover: stylists fetch threw", e);
        if (!cancelled) setRows(demoStylists as any);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  const filtered = useMemo(() => {
    const out = rows.filter((s) => {
      if (area !== "all" && !(s.neighborhoods || []).includes(area)) return false;
      if (cat !== "all" && !(s.specialties || []).some((x) => x.toLowerCase().includes(cat))) return false;
      if (q && !(`${s.display_name} ${s.bio || ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (verifiedOnly && !s.verified) return false;
      if (travelsOnly && !s.travels) return false;
      if (minRating > 0 && s.rating_avg < minRating) return false;
      const price = s.from_kes ?? Infinity;
      if (Number.isFinite(price) && (price < minPrice || price > maxPrice)) return false;
      // Hair type / language / vibe: weak match against specialties + bio so
      // selecting one of these chips actually narrows results until those
      // attributes are first-class columns on `stylists`.
      const haystack = `${(s.specialties || []).join(" ")} ${s.bio || ""}`.toLowerCase();
      if (hairTypes.length && !hairTypes.some((h) => haystack.includes(h.toLowerCase()))) return false;
      if (langs.length && !langs.some((l) => haystack.includes(l.toLowerCase()))) return false;
      if (vibes.length && !vibes.some((v) => haystack.includes(v.toLowerCase()))) return false;
      // Availability chip is informational until live availability lands;
      // including it in deps keeps the count + URL state in sync.
      void avail;
      // Radius filter: requires both me-coords and stylist coords. Stylists
      // without coords drop out — we can't honestly say they're inside the
      // radius if we don't know where they are.
      if (radiusKm > 0 && me) {
        if (s.lat == null || s.lng == null) return false;
        if (distanceKm(me, { lat: s.lat, lng: s.lng }) > radiusKm) return false;
      }
      return true;
    });

    const sorted = [...out];
    switch (sort) {
      case "rating":
        sorted.sort((a, b) => b.rating_avg - a.rating_avg);
        break;
      case "price_asc":
        sorted.sort((a, b) => (a.from_kes ?? Infinity) - (b.from_kes ?? Infinity));
        break;
      case "price_desc":
        sorted.sort((a, b) => (b.from_kes ?? 0) - (a.from_kes ?? 0));
        break;
      case "nearest":
        if (me) {
          sorted.sort((a, b) => {
            const da = a.lat != null && a.lng != null ? distanceKm(me, { lat: a.lat, lng: a.lng }) : Infinity;
            const db = b.lat != null && b.lng != null ? distanceKm(me, { lat: b.lat, lng: b.lng }) : Infinity;
            return da - db;
          });
        } else {
          // No location yet — fall back to rating so the list still feels sensible.
          sorted.sort((a, b) => b.rating_avg - a.rating_avg);
        }
        break;
      case "next":
        // Placeholder — real next-slot derives from bookings in Phase 3.
        sorted.sort((a, b) => b.rating_count - a.rating_count);
        break;
    }
    return sorted;
  }, [rows, area, cat, q, verifiedOnly, travelsOnly, minRating, minPrice, maxPrice, sort, hairTypes, langs, vibes, avail, me, radiusKm]);

  const activeCount =
    (area !== "all" ? 1 : 0) +
    (cat !== "all" ? 1 : 0) +
    hairTypes.length +
    langs.length +
    vibes.length +
    (minPrice > 0 ? 1 : 0) +
    (maxPrice < 25000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (travelsOnly ? 1 : 0) +
    (avail !== "Any" ? 1 : 0) +
    (radiusKm > 0 ? 1 : 0);

  const clearAll = () => {
    setQ(""); setArea("all"); setCat("all"); setHairTypes([]); setLangs([]);
    setVibes([]); setMinPrice(0); setMaxPrice(25000); setMinRating(0);
    setVerifiedOnly(false); setTravelsOnly(false); setAvail("Any"); setSort("rating");
    setRadiusKm(0);
  };

  const FilterRail = (
    <FilterPanel
      area={area} setArea={setArea}
      cat={cat} setCat={setCat}
      hairTypes={hairTypes} setHairTypes={setHairTypes}
      langs={langs} setLangs={setLangs}
      vibes={vibes} setVibes={setVibes}
      minPrice={minPrice} setMinPrice={setMinPrice}
      maxPrice={maxPrice} setMaxPrice={setMaxPrice}
      minRating={minRating} setMinRating={setMinRating}
      verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
      travelsOnly={travelsOnly} setTravelsOnly={setTravelsOnly}
      avail={avail} setAvail={setAvail}
      radiusKm={radiusKm} setRadiusKm={setRadiusKm}
      hasMe={!!me} locateMe={locateMe}
      activeCount={activeCount} clearAll={clearAll}
    />
  );

  return (
    <div className="pb-28 lg:pb-12 min-h-screen with-sidenav">
      <div className="container-shell pt-6 lg:pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="h-eyebrow">Discover</p>
            <h1 className="font-display text-3xl lg:text-5xl mt-1">Nairobi's best, ranked.</h1>
            <p className="text-mute text-sm mt-1">
              {loading ? "Loading…" : `${filtered.length} stylists match your filters`}
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <ViewToggle view={view} setView={setView} />
            <SortPicker value={sort} onChange={setSort} />
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_240px_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search braids, wigs, names…"
              className="input pl-9"
            />
          </div>
          <div className="relative hidden lg:block">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="input pl-9 appearance-none"
            >
              <option value="all">All Nairobi</option>
              {NAIROBI_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="btn-outline lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>

        {/* Quick category chips (mobile + desktop) */}
        <div className="mt-4 -mx-5 px-5 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCat("all")}
            className={cn("shrink-0", cat === "all" ? "chip-active" : "chip")}
          >
            All
          </button>
          {SERVICE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn("shrink-0", cat === c.id ? "chip-active" : "chip")}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Mobile sort + view row */}
        <div className="mt-3 flex items-center justify-between gap-2 lg:hidden">
          <SortPicker value={sort} onChange={setSort} />
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-semibold text-terracotta-700"
              >
                Clear ({activeCount})
              </button>
            )}
            <ViewToggle view={view} setView={setView} />
          </div>
        </div>
      </div>

      {/* Desktop split: filter rail + results grid */}
      <div className="container-shell mt-6 lg:mt-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-8">{FilterRail}</div>
        </aside>

        <section>
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-96 rounded-3xl" />
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="card p-8 text-center">
              <p className="font-display text-xl">No matches.</p>
              <p className="text-mute text-sm mt-1">
                Try widening your area, raising your price ceiling, or clearing a filter.
              </p>
              <button onClick={clearAll} className="btn-outline mt-4">
                Clear all filters
              </button>
            </div>
          )}
          {!loading && filtered.length > 0 && view === "grid" && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <StylistCard key={s.id} s={s as any} fromKes={s.from_kes} />
              ))}
            </div>
          )}
          {!loading && filtered.length > 0 && view === "map" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-mute">
                  {filtered.filter((s) => s.lat != null).length} stylists pinned ·
                  prices shown live
                </p>
                <button onClick={locateMe} className="btn-outline !py-2 !px-3 text-xs">
                  <Navigation className="h-3.5 w-3.5" /> Near me
                </button>
              </div>
              <StylistMap
                stylists={filtered.map((s) => ({
                  id: s.id,
                  display_name: s.display_name,
                  lat: s.lat,
                  lng: s.lng,
                  rating_avg: s.rating_avg,
                  base_location: s.base_location,
                  from_kes: s.from_kes,
                }))}
                me={me}
                height={580}
              />
            </div>
          )}
        </section>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-pop animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">Filters</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-line"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {FilterRail}
            <div className="mt-6 grid grid-cols-2 gap-3 sticky bottom-0 bg-cream pt-3 -mx-5 px-5 border-t border-line">
              <button onClick={clearAll} className="btn-outline">Clear all</button>
              <button onClick={() => setFiltersOpen(false)} className="btn-primary">
                Show {filtered.length} stylists
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ViewToggle({
  view,
  setView,
}: {
  view: "grid" | "map";
  setView: (v: "grid" | "map") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-white p-0.5">
      <button
        onClick={() => setView("grid")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
          view === "grid" ? "bg-ink text-cream" : "text-mute"
        )}
        aria-pressed={view === "grid"}
      >
        <LayoutGrid className="h-3.5 w-3.5" /> Grid
      </button>
      <button
        onClick={() => setView("map")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
          view === "map" ? "bg-ink text-cream" : "text-mute"
        )}
        aria-pressed={view === "map"}
      >
        <MapIcon className="h-3.5 w-3.5" /> Map
      </button>
    </div>
  );
}

function SortPicker({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-mute">
      Sort
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink"
      >
        <option value="rating">Top rated</option>
        <option value="next">Next available</option>
        <option value="nearest">Nearest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
    </label>
  );
}

type FilterProps = {
  area: string; setArea: (v: string) => void;
  cat: string; setCat: (v: string) => void;
  hairTypes: string[]; setHairTypes: (v: string[]) => void;
  langs: string[]; setLangs: (v: string[]) => void;
  vibes: string[]; setVibes: (v: string[]) => void;
  minPrice: number; setMinPrice: (v: number) => void;
  maxPrice: number; setMaxPrice: (v: number) => void;
  minRating: number; setMinRating: (v: number) => void;
  verifiedOnly: boolean; setVerifiedOnly: (v: boolean) => void;
  travelsOnly: boolean; setTravelsOnly: (v: boolean) => void;
  avail: Avail; setAvail: (v: Avail) => void;
  radiusKm: number; setRadiusKm: (v: number) => void;
  hasMe: boolean; locateMe: () => void;
  activeCount: number; clearAll: () => void;
};

function FilterPanel(p: FilterProps) {
  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="space-y-5">
      <div className="hidden lg:flex items-center justify-between">
        <h2 className="font-display text-xl">Filters</h2>
        {p.activeCount > 0 && (
          <button
            onClick={p.clearAll}
            className="text-xs font-semibold text-terracotta-700"
          >
            Clear ({p.activeCount})
          </button>
        )}
      </div>

      <Group label="Availability">
        <div className="flex flex-wrap gap-2">
          {AVAIL.map((a) => (
            <button
              key={a}
              onClick={() => p.setAvail(a)}
              className={cn(p.avail === a ? "chip-active" : "chip")}
            >
              {a}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Location">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => p.setArea("all")}
            className={cn(p.area === "all" ? "chip-active" : "chip")}
          >
            All Nairobi
          </button>
          {NAIROBI_AREAS.slice(0, 12).map((a) => (
            <button
              key={a}
              onClick={() => p.setArea(a)}
              className={cn(p.area === a ? "chip-active" : "chip")}
            >
              {a}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.travelsOnly}
            onChange={(e) => p.setTravelsOnly(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Travels to me (home calls)
        </label>

        <div className="mt-3">
          {!p.hasMe ? (
            <button
              onClick={p.locateMe}
              className="chip text-xs"
            >
              Use my location for radius
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-mute">
                  {p.radiusKm > 0 ? `Within ${p.radiusKm} km of me` : "Any distance"}
                </span>
                {p.radiusKm > 0 && (
                  <button onClick={() => p.setRadiusKm(0)} className="text-terracotta-600">
                    Clear
                  </button>
                )}
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={p.radiusKm}
                onChange={(e) => p.setRadiusKm(Number(e.target.value))}
                className="w-full mt-1.5"
              />
              <div className="flex justify-between text-[10px] text-mute">
                <span>Off</span><span>5</span><span>15</span><span>25 km</span>
              </div>
            </>
          )}
        </div>
      </Group>

      <Group label={`Price (from KES ${p.minPrice.toLocaleString()} – ${p.maxPrice >= 25000 ? "25k+" : p.maxPrice.toLocaleString()})`}>
        <div className="flex items-center gap-3">
          <input
            type="range" min={0} max={25000} step={500}
            value={p.minPrice}
            onChange={(e) => p.setMinPrice(Math.min(Number(e.target.value), p.maxPrice - 500))}
            className="flex-1 accent-terracotta-600"
            aria-label="Minimum price"
          />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="range" min={0} max={25000} step={500}
            value={p.maxPrice}
            onChange={(e) => p.setMaxPrice(Math.max(Number(e.target.value), p.minPrice + 500))}
            className="flex-1 accent-terracotta-600"
            aria-label="Maximum price"
          />
        </div>
      </Group>

      <Group label="Trust">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.verifiedOnly}
            onChange={(e) => p.setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Verified stylists only
        </label>
        <div className="mt-3">
          <div className="text-xs text-mute mb-2">
            Minimum rating: {p.minRating > 0 ? `${p.minRating.toFixed(1)}★` : "Any"}
          </div>
          <div className="flex gap-2">
            {[0, 4.0, 4.5, 4.8].map((r) => (
              <button
                key={r}
                onClick={() => p.setMinRating(r)}
                className={cn(p.minRating === r ? "chip-active" : "chip")}
              >
                {r === 0 ? "Any" : `${r}★+`}
              </button>
            ))}
          </div>
        </div>
      </Group>

      <Group label="Hair type">
        <div className="flex flex-wrap gap-2">
          {HAIR_TYPES.map((h) => (
            <button
              key={h}
              onClick={() => toggle(p.hairTypes, h, p.setHairTypes)}
              className={cn(p.hairTypes.includes(h) ? "chip-active" : "chip")}
            >
              {h}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Language">
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => toggle(p.langs, l, p.setLangs)}
              className={cn(p.langs.includes(l) ? "chip-active" : "chip")}
            >
              {l}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Vibe">
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => (
            <button
              key={v}
              onClick={() => toggle(p.vibes, v, p.setVibes)}
              className={cn(p.vibes.includes(v) ? "chip-active" : "chip")}
            >
              {v}
            </button>
          ))}
        </div>
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-4 first:border-0 first:pt-0">
      <div className="label">{label}</div>
      {children}
    </div>
  );
}
