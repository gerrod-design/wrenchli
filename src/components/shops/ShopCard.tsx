import { MapPin, Phone, Star, Clock, Shield, Building2, Heart, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  is_dealer?: boolean;
  dealer_brands?: string[];
  is_partnered?: boolean;
  pilot_status?: "new_partner" | "pilot_partner" | null;
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
  const [interestLogged, setInterestLogged] = useState(false);
  const [loggingInterest, setLoggingInterest] = useState(false);

  const handleCall = () => {
    window.location.href = `tel:${shop.phone}`;
  };

  const isDealer = shop.is_dealer === true;
  const isPartnered = shop.is_partnered !== false; // default true for backward compat

  const handleInterestClick = async () => {
    setLoggingInterest(true);
    try {
      // Extract zip from address
      const zipMatch = shop.address.match(/\b(\d{5})\b/);
      const zip = zipMatch ? zipMatch[1] : null;

      const { error } = await supabase.from("shop_interest_events").insert({
        shop_id: shop.id,
        shop_name: shop.name,
        shop_address: shop.address,
        shop_type: isDealer ? "dealer" : "independent",
        zip_code: zip,
        source: "find_shops",
      });

      if (error) throw error;
      setInterestLogged(true);
      toast.success(`We're bringing ${shop.name} onto Wrenchli — we'll notify you when they're ready!`);
    } catch (e) {
      console.error("Failed to log interest:", e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoggingInterest(false);
    }
  };

  return (
    <div className={`group rounded-lg border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
      !isPartnered
        ? "border-muted-foreground/20 hover:border-muted-foreground/40"
        : isDealer
          ? "border-primary/30 hover:border-primary/50"
          : "border-border hover:border-accent/50"
    }`}>
      {/* Dealer Badge */}
      {isDealer && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/15">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Franchised Dealer
          </span>
          {shop.dealer_brands && shop.dealer_brands.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              {shop.dealer_brands.map((brand) => (
                <span
                  key={brand}
                  className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-primary/10 text-primary border border-primary/20"
                >
                  {brand}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Not yet partnered badge */}
      {!isPartnered && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-muted-foreground/15">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Coming Soon to Wrenchli
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-heading text-lg font-semibold text-card-foreground group-hover:text-accent transition-colors">
              {shop.name}
            </h3>
            {shop.wrenchli_verified && isPartnered && !isDealer && (
              <span title="Wrenchli Verified">
                <Shield className="h-4 w-4 text-wrenchli-teal flex-shrink-0" />
              </span>
            )}
            {shop.pilot_status === "pilot_partner" && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#E07B3920", color: "#E07B39", border: "1px solid #E07B3940" }}
              >
                Pilot Partner
              </span>
            )}
            {shop.pilot_status === "new_partner" && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#E07B3910", color: "#E07B39", border: "1px solid #E07B3930" }}
              >
                New Partner
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{shop.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({shop.review_count.toLocaleString()})</span>
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
          {shop.specialties
            .filter((s) => !["dealer", "new_vehicles", "used_vehicles"].includes(s))
            .slice(0, 3)
            .map((specialty) => (
              <span
                key={specialty}
                className="inline-block px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent border border-accent/20"
              >
                {specialty.replace(/_/g, " ")}
              </span>
            ))}
          {shop.specialties.filter((s) => !["dealer", "new_vehicles", "used_vehicles"].includes(s)).length > 3 && (
            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              +{shop.specialties.filter((s) => !["dealer", "new_vehicles", "used_vehicles"].includes(s)).length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Response Time */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Typical response: {shop.response_time}</span>
      </div>

      {/* Actions — Two-tier system */}
      <div className="flex gap-2">
        {isPartnered ? (
          <>
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
              <Link to={isDealer ? "/get-quote" : `/get-quote?shop=${shop.id}`}>
                {isDealer ? "Get Trade-In Value" : "Get Quote"}
              </Link>
            </Button>
          </>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleInterestClick}
            disabled={interestLogged || loggingInterest}
          >
            <Heart className={`h-4 w-4 ${interestLogged ? "fill-current" : ""}`} />
            {interestLogged
              ? "Interest Logged — We'll Notify You"
              : loggingInterest
                ? "Logging..."
                : "I'm Interested"}
          </Button>
        )}
      </div>
    </div>
  );
}
