import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Car, Plus } from "lucide-react";
import { useGarage } from "@/hooks/useGarage";
import GarageBadge from "@/components/vehicle/GarageBadge";
import GarageVehicleCard from "./GarageVehicleCard";
import GaragePrivacyNotice from "./GaragePrivacyNotice";
import GarageClearDialog from "./GarageClearDialog";
import GarageSyncTeaser from "./GarageSyncTeaser";

export default function GarageDropdown() {
  const { vehicles, removeVehicle, updateNickname, clearAll } = useGarage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isEmpty = vehicles.length === 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors"
        title="My Garage — saved vehicles"
      >
        <Car className="h-4 w-4" />
        {!isEmpty && (
          <>
            <span className="hidden xl:inline">My Garage</span>
            <GarageBadge />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-border flex items-center gap-2">
            <Car className="h-4 w-4 text-wrenchli-teal" />
            <span className="font-heading text-sm font-bold text-card-foreground">MY GARAGE</span>
          </div>

          {isEmpty ? (
            <div className="p-6 text-center">
              <Car className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No saved vehicles yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Identify a vehicle to save it here for quick access.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
              {vehicles.map((v, i) => (
                <GarageVehicleCard
                  key={v.garageId}
                  vehicle={v}
                  isActive={i === 0}
                  onRemove={removeVehicle}
                  onRename={updateNickname}
                />
              ))}
            </div>
          )}

          {!isEmpty && vehicles.length < 5 && (
            <div className="border-t border-border px-4 py-3">
              <Link
                to="/vehicle-insights"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-xs font-semibold text-wrenchli-teal hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another Vehicle
              </Link>
            </div>
          )}

          {/* Account sync teaser */}
          {!isEmpty && (
            <div className="border-t border-border px-4 py-3">
              <GarageSyncTeaser />
            </div>
          )}

          {/* Privacy + Clear */}
          <div className="border-t border-border px-4 py-3 bg-muted/50 space-y-2">
            <GaragePrivacyNotice />
            {!isEmpty && <GarageClearDialog onClear={clearAll} />}
          </div>
        </div>
      )}
    </div>
  );
}
