import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2, Edit2, Search, CarFront } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GarageVehicle } from "@/hooks/useGarage";

interface Props {
  vehicle: GarageVehicle;
  isActive?: boolean;
  onRemove: (garageId: string) => void;
  onRename: (garageId: string, nickname: string) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function GarageVehicleCard({ vehicle, isActive, onRemove, onRename }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(vehicle.nickname);

  const displayName = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
  const details = [vehicle.engine, vehicle.transmission].filter(Boolean).join(" • ");

  const diagParams = new URLSearchParams({
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
  });
  if (vehicle.trim) diagParams.set("trim", vehicle.trim);
  if (vehicle.engine) diagParams.set("engine", vehicle.engine);
  if (vehicle.vin) diagParams.set("vin", vehicle.vin);

  const handleSaveNickname = () => {
    onRename(vehicle.garageId, nickname.trim() || `My ${vehicle.model}`);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CarFront className="h-4 w-4 text-wrenchli-teal shrink-0" />
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                maxLength={20}
                className="h-7 text-sm w-32"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()}
              />
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleSaveNickname}>
                ✓
              </Button>
            </div>
          ) : (
            <span className="font-heading text-sm font-bold truncate">
              {isActive && <span className="text-wrenchli-green mr-1">●</span>}
              {vehicle.nickname}
            </span>
          )}
        </div>
        <div className="relative shrink-0">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-muted-foreground hover:text-foreground rounded">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card shadow-lg py-1">
              <button
                onClick={() => { setEditing(true); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-card-foreground hover:bg-muted transition-colors"
              >
                <Edit2 className="h-3 w-3" /> Rename
              </button>
              <button
                onClick={() => { onRemove(vehicle.garageId); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{displayName}</p>
      {details && <p className="text-xs text-muted-foreground">{details}</p>}
      <p className="text-xs text-muted-foreground">Last used: {timeAgo(vehicle.lastUsed)}</p>

      <div className="flex items-center gap-2 pt-1">
        <Button asChild size="sm" className="h-8 text-xs bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90">
          <Link to={`/vehicle-insights?${diagParams.toString()}`}>
            <Search className="mr-1 h-3 w-3" /> Diagnose
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link to={`/?year=${vehicle.year}&make=${vehicle.make}&model=${vehicle.model}#quote`}>
            Get Quotes
          </Link>
        </Button>
      </div>
    </div>
  );
}
