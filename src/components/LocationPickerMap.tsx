import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Check } from "lucide-react";
import { motion } from "framer-motion";

const DEFAULT_CENTER: [number, number] = [-1.2921, 36.8219];

const pinIcon = L.divIcon({
  className: "location-pin-marker",
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  html: `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="width:28px;height:28px;border-radius:50%;background:hsl(12,75%,55%);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
    <div style="width:2px;height:10px;background:hsl(12,75%,55%);margin-top:-2px;"></div>
  </div>`,
});

function LocationMarker({ position, onMove }: { position: [number, number]; onMove: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onMove([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} icon={pinIcon} />;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15, { animate: true });
  }, [center, map]);
  return null;
}

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLocation?: [number, number];
}

const LocationPickerMap = ({ onLocationSelect, initialLocation }: LocationPickerMapProps) => {
  const [position, setPosition] = useState<[number, number]>(initialLocation || DEFAULT_CENTER);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Reverse geocode
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
      );
      const data = await res.json();
      if (data.display_name) {
        const parts = data.display_name.split(",").slice(0, 3).join(",");
        setAddress(parts);
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  useEffect(() => {
    fetchAddress(position[0], position[1]);
  }, [position, fetchAddress]);

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          setLoading(false);
        },
        () => setLoading(false),
        { timeout: 5000 }
      );
    }
  };

  const handleConfirm = () => {
    onLocationSelect(position[0], position[1], address);
  };

  return (
    <div className="relative w-full h-[50vh] rounded-inner overflow-hidden border border-border">
      <MapContainer
        center={position}
        zoom={15}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterMap center={position} />
        <LocationMarker position={position} onMove={setPosition} />
      </MapContainer>

      {/* Locate me button */}
      <button
        onClick={handleLocateMe}
        className="absolute top-3 right-3 z-[1000] h-10 w-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center"
      >
        <Navigation className={`h-4 w-4 ${loading ? "text-primary animate-pulse" : "text-foreground"}`} />
      </button>

      {/* Address bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] p-3">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-inner p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Selected location</p>
              <p className="text-sm font-medium truncate">{address || "Tap the map to select"}</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleConfirm}
            className="w-full mt-2 h-10 rounded-sm bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Confirm Location
          </motion.button>
        </div>
      </div>

      {/* Instruction overlay */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-sm">
          <p className="text-xs text-muted-foreground">Tap the map to set your location</p>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;
