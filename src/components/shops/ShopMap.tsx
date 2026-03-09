import { useEffect, useRef, useState } from "react";
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
  const [ready, setReady] = useState(false);

  // Initialize map once container is visible
  useEffect(() => {
    if (!mapRef.current) return;

    // Wait a tick for the container to have dimensions
    const timer = setTimeout(() => {
      if (mapInstance.current || !mapRef.current) return;

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

      // Force a resize after mount to fix tile rendering
      setTimeout(() => map.invalidateSize(), 200);

      setReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center
  useEffect(() => {
    if (!mapInstance.current || !center) return;
    mapInstance.current.setView([center.lat, center.lng], 12);
    setTimeout(() => mapInstance.current?.invalidateSize(), 100);
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
        className: "",
        html: `<div style="
          width: 24px; height: 24px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: scale(${isSelected ? 1.3 : 1});
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
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

      if (isSelected) marker.openPopup();
    });
  }, [shops, selectedShop, onShopClick, ready]);

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
      style={{ minHeight: "400px", height: "100%" }}
    />
  );
}
