import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Truck } from "lucide-react";
import { trackAdClick } from "@/lib/adClickTracker";
import VehicleAdCard from "./VehicleAdCard";
import type { TrackingContext, VehicleListing } from "./types";

const VEHICLES: VehicleListing[] = [
  {
    year: 2019,
    make: "Honda",
    model: "Accord",
    price: "$22,995",
    mileage: "45,000",
    location: "Detroit, MI",
    dealer: "Metro Honda",
    features: ["Backup Camera", "Bluetooth", "Honda Sensing"],
    badge: "Certified Pre-Owned",
    link: "https://www.autotrader.com/cars-for-sale/certified/honda/accord",
  },
  {
    year: 2020,
    make: "Toyota",
    model: "Camry",
    price: "$24,450",
    mileage: "32,000",
    location: "Dearborn, MI",
    dealer: "Toyota of Dearborn",
    features: ["Apple CarPlay", "Lane Assist", "Automatic"],
    badge: "Low Mileage",
    link: "https://www.autotrader.com/cars-for-sale/certified/toyota/camry",
  },
  {
    year: 2018,
    make: "Ford",
    model: "Escape",
    price: "$19,999",
    mileage: "52,000",
    location: "Southfield, MI",
    dealer: "Bill Brown Ford",
    features: ["AWD", "Heated Seats", "Sync 3"],
    link: "https://www.autotrader.com/cars-for-sale/ford/escape",
  },
];

const VehicleReplacementSection = ({
  currentVehicle,
  repairCost,
  trackCtx,
}: {
  currentVehicle: any;
  repairCost: number;
  trackCtx: TrackingContext;
}) => (
  <div className="bg-gradient-to-r from-ad-success-bg to-ad-success-bg-end rounded-2xl p-6 border border-ad-success-border">
    <div className="flex items-center gap-3 mb-4">
      <Car className="h-5 w-5 text-ad-success-icon" />
      <div>
        <h3 className="font-heading text-lg font-bold text-ad-success-heading">Consider Upgrading Instead</h3>
        <p className="text-sm text-ad-success-text">These vehicles might be a better long-term investment</p>
      </div>
      <Badge className="ml-auto bg-ad-badge-value text-ad-badge-value-text border-ad-badge-value-border">Better Value</Badge>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {VEHICLES.map((v, i) => (
        <VehicleAdCard
          key={i}
          vehicle={v}
          onTrack={() =>
            trackAdClick({
              ...trackCtx,
              click_type: "vehicle",
              item_title: `${v.year} ${v.make} ${v.model}`,
              item_price: v.price,
            })
          }
        />
      ))}
    </div>
    <div className="mt-4 pt-4 border-t border-ad-success-border flex items-center justify-between">
      <p className="text-sm text-ad-success-text">
        Monthly payments starting around $280-350 vs. ${repairCost.toLocaleString()} repair cost
      </p>
      <Button variant="outline" size="sm" className="border-ad-success-border text-ad-success-text hover:bg-ad-success-bg" asChild>
        <a
          href="https://www.kbb.com/whats-my-car-worth/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAdClick({ ...trackCtx, click_type: "trade_value" })}
        >
          <Truck className="h-3 w-3 mr-1" /> Check Trade Value
        </a>
      </Button>
    </div>
  </div>
);

export default VehicleReplacementSection;
