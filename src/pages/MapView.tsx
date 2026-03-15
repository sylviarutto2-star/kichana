import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Navigation, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mockStylists, type Stylist } from "@/data/mockData";

// Fix Leaflet default icon issue
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

const DEFAULT_CENTER: [number, number] = [-1.2921, 36.8219]; // Nairobi

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createStylistIcon(image: string, rating: number) {
  return L.divIcon({
    className: "stylist-map-marker",
    iconSize: [56, 72],
    iconAnchor: [28, 72],
    popupAnchor: [0, -72],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:48px;height:48px;border-radius:50%;border:3px solid hsl(12,75%,55%);overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
          <img src="${image}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="background:hsl(12,75%,55%);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;margin-top:-4px;box-shadow:0 1px 4px rgba(0,0,0,0.15);">
          ★ ${rating}
        </div>
      </div>
    `,
  });
}

const userIcon = L.divIcon({
  className: "user-map-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(217,91%,60%);border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.5);"></div>`,
});

const distanceOptions = [
  { label: "1 km", value: 1, zoom: 15 },
  { label: "5 km", value: 5, zoom: 13 },
  { label: "10 km", value: 10, zoom: 12 },
  { label: "20 km", value: 20, zoom: 11 },
];

const MapView = () => {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [maxDistance, setMaxDistance] = useState(10);
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(() => {
    return mockStylists.filter(
      (s) => getDistanceKm(userLocation[0], userLocation[1], s.latitude, s.longitude) <= maxDistance
    );
  }, [maxDistance, userLocation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    mapRef.current = map;

    // Get user location
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
        },
        () => setLocating(false),
        { timeout: 5000 }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map view, user marker, and circle when location/distance changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const opt = distanceOptions.find((d) => d.value === maxDistance);
    map.setView(userLocation, opt?.zoom ?? 12, { animate: true });

    // User marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon }).addTo(map);
    }

    // Distance circle
    if (circleRef.current) {
      circleRef.current.setLatLng(userLocation);
      circleRef.current.setRadius(maxDistance * 1000);
    } else {
      circleRef.current = L.circle(userLocation, {
        radius: maxDistance * 1000,
        color: "hsl(12,75%,55%)",
        fillColor: "hsl(12,75%,55%)",
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: "6 4",
      }).addTo(map);
    }
  }, [userLocation, maxDistance]);

  // Update stylist markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    filtered.forEach((stylist) => {
      const marker = L.marker([stylist.latitude, stylist.longitude], {
        icon: createStylistIcon(stylist.image, stylist.rating),
      })
        .on("click", () => setSelectedStylist(stylist))
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [filtered]);

  const handleDistanceChange = (value: number) => {
    setMaxDistance(value);
  };

  const handleLocate = useCallback(() => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
        },
        () => setLocating(false)
      );
    }
  }, []);

  return (
    <div className="h-screen w-full relative">
      {/* Map container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] safe-area-top">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 h-10 rounded-full bg-card/90 backdrop-blur-sm border border-border px-4 flex items-center shadow-sm">
            <MapPin className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-foreground">
              {filtered.length} stylist{filtered.length !== 1 ? "s" : ""} nearby
            </span>
          </div>
          <button
            onClick={handleLocate}
            className="h-10 w-10 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm"
          >
            <Navigation className={`h-4 w-4 ${locating ? "text-primary animate-pulse" : "text-foreground"}`} />
          </button>
        </div>

        {/* Distance filter chips */}
        <div className="px-4 pb-3 flex gap-2">
          {distanceOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleDistanceChange(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-colors ${
                maxDistance === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/90 backdrop-blur-sm border border-border text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected stylist bottom sheet */}
      <AnimatePresence>
        {selectedStylist && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-[1000] px-4 pb-6"
          >
            <div className="bg-card border border-border rounded-outer p-4 shadow-xl relative">
              <button
                onClick={() => setSelectedStylist(null)}
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex gap-3">
                <img
                  src={selectedStylist.image}
                  alt={selectedStylist.name}
                  className="h-20 w-20 rounded-inner object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-lg">{selectedStylist.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-sm font-semibold tabular-nums">{selectedStylist.rating}</span>
                      <span className="text-sm text-muted-foreground">({selectedStylist.reviews})</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{selectedStylist.category}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">
                      {getDistanceKm(userLocation[0], userLocation[1], selectedStylist.latitude, selectedStylist.longitude).toFixed(1)} km away
                    </span>
                  </div>
                  <p className="text-sm font-display font-bold mt-1 tabular-nums">
                    From KES {selectedStylist.startingPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/stylist/${selectedStylist.id}`)}
                className="w-full mt-3 h-12 rounded-inner bg-primary text-primary-foreground font-display font-semibold text-[15px]"
              >
                View Profile & Book
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapView;
