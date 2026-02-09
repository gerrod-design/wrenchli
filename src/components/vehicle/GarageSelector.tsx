import { CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GarageVehicle } from "@/hooks/useGarage";

interface Props {
  vehicles: GarageVehicle[];
  onSelect: (vehicle: GarageVehicle) => void;
  onAddNew: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function GarageSelector({ vehicles, onSelect, onAddNew }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Select from your saved vehicles:</p>
      {vehicles.map((v) => {
        const name = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
        const details = [v.engine, v.transmission].filter(Boolean).join(" • ");
        return (
          <div
            key={v.garageId}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-wrenchli-teal/40 transition-colors"
          >
            <CarFront className="h-5 w-5 text-wrenchli-teal shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                🚗 {v.nickname}
              </p>
              <p className="text-xs text-muted-foreground truncate">{name}{details ? ` • ${details}` : ""}</p>
              <p className="text-[11px] text-muted-foreground/60">Last used: {timeAgo(v.lastUsed)}</p>
            </div>
            <Button
              size="sm"
              onClick={() => onSelect(v)}
              className="h-8 text-xs bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 shrink-0"
            >
              Select
            </Button>
          </div>
        );
      })}
      <button
        onClick={onAddNew}
        className="flex items-center gap-2 text-xs font-semibold text-wrenchli-teal hover:underline mt-1"
      >
        + Add a New Vehicle
      </button>
    </div>
  );
}
