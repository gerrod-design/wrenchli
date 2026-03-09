import { useEffect, useRef, useState } from "react";
import { type Shop } from "./ShopCard";
import { MapPin } from "lucide-react";

interface ShopMapProps {
  shops: Shop[];
  center?: { lat: number; lng: number };
  selectedShop?: Shop | null;
  onShopClick?: (shop: Shop) => void;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAfAPh_b-IW0lPTez-stGQlsgMp9u9mpf8";

export default function ShopMap({ shops, center, selectedShop, onShopClick }: ShopMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ((window as any).google?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError("Failed to load Google Maps");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !center) return;

    const google = (window as any).google;
    if (!google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      styles: [
        { featureType: "all", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
        { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
      ],
    });

    shops.forEach((shop) => {
      if (!shop.lat || !shop.lng) return;

      const marker = new google.maps.Marker({
        position: { lat: shop.lat, lng: shop.lng },
        map,
        title: shop.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: shop.id === selectedShop?.id ? "#14b8a6" : "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #0f172a; padding: 8px; max-width: 200px;">
            <h3 style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">${shop.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569;">${shop.address}</p>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
              <span style="color: #f59e0b;">★</span>
              <span>${shop.rating.toFixed(1)}</span>
              <span style="color: #94a3b8;">•</span>
              <span style="color: #475569;">${shop.distance_miles.toFixed(1)} mi</span>
            </div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        onShopClick?.(shop);
      });

      if (shop.id === selectedShop?.id) {
        infoWindow.open(map, marker);
      }
    });
  }, [mapLoaded, shops, center, selectedShop, onShopClick]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg border border-border">
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">Shops are listed below</p>
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
