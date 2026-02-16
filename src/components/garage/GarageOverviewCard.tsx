import { useState } from "react";
import {
  Car, Wrench, TrendingUp, AlertTriangle, Calendar, DollarSign,
  BarChart3, Shield, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GarageVehicle } from "@/hooks/useGarage";
import type { CloudVehicle } from "@/hooks/useGarageSync";
import type { UpcomingMaintenance } from "@/data/maintenanceSchedule";
import { getUpcomingMaintenance } from "@/data/maintenanceSchedule";

interface Props {
  vehicle: GarageVehicle;
  cloudVehicle?: CloudVehicle;
  upcomingMaintenance: UpcomingMaintenance[];
  isSelected: boolean;
  onClick: () => void;
}

const PRIORITY_STYLES = {
  overdue: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  urgent: { bg: "bg-wrenchli-amber/10", text: "text-wrenchli-amber", border: "border-wrenchli-amber/30" },
  soon: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/30" },
  upcoming: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

export default function GarageOverviewCard({ vehicle, cloudVehicle, upcomingMaintenance, isSelected, onClick }: Props) {
  const displayName = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const mileage = cloudVehicle?.current_mileage;

  // Get worst priority among upcoming maintenance
  const worstPriority = upcomingMaintenance.length > 0
    ? upcomingMaintenance[0].priority
    : null;

  const statusLabel = !mileage
    ? "Set mileage"
    : worstPriority === "overdue"
    ? "Service overdue"
    : worstPriority === "urgent"
    ? "Service due soon"
    : "Up to date";

  const statusVariant = !mileage
    ? "outline"
    : worstPriority === "overdue"
    ? "destructive"
    : worstPriority === "urgent"
    ? "secondary"
    : "default";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border bg-card p-4 space-y-3 transition-all duration-200 hover:shadow-md",
        isSelected ? "ring-2 ring-accent border-accent" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-sm font-bold truncate">
            {isSelected && <span className="text-wrenchli-green mr-1">●</span>}
            {vehicle.nickname}
          </p>
          <p className="text-xs text-muted-foreground truncate">{displayName}</p>
        </div>
        <Badge variant={statusVariant} className="shrink-0 text-[10px]">
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Mileage</p>
          <p className="font-medium">{mileage ? mileage.toLocaleString() : "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Age</p>
          <p className="font-medium">{new Date().getFullYear() - parseInt(vehicle.year)}y</p>
        </div>
        <div>
          <p className="text-muted-foreground">Alerts</p>
          <p className={cn("font-medium", upcomingMaintenance.length > 0 && "text-wrenchli-amber")}>
            {upcomingMaintenance.length || "None"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end text-[11px] text-muted-foreground">
        <span>View details</span>
        <ChevronRight className="h-3 w-3 ml-0.5" />
      </div>
    </button>
  );
}
