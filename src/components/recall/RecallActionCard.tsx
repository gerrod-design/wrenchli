import { ExternalLink, MapPin, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface RecallActionCardProps {
  vin: string;
  make: string;
  campaignNumber: string;
  component: string;
}

/** Components that are almost always dealer-only (safety-critical / federal mandate) */
const DEALER_ONLY_KEYWORDS = [
  "air bag", "airbag", "seat belt", "seatbelt",
  "fuel", "brake", "steering", "powertrain",
  "engine", "transmission", "electrical", "wiring",
  "child seat", "car seat", "restraint",
  "tire", "wheel", "axle", "suspension",
  "emission", "exhaust", "ignition",
];

function isDealerOnly(component: string): boolean {
  const lower = component.toLowerCase();
  return DEALER_ONLY_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function RecallActionCard({
  vin,
  make,
  campaignNumber,
  component,
}: RecallActionCardProps) {
  const dealerOnly = isDealerOnly(component);
  const nhtsaUrl = `https://www.nhtsa.gov/vehicle/${encodeURIComponent(vin)}`;
  const dealerSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(make + " dealer near me")}`;

  return (
    <div
      className="rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-3"
      style={{ borderLeft: "4px solid #E07B39" }}
    >
      {/* Dealer path — always shown */}
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-white">
          This recall is free to fix
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          Take your vehicle to any authorized {make} dealer. Show them your VIN
          and NHTSA campaign number{" "}
          <span className="font-mono text-white/90">{campaignNumber}</span>. The
          repair is covered at no cost to you.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          size="sm"
          className="h-9 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-xs"
        >
          <a href={dealerSearchUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="mr-1.5 h-3.5 w-3.5" />
            Find an Authorized Dealer
            <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
          </a>
        </Button>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-9 border-white/10 text-white hover:bg-white/5 text-xs"
        >
          <a href={nhtsaUrl} target="_blank" rel="noopener noreferrer">
            View on NHTSA.gov
            <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
          </a>
        </Button>
      </div>

      {/* Partner shop path — only for non-dealer-only recalls */}
      {!dealerOnly && (
        <div className="border-t border-white/10 pt-3 mt-1 space-y-1.5">
          <p className="text-xs text-white/50">
            This recall may also be serviceable at a qualified independent shop.
          </p>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-8 text-accent hover:text-accent hover:bg-accent/10 text-xs px-2"
          >
            <Link
              to={`/find-shops?recall=${encodeURIComponent(campaignNumber)}&component=${encodeURIComponent(component)}`}
            >
              <Wrench className="mr-1.5 h-3.5 w-3.5" />
              Ask a partner shop about this recall
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
