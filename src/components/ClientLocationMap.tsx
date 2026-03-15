import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation2 } from "lucide-react";

const clientIcon = L.divIcon({
  className: "client-location-marker",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `<div style="width:24px;height:24px;border-radius:50%;background:hsl(12,75%,55%);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="6"/></svg>
  </div>`,
});

interface ClientLocationMapProps {
  latitude: number;
  longitude: number;
  customerName?: string;
  address?: string;
}

const ClientLocationMap = ({ latitude, longitude, customerName, address }: ClientLocationMapProps) => {
  const handleNavigate = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, "_blank");
  };

  return (
    <div className="w-full rounded-inner overflow-hidden border border-border">
      <div className="h-[200px] relative">
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          dragging={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[latitude, longitude]} icon={clientIcon}>
            <Popup>{customerName || "Client location"}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="p-3 bg-card flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Client location</p>
          <p className="text-sm font-medium truncate">{address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}</p>
        </div>
        <button
          onClick={handleNavigate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0"
        >
          <Navigation2 className="h-3.5 w-3.5" /> Navigate
        </button>
      </div>
    </div>
  );
};

export default ClientLocationMap;
