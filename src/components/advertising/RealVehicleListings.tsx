import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  ExternalLink,
  MapPin,
  Fuel,
  Users,
  Award,
  Loader2,
  AlertCircle,
  Star,
  Shield,
  Truck,
} from "lucide-react";
import { trackAdClick } from "@/lib/adClickTracker";
import type { TrackingContext } from "./types";

/* ─── Types ─── */

export interface VehicleSpec {
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyStyle?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  mpgCity?: number;
  mpgHighway?: number;
}

export interface EnhancedVehicleListing {
  id: string;
  vin?: string;
  spec: VehicleSpec;
  price: number;
  mileage: number;
  location: { city: string; state: string; zipCode: string; distance?: number };
  dealer: { name: string; rating?: number; reviewCount?: number; phone?: string; website?: string };
  features: string[];
  images: string[];
  badges: ("certified" | "low-mileage" | "one-owner" | "accident-free" | "warranty")[];
  marketValue?: { kbb?: number; edmunds?: number; nada?: number };
  monthlyPayment?: { amount: number; apr: number; termMonths: number; downPayment: number };
  source: "autotrader" | "cars.com" | "cargurus" | "dealer-direct";
  sourceUrl: string;
  daysOnMarket?: number;
  priceHistory?: Array<{ date: string; price: number }>;
}

interface VehicleSearchParams {
  userZipCode: string;
  maxDistance: number;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  makes?: string[];
  maxMileage?: number;
}

/* ─── Mock data ─── */

const getMockListings = (_params: VehicleSearchParams): Promise<EnhancedVehicleListing[]> =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          {
            id: "mock-1",
            vin: "1HGCM82633A123456",
            spec: { make: "Honda", model: "Accord", year: 2019, trim: "LX", bodyStyle: "Sedan", engine: "1.5L Turbo I4", transmission: "CVT", drivetrain: "FWD", fuelType: "Gasoline", mpgCity: 30, mpgHighway: 38 },
            price: 22995,
            mileage: 45000,
            location: { city: "Detroit", state: "MI", zipCode: "48201", distance: 5.2 },
            dealer: { name: "Metro Honda", rating: 4.2, reviewCount: 847 },
            features: ["Backup Camera", "Bluetooth", "Honda Sensing", "Keyless Entry"],
            images: [],
            badges: ["certified", "one-owner"],
            marketValue: { kbb: 23500, edmunds: 23200 },
            monthlyPayment: { amount: 389, apr: 4.9, termMonths: 60, downPayment: 2000 },
            source: "autotrader",
            sourceUrl: "https://www.autotrader.com/cars-for-sale/certified/honda/accord",
            daysOnMarket: 12,
            priceHistory: [{ date: "2024-01-15", price: 23995 }, { date: "2024-02-01", price: 22995 }],
          },
          {
            id: "mock-2",
            spec: { make: "Toyota", model: "Camry", year: 2020, trim: "LE", bodyStyle: "Sedan", engine: "2.5L I4", transmission: "Automatic", drivetrain: "FWD", fuelType: "Gasoline", mpgCity: 28, mpgHighway: 39 },
            price: 24450,
            mileage: 32000,
            location: { city: "Dearborn", state: "MI", zipCode: "48124", distance: 7.8 },
            dealer: { name: "Toyota of Dearborn", rating: 4.5, reviewCount: 1203 },
            features: ["Apple CarPlay", "Lane Assist", "Auto Emergency Braking"],
            images: [],
            badges: ["low-mileage", "warranty"],
            monthlyPayment: { amount: 425, apr: 3.9, termMonths: 60, downPayment: 2500 },
            source: "cars.com",
            sourceUrl: "https://www.cars.com/vehicledetail/detail/456789",
            daysOnMarket: 8,
          },
          {
            id: "mock-3",
            spec: { make: "Ford", model: "Escape", year: 2018, trim: "SE", bodyStyle: "SUV", engine: "1.5L Turbo I4", transmission: "Automatic", drivetrain: "AWD", fuelType: "Gasoline", mpgCity: 23, mpgHighway: 30 },
            price: 19999,
            mileage: 52000,
            location: { city: "Southfield", state: "MI", zipCode: "48075", distance: 12.3 },
            dealer: { name: "Bill Brown Ford", rating: 3.9, reviewCount: 543 },
            features: ["AWD", "Heated Seats", "Sync 3", "Roof Rails"],
            images: [],
            badges: ["accident-free"],
            monthlyPayment: { amount: 349, apr: 5.9, termMonths: 60, downPayment: 1500 },
            source: "cargurus",
            sourceUrl: "https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action",
            daysOnMarket: 23,
          },
        ]),
      1500,
    ),
  );

/* ─── Relevance scoring ─── */

const relevanceScore = (l: EnhancedVehicleListing): number => {
  let s = 100;
  if (l.location.distance) s -= l.location.distance * 2;
  s += (l.spec.year - (new Date().getFullYear() - 10)) * 3;
  s -= l.mileage / 1000;
  if (l.dealer.rating) s += l.dealer.rating * 5;
  if (l.badges.includes("certified")) s += 10;
  if (l.badges.includes("low-mileage")) s += 8;
  if (l.badges.includes("one-owner")) s += 5;
  if (l.badges.includes("accident-free")) s += 7;
  if (l.daysOnMarket) s -= Math.min(l.daysOnMarket, 30);
  return Math.max(s, 0);
};

/* ─── Badge helpers ─── */

const BADGE_STYLES: Record<string, string> = {
  certified: "bg-ad-vehicle-certified text-ad-vehicle-certified-fg",
  "low-mileage": "bg-ad-vehicle-lowmile text-ad-vehicle-lowmile-fg",
  "one-owner": "bg-ad-vehicle-oneowner text-ad-vehicle-oneowner-fg",
  "accident-free": "bg-ad-vehicle-accfree text-ad-vehicle-accfree-fg",
  warranty: "bg-ad-vehicle-warranty text-ad-vehicle-warranty-fg",
};

const BADGE_ICONS: Record<string, typeof Award> = {
  certified: Award,
  "low-mileage": Car,
  "one-owner": Users,
  "accident-free": Shield,
  warranty: Shield,
};

/* ─── Card ─── */

const EnhancedVehicleCard = ({
  listing,
  onTrack,
}: {
  listing: EnhancedVehicleListing;
  onTrack?: (l: EnhancedVehicleListing) => void;
}) => {
  const title = `${listing.spec.year} ${listing.spec.make} ${listing.spec.model}${listing.spec.trim ? ` ${listing.spec.trim}` : ""}`;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1" role="article" aria-label={`Vehicle listing: ${title}`}>
      <CardContent className="p-0">
        {/* Image / placeholder */}
        <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
            <Car className="h-16 w-16 text-muted-foreground" />
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {listing.badges.slice(0, 2).map((badge) => {
              const Icon = BADGE_ICONS[badge] ?? Award;
              return (
                <Badge key={badge} className={`text-xs px-1.5 py-0.5 ${BADGE_STYLES[badge] ?? ""}`}>
                  <Icon className="h-3 w-3 mr-1" aria-hidden="true" />
                  {badge.replace("-", " ")}
                </Badge>
              );
            })}
          </div>

          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">{listing.source}</Badge>
          </div>

          {listing.daysOnMarket != null && (
            <div className="absolute bottom-2 right-2 bg-foreground/70 text-background text-xs px-2 py-1 rounded">
              {listing.daysOnMarket} days listed
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {listing.mileage.toLocaleString()} miles • {listing.spec.bodyStyle}
            </p>
          </div>

          {/* Price */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xl font-bold text-accent">${listing.price.toLocaleString()}</p>
              {listing.monthlyPayment && (
                <p className="text-sm text-muted-foreground">${listing.monthlyPayment.amount}/mo</p>
              )}
            </div>
            {listing.marketValue?.kbb && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">KBB Value</p>
                <p className="text-sm font-medium">${listing.marketValue.kbb.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {listing.location.city}, {listing.location.state}
              {listing.location.distance != null && ` • ${listing.location.distance.toFixed(1)} mi away`}
            </span>
          </div>

          {/* Features */}
          {listing.features.length > 0 && (
            <div className="flex flex-wrap gap-1" role="list" aria-label="Vehicle features">
              {listing.features.slice(0, 3).map((f, i) => (
                <Badge key={i} variant="outline" className="text-xs px-2 py-0.5" role="listitem">{f}</Badge>
              ))}
              {listing.features.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">+{listing.features.length - 3} more</Badge>
              )}
            </div>
          )}

          {/* MPG */}
          {listing.spec.mpgCity && listing.spec.mpgHighway && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Fuel className="h-4 w-4" />
              <span>{listing.spec.mpgCity}/{listing.spec.mpgHighway} MPG</span>
            </div>
          )}

          {/* Dealer */}
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{listing.dealer.name}</p>
                {listing.dealer.rating != null && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.floor(listing.dealer.rating!) ? "text-ad-star fill-current" : "text-muted-foreground/30"}`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground">({listing.dealer.reviewCount})</span>
                  </div>
                )}
              </div>
              <Button size="sm" asChild>
                <a
                  href={listing.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrack?.(listing)}
                  aria-label={`View details for ${title} (opens in new tab)`}
                >
                  <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" /> View Details
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Section ─── */

export const VehicleListingsSection = ({
  userZipCode,
  repairCost,
  trackCtx,
}: {
  userZipCode: string;
  repairCost: number;
  currentVehicle?: any;
  trackCtx: TrackingContext;
}) => {
  const [listings, setListings] = useState<EnhancedVehicleListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (!userZipCode) return;
    setLoading(true);
    setError(null);
    getMockListings({
      userZipCode,
      maxDistance: 50,
      minYear: 2015,
      maxYear: new Date().getFullYear(),
      maxPrice: repairCost * 8,
      maxMileage: 100000,
      makes: ["Honda", "Toyota", "Ford", "Chevrolet", "Nissan"],
    })
      .then((all) => {
        all.sort((a, b) => relevanceScore(b) - relevanceScore(a));
        setListings(all.slice(0, 6));
        setTotalResults(all.length);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Search failed"))
      .finally(() => setLoading(false));
  }, [userZipCode, repairCost]);

  if (loading) {
    return (
      <section className="bg-gradient-to-r from-ad-success-bg to-ad-success-bg-end rounded-2xl p-6 border border-ad-success-border">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-ad-success-icon mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-ad-success-heading mb-2">Finding Better Options...</h3>
          <p className="text-sm text-ad-success-text">Searching thousands of vehicles in your area</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-gradient-to-r from-ad-success-bg to-ad-success-bg-end rounded-2xl p-6 border border-ad-success-border">
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-ad-success-heading mb-2">Search Unavailable</h3>
          <p className="text-sm text-ad-success-text mb-4">{error}</p>
          <Button size="sm" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </section>
    );
  }

  if (listings.length === 0) return null;

  const avgPayment = Math.round(listings.reduce((s, l) => s + (l.monthlyPayment?.amount || 0), 0) / listings.length);

  return (
    <section aria-labelledby="upgrade-section-heading" className="bg-gradient-to-r from-ad-success-bg to-ad-success-bg-end rounded-2xl p-6 border border-ad-success-border">
      <div className="flex items-center gap-3 mb-4">
        <Car className="h-5 w-5 text-ad-success-icon" aria-hidden="true" />
        <div>
          <h3 id="upgrade-section-heading" className="font-heading text-lg font-bold text-ad-success-heading">Consider Upgrading Instead</h3>
          <p className="text-sm text-ad-success-text">{totalResults} vehicles found within 50 miles • Better long-term value</p>
        </div>
        <Badge className="ml-auto bg-ad-vehicle-live text-ad-vehicle-live-text border-ad-vehicle-live-border">Live Results</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Vehicle upgrade options">
        {listings.slice(0, 3).map((l) => (
          <div key={l.id} role="listitem">
            <EnhancedVehicleCard
              listing={l}
              onTrack={(listing) =>
                trackAdClick({
                  ...trackCtx,
                  click_type: "vehicle",
                  item_title: `${listing.spec.year} ${listing.spec.make} ${listing.spec.model}`,
                  item_price: `$${listing.price.toLocaleString()}`,
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-ad-success-border flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ad-success-text">
          Avg monthly payment: ${avgPayment}/mo vs. ${repairCost.toLocaleString()} repair cost
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-ad-success-border text-ad-success-text hover:bg-ad-success-bg" asChild>
            <a
              href="https://www.kbb.com/whats-my-car-worth/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAdClick({ ...trackCtx, click_type: "trade_value" })}
              aria-label="Check your vehicle trade-in value on Kelley Blue Book (opens in new tab)"
            >
              <Truck className="h-3 w-3 mr-1" aria-hidden="true" /> Check Trade Value
            </a>
          </Button>
          <Button size="sm" asChild>
            <a
              href={`https://www.autotrader.com/cars-for-sale/all-cars/${userZipCode}?searchRadius=50`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAdClick({ ...trackCtx, click_type: "vehicle_view_all" })}
            >
              View All {totalResults} Results
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VehicleListingsSection;
