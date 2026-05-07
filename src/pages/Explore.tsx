import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, SlidersHorizontal, Star, X } from "lucide-react";
import CategoryChip from "@/components/CategoryChip";
import StylistCard from "@/components/StylistCard";
import { categories, mockStylists } from "@/data/mockData";
import { useEffect, useState, useMemo } from "react";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const distanceOptions = [
  { label: "Any", value: 0 },
  { label: "1 km", value: 1 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
];

const ratingOptions = [
  { label: "Any", value: 0 },
  { label: "4.0+", value: 4.0 },
  { label: "4.5+", value: 4.5 },
  { label: "4.8+", value: 4.8 },
];

// Haversine distance in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Default Nairobi center
const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;

const Explore = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [userLat] = useState(DEFAULT_LAT);
  const [userLng] = useState(DEFAULT_LNG);

  const filtered = useMemo(() => {
    return mockStylists.filter((s) => {
      const matchesCategory = activeCategory === "All" || s.category === activeCategory ||
        s.services.some(svc => svc.category === activeCategory);
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        s.services.some(svc => svc.name.toLowerCase().includes(search.toLowerCase()));
      const matchesRating = minRating === 0 || s.rating >= minRating;
      const matchesDistance =
        maxDistance === 0 ||
        getDistanceKm(userLat, userLng, s.latitude, s.longitude) <= maxDistance;
      return matchesCategory && matchesSearch && matchesRating && matchesDistance;
    });
  }, [activeCategory, search, minRating, maxDistance, userLat, userLng]);

  const activeFilterCount = (maxDistance > 0 ? 1 : 0) + (minRating > 0 ? 1 : 0);

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Explore</h1>

        {/* Search Bar */}
        <div className="relative mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stylists, services..."
              className="w-full h-12 pl-11 pr-4 rounded-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-12 w-12 rounded-inner border flex items-center justify-center relative transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-4">
              {/* Distance Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="label-text">Distance</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {distanceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMaxDistance(opt.value)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                        maxDistance === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="label-text">Minimum Rating</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {ratingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMinRating(opt.value)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                        minRating === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setMaxDistance(0); setMinRating(0); }}
                  className="flex items-center gap-1 text-sm text-destructive font-medium"
                >
                  <X className="h-3.5 w-3.5" /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="px-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <CategoryChip
              key={cat.label}
              label={cat.label}
              icon={cat.icon}
              active={activeCategory === cat.label}
              onClick={() => setActiveCategory(cat.label)}
            />
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {filtered.map((stylist) => (
          <StylistCard
            key={stylist.id}
            name={stylist.name}
            image={stylist.image}
            rating={stylist.rating}
            reviews={stylist.reviews}
            category={stylist.category}
            startingPrice={stylist.startingPrice}
            distance={maxDistance > 0 ? getDistanceKm(userLat, userLng, stylist.latitude, stylist.longitude) : undefined}
            onClick={() => navigate(`/stylist/${stylist.id}`)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="px-5 py-16 text-center">
          <p className="text-muted-foreground">No stylists found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      )}
    </motion.div>
  );
};

export default Explore;
