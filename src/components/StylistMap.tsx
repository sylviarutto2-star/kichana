import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Nairobi CBD — map default centre.
const NAIROBI: [number, number] = [-1.2864, 36.8172];

export type MapStylist = {
  id: string;
  display_name: string;
  lat?: number | null;
  lng?: number | null;
  rating_avg?: number;
  base_location?: string | null;
  from_kes?: number;
};

const KES = (n?: number) =>
  n == null || !Number.isFinite(n) ? "" : `KES ${Math.round(n).toLocaleString()}`;

function priceIcon(label: string, active = false) {
  return L.divIcon({
    className: "kichana-pin",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div style="
      transform:translate(-50%,-100%);
      background:${active ? "#1A1512" : "#C4663F"};
      color:#FBF6EE;font:600 11px/1 'Plus Jakarta Sans',sans-serif;
      padding:6px 9px;border-radius:999px;white-space:nowrap;
      box-shadow:0 4px 12px rgba(0,0,0,.25);border:2px solid #FBF6EE;">
      ${label}</div>`,
  });
}

function meIcon() {
  return L.divIcon({
    className: "kichana-me",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="width:16px;height:16px;border-radius:50%;
      background:#2563eb;border:3px solid #fff;
      box-shadow:0 0 0 4px rgba(37,99,235,.25);"></div>`,
  });
}

export function StylistMap({
  stylists,
  me,
  height = 420,
}: {
  stylists: MapStylist[];
  me?: { lat: number; lng: number } | null;
  height?: number;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      center: NAIROBI,
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const pts: [number, number][] = [];
    stylists.forEach((s) => {
      if (s.lat == null || s.lng == null) return;
      pts.push([s.lat, s.lng]);
      const label = s.from_kes ? KES(s.from_kes) : s.display_name.slice(0, 14);
      const m = L.marker([s.lat, s.lng], { icon: priceIcon(label) }).addTo(layer);
      m.bindPopup(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:170px">
          <div style="font-weight:700;font-size:14px;color:#1A1512">${s.display_name}</div>
          <div style="font-size:12px;color:#7c7268;margin-top:2px">
            ${s.base_location || "Nairobi"} · ${(s.rating_avg ?? 0).toFixed(1)}★
          </div>
          <button data-stylist="${s.id}" style="
            margin-top:8px;width:100%;background:#C4663F;color:#FBF6EE;
            border:0;border-radius:10px;padding:7px 0;font-weight:600;
            font-size:12px;cursor:pointer">View profile</button>
        </div>`,
      );
      m.on("popupopen", (e) => {
        const btn = (e.popup.getElement() as HTMLElement | undefined)?.querySelector(
          "button[data-stylist]",
        );
        btn?.addEventListener("click", () => nav(`/stylist/${s.id}`));
      });
    });

    if (me) {
      L.marker([me.lat, me.lng], { icon: meIcon() })
        .addTo(layer)
        .bindPopup("You are here");
      pts.push([me.lat, me.lng]);
    }

    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts).pad(0.2));
    } else if (pts.length === 1) {
      map.setView(pts[0], 14);
    }
  }, [stylists, me, nav]);

  return (
    <div
      ref={elRef}
      style={{ height }}
      className="w-full rounded-3xl overflow-hidden border border-line relative isolate"
    />
  );
}
