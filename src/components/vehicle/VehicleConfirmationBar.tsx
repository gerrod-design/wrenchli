import { CheckCircle } from "lucide-react";
import type { DecodedVehicle } from "@/lib/vinDecoder";
import { vehicleDisplayName, vehicleDetailsLine } from "@/lib/vinDecoder";

interface Props {
  vehicle: DecodedVehicle;
  onClear: () => void;
}

export default function VehicleConfirmationBar({ vehicle, onClear }: Props) {
  const name = vehicleDisplayName(vehicle);
  const details = vehicleDetailsLine(vehicle);

  return (
    <div className="rounded-lg border border-wrenchli-green/40 bg-wrenchli-green/5 p-4 flex items-start gap-3">
      <CheckCircle className="h-5 w-5 shrink-0 text-wrenchli-green mt-0.5" />
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
  );
}
