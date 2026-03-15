import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Navigation, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
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

// Custom stylist marker icon
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

// User location marker
const userIcon = L.divIcon({
  className: "user-map-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(217,91%,60%);border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.5);"></div>`,
});

// Map view controller
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

const distanceOptions = [
  { label: "1 km", value: 1, zoom: 15 },
  { label: "5 km", value: 5, zoom: 13 },
  { label: "10 km", value: 10, zoom: 12 },
  { label: "20 km", value: 20, zoom: 11 },
];

const MapView = () => {
  const navigate = useNavigate();
  const [maxDistance, setMaxDistance] = useState(10);
  const [mapZoom, setMapZoom] = useState(12);
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [locating, setLocating] = useState(false);

  // Try to get user's real location
  useEffect(() => {
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
  }, []);

  const filtered = useMemo(() => {
    return mockStylists.filter(
      (s) => getDistanceKm(userLocation[0], userLocation[1], s.latitude, s.longitude) <= maxDistance
    );
  }, [maxDistance, userLocation]);

  const handleDistanceChange = (value: number) => {
    setMaxDistance(value);
    const opt = distanceOptions.find((d) => d.value === value);
    if (opt) setMapZoom(opt.zoom);
  };

  return (
    <div className="h-screen w-full relative">
      {/* Map */}
      <MapContainer
        center={userLocation}
        zoom={mapZoom}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapController center={userLocation} zoom={mapZoom} />

        {/* User location marker */}
        <Marker position={userLocation} icon={userIcon} />

        {/* Distance circle */}
        <Circle
          center={userLocation}
          radius={maxDistance * 1000}
          pathOptions={{
            color: "hsl(12,75%,55%)",
            fillColor: "hsl(12,75%,55%)",
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: "6 4",
          }}
        />

        {/* Stylist markers */}
        {filtered.map((stylist) => (
          <Marker
            key={stylist.id}
            position={[stylist.latitude, stylist.longitude]}
            icon={createStylistIcon(stylist.image, stylist.rating)}
            eventHandlers={{
              click: () => setSelectedStylist(stylist),
            }}
          />
        ))}
      </MapContainer>

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
            onClick={() => {
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
            }}
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
