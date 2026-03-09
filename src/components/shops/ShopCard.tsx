import { MapPin, Phone, Star, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface Shop {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  address: string;
  phone: string;
  distance_miles: number;
  specialties: string[];
  price_tier: "budget" | "mid" | "premium";
  response_time: string;
  availability: "same_day" | "next_day" | "within_week";
  wrenchli_verified: boolean;
  quote_url: string;
  booking_url?: string;
  lat?: number;
  lng?: number;
}

interface ShopCardProps {
  shop: Shop;
  onSchedule?: (shop: Shop) => void;
}

const priceTierLabels = {
  budget: "$",
  mid: "$$",
  premium: "$$$",
};

const availabilityLabels = {
  same_day: "Same Day",
  next_day: "Next Day",
  within_week: "This Week",
};

export default function ShopCard({ shop, onSchedule }: ShopCardProps) {
  const handleCall = () => {
    window.location.href = `tel:${shop.phone}`;
  };

  return (
    <div className="group rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-accent/50">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading text-lg font-semibold text-card-foreground group-hover:text-accent transition-colors">
              {shop.name}
            </h3>
            {shop.wrenchli_verified && (
              <Shield className="h-4 w-4 text-wrenchli-teal flex-shrink-0" title="Wrenchli Verified" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{shop.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({shop.review_count})</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-accent font-medium">{priceTierLabels[shop.price_tier]}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium text-card-foreground">{shop.distance_miles.toFixed(1)} mi</div>
          <div className="text-xs text-muted-foreground">{availabilityLabels[shop.availability]}</div>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{shop.address}</span>
      </div>

      {/* Specialties */}
      {shop.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {shop.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="inline-block px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent border border-accent/20"
            >
              {specialty}
            </span>
          ))}
          {shop.specialties.length > 3 && (
            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              +{shop.specialties.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Response Time */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Typical response: {shop.response_time}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleCall}>
          <Phone className="h-4 w-4" />
          Call
        </Button>
        <Button
          asChild
          variant="default"
          size="sm"
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Link to={`/get-quote?shop=${shop.id}`}>Get Quote</Link>
        </Button>
      </div>
    </div>
  );
}
