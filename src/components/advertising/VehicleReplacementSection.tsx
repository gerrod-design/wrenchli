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
    <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
      <p className="text-sm text-green-700">
        Monthly payments starting around $280-350 vs. ${repairCost.toLocaleString()} repair cost
      </p>
      <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100" asChild>
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
