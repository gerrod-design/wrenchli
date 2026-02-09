import { CheckCircle } from "lucide-react";
import type { DecodedVehicle } from "@/lib/vinDecoder";
import { vehicleDisplayName, vehicleDetailsLine } from "@/lib/vinDecoder";
import { useGarage } from "@/hooks/useGarage";
import GarageSavePrompt from "./GarageSavePrompt";
import VehicleSilhouette, { mapBodyClass, DEFAULT_COLOR } from "./VehicleSilhouette";

interface Props {
  vehicle: DecodedVehicle;
  onClear: () => void;
}

export default function VehicleConfirmationBar({ vehicle, onClear }: Props) {
  const { findVehicle } = useGarage();
  const saved = findVehicle(vehicle.year, vehicle.make, vehicle.model);
  const name = vehicleDisplayName(vehicle);
  const details = vehicleDetailsLine(vehicle);
  const bodyType = mapBodyClass(vehicle.bodyClass || "");
  const color = saved?.color || DEFAULT_COLOR.hex;

  if (saved) {
    return (
      <div className="rounded-lg border border-wrenchli-green/40 bg-wrenchli-green/5 p-4 space-y-1">
        <div className="flex items-start gap-3">
          <VehicleSilhouette bodyType={saved.bodyType || bodyType} color={color} className="w-20 h-10 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-heading text-base font-bold text-foreground">
              "{saved.nickname}" — {name}
            </p>
            {details && (
              <p className="text-sm text-muted-foreground mt-0.5">{details}</p>
            )}
            <p className="text-xs text-wrenchli-green font-medium mt-1">
              <CheckCircle className="inline h-3 w-3 mr-1" />
              Saved in My Garage
            </p>
          </div>
          <button
            onClick={onClear}
            className="text-xs text-wrenchli-teal font-semibold hover:underline shrink-0"
          >
            Choose Different Vehicle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="rounded-lg border border-wrenchli-green/40 bg-wrenchli-green/5 p-4 flex items-start gap-3">
        <VehicleSilhouette bodyType={bodyType} color={DEFAULT_COLOR.hex} className="w-20 h-10 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-heading text-base font-bold text-foreground">
            Vehicle Identified: {name}
          </p>
          {details && (
            <p className="text-sm text-muted-foreground mt-0.5">{details}</p>
          )}
        </div>
        <button
          onClick={onClear}
          className="text-xs text-wrenchli-teal font-semibold hover:underline shrink-0"
        >
          Change Vehicle
        </button>
      </div>
      <GarageSavePrompt vehicle={vehicle} />
    </div>
  );
}
