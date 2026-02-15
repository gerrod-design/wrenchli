import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star, ShoppingCart, ExternalLink, Wrench, Car, Package,
  TrendingUp, Shield, Truck, Clock, DollarSign,
} from "lucide-react";

interface AdProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviewCount: number;
  brand: string;
  affiliate_link: string;
  badge?: string;
  prime?: boolean;
}

interface VehicleAd {
  id: string;
  year: number;
  make: string;
  model: string;
  price: string;
  mileage: string;
  location: string;
  dealer: string;
  features: string[];
  badge?: string;
  link: string;
}

interface ServiceAd {
  id: string;
  company: string;
  service: string;
  description: string;
  price: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  cta: string;
  link: string;
}

const generateDIYProducts = (_diagnosis: string, vehicleInfo: any): AdProduct[] => [
  {
    id: "brake-pads-1",
    title: "Bosch Blue Disc Brake Pad Set",
    description: `Premium ceramic brake pads for ${vehicleInfo?.year || "2015"}-2020 ${vehicleInfo?.make || "Ford"} ${vehicleInfo?.model || "F-150"}`,
    price: "$67.99",
    originalPrice: "$89.99",
    rating: 4.6,
    reviewCount: 2847,
    brand: "Bosch",
    affiliate_link: "#",
    badge: "Best Seller",
    prime: true,
  },
  {
    id: "brake-tool-1",
    title: "OEMTOOLS Brake Caliper Tool Set",
    description: "13-piece disc brake pad and caliper service tool kit",
    price: "$34.95",
    rating: 4.4,
    reviewCount: 1923,
    brand: "OEMTOOLS",
    affiliate_link: "#",
    prime: true,
  },
  {
    id: "brake-fluid-1",
    title: "Valvoline MaxLife DOT 3 Brake Fluid",
    description: "32 oz bottle, prevents corrosion and extends brake system life",
    price: "$12.99",
    rating: 4.8,
    reviewCount: 5643,
    brand: "Valvoline",
    affiliate_link: "#",
    badge: "Amazon Choice",
    prime: true,
  },
];

const generateVehicleAds = (_currentVehicle: any, _repairCost: number): VehicleAd[] => [
  {
    id: "vehicle-1",
    year: 2019,
    make: "Honda",
    model: "Accord",
    price: "$22,995",
    mileage: "45,000",
    location: "Detroit, MI",
    dealer: "Metro Honda",
    features: ["Backup Camera", "Bluetooth", "Honda Sensing"],
    badge: "Certified Pre-Owned",
    link: "#",
  },
  {
    id: "vehicle-2",
    year: 2020,
    make: "Toyota",
    model: "Camry",
    price: "$24,450",
    mileage: "32,000",
    location: "Dearborn, MI",
    dealer: "Toyota of Dearborn",
    features: ["Apple CarPlay", "Lane Assist", "Automatic Transmission"],
    badge: "Low Mileage",
    link: "#",
  },
  {
    id: "vehicle-3",
    year: 2018,
    make: "Ford",
    model: "Escape",
    price: "$19,999",
    mileage: "52,000",
    location: "Southfield, MI",
    dealer: "Bill Brown Ford",
    features: ["AWD", "Heated Seats", "Sync 3"],
    link: "#",
  },
];

const generateServiceAds = (): ServiceAd[] => [
  {
    id: "insurance-1",
    company: "Progressive",
    service: "Auto Insurance",
    description: "Save up to $620/year with personalized rates",
    price: "Get Quote",
    rating: 4.2,
    reviewCount: 12847,
    badge: "Local Agent",
    cta: "Get Free Quote",
    link: "#",
  },
  {
    id: "warranty-1",
    company: "CarShield",
    service: "Extended Warranty",
    description: "Protect against expensive repairs with comprehensive coverage",
    price: "From $99/mo",
    rating: 4.1,
    reviewCount: 8934,
    badge: "Most Popular",
    cta: "Get Coverage",
    link: "#",
  },
  {
    id: "financing-1",
    company: "Capital One Auto",
    service: "Auto Refinancing",
    description: "Lower your monthly payment with auto loan refinancing",
    price: "Rates from 3.99%",
    rating: 4.5,
    reviewCount: 15632,
    cta: "Check Rates",
    link: "#",
  },
];

/* ── Sub-components ── */

const DIYProductCard = ({ product, size = "normal" }: { product: AdProduct; size?: "normal" | "compact" }) => (
  <Card className={`hover:shadow-md transition-shadow duration-200 ${size === "compact" ? "p-3" : "p-4"}`}>
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
          <Button size="sm" className="w-full text-xs">
            <ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const VehicleAdCard = ({ vehicle }: { vehicle: VehicleAd }) => (
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
        <Button size="sm" className="w-full">
          <ExternalLink className="h-3 w-3 mr-1" /> View Details
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ServiceAdCard = ({ service, layout = "vertical" }: { service: ServiceAd; layout?: "vertical" | "horizontal" }) => {
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
                <Button size="sm" variant="outline" className="text-xs">{service.cta}</Button>
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
          <Button size="sm" className="w-full text-xs mt-2">{service.cta}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ── Section wrappers ── */

const DIYProductSection = ({ diagnosis, vehicleInfo }: { diagnosis: string; vehicleInfo: any }) => {
  const products = generateDIYProducts(diagnosis, vehicleInfo);
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
        {products.map((p) => <DIYProductCard key={p.id} product={p} size="compact" />)}
      </div>
      <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-blue-700"><Clock className="h-4 w-4 text-blue-600" />2-3 hour job</span>
          <span className="flex items-center gap-1 text-green-700"><DollarSign className="h-4 w-4 text-green-600" />Total parts: ~$115</span>
        </div>
        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
          <ExternalLink className="h-3 w-3 mr-1" /> View Tutorial
        </Button>
      </div>
    </div>
  );
};

const VehicleReplacementSection = ({ currentVehicle, repairCost }: { currentVehicle: any; repairCost: number }) => {
  const vehicles = generateVehicleAds(currentVehicle, repairCost);
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
        {vehicles.map((v) => <VehicleAdCard key={v.id} vehicle={v} />)}
      </div>
      <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
        <p className="text-sm text-green-700">Monthly payments starting around $280-350 vs. ${repairCost.toLocaleString()} repair cost</p>
        <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
          <Truck className="h-3 w-3 mr-1" /> Check Trade Value
        </Button>
      </div>
    </div>
  );
};

const ServiceAdSection = ({ layout = "horizontal" }: { layout?: "horizontal" | "grid" }) => {
  const services = generateServiceAds();
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

/* ── Main component ── */

const ContextualAdvertising = ({
  diagnosis,
  vehicleInfo,
  repairCost,
  repairRecommendation,
  placement = "full",
}: {
  diagnosis: string;
  vehicleInfo: any;
  repairCost: number;
  repairRecommendation: "repair" | "replace" | "consider_both";
  placement?: "full" | "sidebar" | "footer";
}) => {
  if (placement === "sidebar") {
    return (
      <div className="space-y-4">
        <ServiceAdSection layout="horizontal" />
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Featured Product</span>
          </div>
          <DIYProductCard product={generateDIYProducts(diagnosis, vehicleInfo)[0]} size="compact" />
        </div>
      </div>
    );
  }

  if (placement === "footer") {
    return (
      <div className="bg-muted/30 rounded-2xl p-6 border border-border">
        <h3 className="font-heading text-lg font-bold mb-4">
          More Options For Your {vehicleInfo?.year} {vehicleInfo?.make} {vehicleInfo?.model}
        </h3>
        <ServiceAdSection layout="grid" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {repairCost < 2000 && (
        <DIYProductSection diagnosis={diagnosis} vehicleInfo={vehicleInfo} />
      )}
      {(repairRecommendation === "replace" || repairRecommendation === "consider_both") && (
        <VehicleReplacementSection currentVehicle={vehicleInfo} repairCost={repairCost} />
      )}
      <ServiceAdSection layout="grid" />
    </div>
  );
};

export default ContextualAdvertising;
