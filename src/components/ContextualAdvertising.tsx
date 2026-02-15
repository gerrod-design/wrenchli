import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star, ShoppingCart, ExternalLink, Wrench, Car, Package,
  TrendingUp, Shield, Truck, Clock, DollarSign, Loader2,
} from "lucide-react";
import {
  getLocalRecommendations,
  getServiceRecommendations,
  buildAmazonSearchLink,
  type ProductRecommendation,
  type ServiceRecommendation,
  type RecommendationSet,
} from "@/data/adRecommendations";

const RECOMMEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-products`;

/* ── Hooks ── */

function useProductRecommendations(
  diagnosis: string,
  code: string | undefined,
  vehicleInfo: any
): { data: RecommendationSet | null; loading: boolean } {
  const [data, setData] = useState<RecommendationSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // 1) Try local mapping first
    const local = getLocalRecommendations(diagnosis, code);
    if (local) {
      setData(local);
      setLoading(false);
      return;
    }

    // 2) AI fallback
    (async () => {
      try {
        const resp = await fetch(RECOMMEND_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            diagnosis_title: diagnosis,
            diagnosis_code: code,
            vehicle_year: vehicleInfo?.year,
            vehicle_make: vehicleInfo?.make,
            vehicle_model: vehicleInfo?.model,
            vehicle_trim: vehicleInfo?.trim,
          }),
        });

        if (!resp.ok) throw new Error("AI recommendation failed");

        const ai = await resp.json();
        if (!cancelled) {
          const vehicleStr = [vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model]
            .filter(Boolean)
            .join(" ");

          const products: ProductRecommendation[] = (ai.products || []).map(
            (p: any, i: number) => ({
              id: `ai-${i}`,
              title: p.title,
              description: p.description,
              price: p.price,
              rating: p.rating || 4.4,
              reviewCount: p.review_count || 1000,
              brand: p.brand,
              asin: "",
              link: buildAmazonSearchLink(p.search_query, vehicleStr),
              category: p.category || "part",
              prime: true,
            })
          );

          setData({
            products,
            services: getServiceRecommendations(),
            diyEstimate: ai.diy_time_range
              ? { timeRange: ai.diy_time_range, totalPartsRange: ai.total_parts_range }
              : undefined,
            source: "ai",
          });
        }
      } catch (e) {
        console.error("AI product recommendation error:", e);
        // Fallback to general local products
        if (!cancelled) {
          setData({
            products: getLocalRecommendations("general")?.products || [],
            services: getServiceRecommendations(),
            source: "local",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [diagnosis, code, vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model]);

  return { data, loading };
}

/* ── Sub-components ── */

const DIYProductCard = ({ product }: { product: ProductRecommendation }) => (
  <Card className="hover:shadow-md transition-shadow duration-200 p-3">
    <CardContent className="p-0">
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          {product.badge && (
            <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0.5 bg-orange-500 text-white">
              {product.badge}
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{product.title}</h4>
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-sm">{product.price}</span>
            {product.originalPrice && <span className="text-xs text-muted-foreground line-through">{product.originalPrice}</span>}
            {product.prime && <Badge className="text-xs bg-blue-600 text-white px-1 py-0">Prime</Badge>}
          </div>
          <Button size="sm" className="w-full text-xs" asChild>
            <a href={product.link} target="_blank" rel="noopener noreferrer">
              <ShoppingCart className="h-3 w-3 mr-1" /> View on Amazon
            </a>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const VehicleAdCard = ({ vehicle }: { vehicle: { year: number; make: string; model: string; price: string; mileage: string; location: string; dealer: string; features: string[]; badge?: string; link: string } }) => (
  <Card className="hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-4">
      <div className="relative mb-3">
        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
          <Car className="h-12 w-12 text-muted-foreground" />
        </div>
        {vehicle.badge && (
          <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">{vehicle.badge}</Badge>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
        <div className="flex justify-between text-sm">
          <span className="font-bold text-accent">{vehicle.price}</span>
          <span className="text-muted-foreground">{vehicle.mileage} miles</span>
        </div>
        <p className="text-xs text-muted-foreground">{vehicle.dealer} • {vehicle.location}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {vehicle.features.slice(0, 2).map((f, i) => (
            <Badge key={i} variant="outline" className="text-xs px-1 py-0">{f}</Badge>
          ))}
        </div>
        <Button size="sm" className="w-full" asChild>
          <a href={vehicle.link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 mr-1" /> View Details
          </a>
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ServiceAdCard = ({ service, layout = "vertical" }: { service: ServiceRecommendation; layout?: "vertical" | "horizontal" }) => {
  if (layout === "horizontal") {
    return (
      <Card className="hover:shadow-sm transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-muted rounded flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{service.company}</h4>
                {service.badge && <Badge className="text-xs bg-blue-600 text-white px-1 py-0">{service.badge}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mb-1">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-accent">{service.price}</span>
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <a href={service.link} target="_blank" rel="noopener noreferrer">{service.cta}</a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 text-center space-y-3">
        <div className="w-16 h-10 bg-muted rounded mx-auto flex items-center justify-center">
          <Shield className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <h4 className="font-semibold text-sm">{service.company}</h4>
            {service.badge && <Badge className="text-xs bg-blue-600 text-white px-1 py-0">{service.badge}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.floor(service.rating) ? "text-yellow-400 fill-current" : "text-muted-foreground/30"}`} />
            ))}
            <span className="text-xs text-muted-foreground">({service.reviewCount.toLocaleString()})</span>
          </div>
          <span className="text-sm font-bold text-accent block">{service.price}</span>
          <Button size="sm" className="w-full text-xs mt-2" asChild>
            <a href={service.link} target="_blank" rel="noopener noreferrer">{service.cta}</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ── Section wrappers ── */

const DIYProductSection = ({
  products,
  diyEstimate,
  source,
  vehicleInfo,
}: {
  products: ProductRecommendation[];
  diyEstimate?: { timeRange: string; totalPartsRange: string };
  source: "local" | "ai";
  vehicleInfo: any;
}) => {
  const vehicleStr = [vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model].filter(Boolean).join(" ");

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <Wrench className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="font-heading text-lg font-bold text-blue-900">DIY Repair Option</h3>
          <p className="text-sm text-blue-700">Save money by fixing it yourself with these parts</p>
        </div>
        <Badge className="ml-auto bg-green-100 text-green-800 border-green-300">Save 60-70%</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {products.map((p) => <DIYProductCard key={p.id} product={p} />)}
      </div>
      {diyEstimate && (
        <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-blue-700">
              <Clock className="h-4 w-4 text-blue-600" />{diyEstimate.timeRange}
            </span>
            <span className="flex items-center gap-1 text-green-700">
              <DollarSign className="h-4 w-4 text-green-600" />Total parts: {diyEstimate.totalPartsRange}
            </span>
          </div>
          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100" asChild>
            <a
              href={buildAmazonSearchLink("auto repair parts", vehicleStr)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3 mr-1" /> Browse All Parts
            </a>
          </Button>
        </div>
      )}
      {source === "ai" && (
        <p className="mt-2 text-xs text-blue-600/60 text-center">
          Recommendations powered by AI — verify fitment for your specific vehicle
        </p>
      )}
    </div>
  );
};

const VehicleReplacementSection = ({ currentVehicle, repairCost }: { currentVehicle: any; repairCost: number }) => {
  // Static vehicle ads — will be replaced with real inventory API later
  const vehicles = [
    {
      year: 2019, make: "Honda", model: "Accord", price: "$22,995", mileage: "45,000",
      location: "Detroit, MI", dealer: "Metro Honda",
      features: ["Backup Camera", "Bluetooth", "Honda Sensing"],
      badge: "Certified Pre-Owned", link: "https://www.autotrader.com/cars-for-sale/certified/honda/accord",
    },
    {
      year: 2020, make: "Toyota", model: "Camry", price: "$24,450", mileage: "32,000",
      location: "Dearborn, MI", dealer: "Toyota of Dearborn",
      features: ["Apple CarPlay", "Lane Assist", "Automatic"],
      badge: "Low Mileage", link: "https://www.autotrader.com/cars-for-sale/certified/toyota/camry",
    },
    {
      year: 2018, make: "Ford", model: "Escape", price: "$19,999", mileage: "52,000",
      location: "Southfield, MI", dealer: "Bill Brown Ford",
      features: ["AWD", "Heated Seats", "Sync 3"],
      link: "https://www.autotrader.com/cars-for-sale/ford/escape",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
      <div className="flex items-center gap-3 mb-4">
        <Car className="h-5 w-5 text-green-600" />
        <div>
          <h3 className="font-heading text-lg font-bold text-green-900">Consider Upgrading Instead</h3>
          <p className="text-sm text-green-700">These vehicles might be a better long-term investment</p>
        </div>
        <Badge className="ml-auto bg-blue-100 text-blue-800 border-blue-300">Better Value</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {vehicles.map((v, i) => <VehicleAdCard key={i} vehicle={v} />)}
      </div>
      <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
        <p className="text-sm text-green-700">Monthly payments starting around $280-350 vs. ${repairCost.toLocaleString()} repair cost</p>
        <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100" asChild>
          <a href="https://www.kbb.com/whats-my-car-worth/" target="_blank" rel="noopener noreferrer">
            <Truck className="h-3 w-3 mr-1" /> Check Trade Value
          </a>
        </Button>
      </div>
    </div>
  );
};

const ServiceAdSection = ({ services, layout = "horizontal" }: { services: ServiceRecommendation[]; layout?: "horizontal" | "grid" }) => {
  if (layout === "horizontal") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Recommended Services</span>
        </div>
        {services.map((s) => <ServiceAdCard key={s.id} service={s} layout="horizontal" />)}
      </div>
    );
  }
  return (
    <div className="bg-muted/30 rounded-2xl p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="font-heading text-lg font-bold">Protect Your Investment</h3>
          <p className="text-sm text-muted-foreground">Services to keep your vehicle running smoothly</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {services.map((s) => <ServiceAdCard key={s.id} service={s} />)}
      </div>
    </div>
  );
};

/* ── DIY visibility logic ── */

/**
 * Determines whether to show the DIY section based on repair cost and difficulty.
 * - easy: always show (up to $5,000)
 * - moderate: show up to $3,000
 * - advanced: show up to $1,500
 * - unknown: show up to $2,000 (original default)
 */
function showDIY(repairCost: number, diyFeasibility?: string): boolean {
  const thresholds: Record<string, number> = {
    easy: 5000,
    moderate: 3000,
    advanced: 1500,
  };
  const maxCost = thresholds[diyFeasibility || ""] ?? 2000;
  return repairCost < maxCost;
}

/* ── Main component ── */

const ContextualAdvertising = ({
  diagnosis,
  diagnosisCode,
  vehicleInfo,
  repairCost,
  repairRecommendation,
  diyFeasibility,
  placement = "full",
}: {
  diagnosis: string;
  diagnosisCode?: string;
  vehicleInfo: any;
  repairCost: number;
  repairRecommendation: "repair" | "replace" | "consider_both";
  diyFeasibility?: "easy" | "moderate" | "advanced" | string;
  placement?: "full" | "sidebar" | "footer";
}) => {
  const { data, loading } = useProductRecommendations(diagnosis, diagnosisCode, vehicleInfo);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Finding the best products for your repair...</p>
      </div>
    );
  }

  if (!data) return null;

  const { products, services, diyEstimate, source } = data;

  if (placement === "sidebar") {
    return (
      <div className="space-y-4">
        <ServiceAdSection services={services} layout="horizontal" />
        {products.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Featured Product</span>
            </div>
            <DIYProductCard product={products[0]} />
          </div>
        )}
      </div>
    );
  }

  if (placement === "footer") {
    return (
      <div className="bg-muted/30 rounded-2xl p-6 border border-border">
        <h3 className="font-heading text-lg font-bold mb-4">
          More Options For Your {vehicleInfo?.year} {vehicleInfo?.make} {vehicleInfo?.model}
        </h3>
        <ServiceAdSection services={services} layout="grid" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showDIY(repairCost, diyFeasibility) && products.length > 0 && (
        <DIYProductSection
          products={products}
          diyEstimate={diyEstimate}
          source={source}
          vehicleInfo={vehicleInfo}
        />
      )}
      {(repairRecommendation === "replace" || repairRecommendation === "consider_both") && (
        <VehicleReplacementSection currentVehicle={vehicleInfo} repairCost={repairCost} />
      )}
      <ServiceAdSection services={services} layout="grid" />
    </div>
  );
};

export default ContextualAdvertising;
