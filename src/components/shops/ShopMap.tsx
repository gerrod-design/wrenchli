import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Shop } from "./ShopCard";

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
  const onShopClickRef = useRef(onShopClick);
  onShopClickRef.current = onShopClick;

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return;

    const c = center || { lat: 42.3314, lng: -83.0458 };
    const map = L.map(mapRef.current).setView([c.lat, c.lng], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    // Ensure tiles render after layout
    requestAnimationFrame(() => {
      setTimeout(() => map.invalidateSize(), 0);
    });
  }, [center]);

  // Init on mount
  useEffect(() => {
    const timer = setTimeout(initMap, 50);
    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current = null;
      }
    };
  }, [initMap]);

  // Recenter
  useEffect(() => {
    if (!mapInstance.current || !center) return;
    mapInstance.current.setView([center.lat, center.lng], 12);
    mapInstance.current.invalidateSize();
  }, [center]);

  // Markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    shops.forEach((shop) => {
      if (!shop.lat || !shop.lng) return;

      const isSelected = shop.id === selectedShop?.id;
      const color = isSelected ? "#14b8a6" : "#f97316";

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);transform:scale(${isSelected ? 1.3 : 1})"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(markersRef.current!);

      marker.bindPopup(`
        <div style="min-width:180px">
          <h3 style="font-weight:600;margin:0 0 4px;font-size:14px">${shop.name}</h3>
          <p style="margin:0 0 4px;font-size:12px;color:#64748b">${shop.address}</p>
          <div style="display:flex;align-items:center;gap:4px;font-size:12px">
            <span style="color:#f59e0b">★</span>
            <span>${shop.rating.toFixed(1)}</span>
            <span style="color:#94a3b8">•</span>
            <span style="color:#64748b">${shop.distance_miles.toFixed(1)} mi</span>
          </div>
        </div>
      `);

      marker.on("click", () => onShopClickRef.current?.(shop));
      if (isSelected) marker.openPopup();
    });
  }, [shops, selectedShop]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg overflow-hidden border border-border"
      style={{ minHeight: "400px", height: "100%", background: "#e2e8f0" }}
    />
  );
}
