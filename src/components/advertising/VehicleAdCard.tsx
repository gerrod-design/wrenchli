import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Car, ExternalLink } from "lucide-react";
import type { VehicleListing } from "./types";

const VehicleAdCard = ({
  vehicle,
  onTrack,
}: {
  vehicle: VehicleListing;
  onTrack?: () => void;
}) => {
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200" role="article" aria-label={`Vehicle listing: ${vehicleName}`}>
      <CardContent className="p-4">
        <div className="relative mb-3">
          <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center" aria-hidden="true">
            <Car className="h-12 w-12 text-muted-foreground" />
          </div>
          {vehicle.badge && (
            <Badge className="absolute top-2 left-2 bg-ad-success-icon text-accent-foreground text-xs">{vehicle.badge}</Badge>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">{vehicleName}</h3>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-accent" aria-label={`Price: ${vehicle.price}`}>{vehicle.price}</span>
            <span className="text-muted-foreground" aria-label={`Mileage: ${vehicle.mileage} miles`}>{vehicle.mileage} miles</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {vehicle.dealer} • {vehicle.location}
          </p>
          <div className="flex flex-wrap gap-1 mb-2" role="list" aria-label="Vehicle features">
            {vehicle.features.slice(0, 2).map((f, i) => (
              <Badge key={i} variant="outline" className="text-xs px-1 py-0" role="listitem">
                {f}
              </Badge>
            ))}
          </div>
          <Button size="sm" className="w-full" asChild>
            <a
              href={vehicle.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onTrack}
              aria-label={`View details for ${vehicleName} (opens in new tab)`}
            >
              <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" /> View Details
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleAdCard;
