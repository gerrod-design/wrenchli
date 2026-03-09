import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Shop } from "./ShopCard";
import { MapPin } from "lucide-react";

interface ShopMapProps {
  shops: Shop[];
  center?: { lat: number; lng: number };
  selectedShop?: Shop | null;
  onShopClick?: (shop: Shop) => void;
}

export default function ShopMap({ shops, center, selectedShop, onShopClick }: ShopMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: center ? [center.lat, center.lng] : [42.3314, -83.0458],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markersRef.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    if (!mapInstance.current || !center) return;
    mapInstance.current.setView([center.lat, center.lng], 12);
  }, [center]);

  // Update markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    shops.forEach((shop) => {
      if (!shop.lat || !shop.lng) return;

      const isSelected = shop.id === selectedShop?.id;
      const color = isSelected ? "#14b8a6" : "#f97316";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s;
          transform: scale(${isSelected ? 1.3 : 1});
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(markersRef.current!);

      marker.bindPopup(`
        <div style="min-width: 180px;">
          <h3 style="font-weight: 600; margin: 0 0 4px; font-size: 14px;">${shop.name}</h3>
          <p style="margin: 0 0 4px; font-size: 12px; color: #64748b;">${shop.address}</p>
          <div style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
            <span style="color: #f59e0b;">★</span>
            <span>${shop.rating.toFixed(1)}</span>
            <span style="color: #94a3b8;">•</span>
            <span style="color: #64748b;">${shop.distance_miles.toFixed(1)} mi</span>
          </div>
        </div>
      `);

      marker.on("click", () => onShopClick?.(shop));

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [shops, selectedShop, onShopClick]);

  if (!center && shops.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg border border-border">
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Search to see shops on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg overflow-hidden border border-border"
      style={{ minHeight: "400px" }}
    />
  );
}
