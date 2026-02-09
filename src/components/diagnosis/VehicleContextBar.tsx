import { Button } from "@/components/ui/button";

interface VehicleContextBarProps {
  vehicleStr: string;
  onChangeVehicle?: () => void;
}

export default function VehicleContextBar({ vehicleStr, onChangeVehicle }: VehicleContextBarProps) {
  if (!vehicleStr) return null;

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 mb-6">
      <p className="text-sm text-muted-foreground">
        Showing results for: <span className="font-semibold text-foreground">{vehicleStr}</span>
      </p>
      {onChangeVehicle && (
        <Button variant="ghost" size="sm" className="text-xs text-wrenchli-teal hover:text-wrenchli-teal/80" onClick={onChangeVehicle}>
          Change Vehicle
        </Button>
      )}
    </div>
  );
}
