import { useState, useCallback, useEffect } from "react";
import { Car, Keyboard, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DecodedVehicle } from "@/lib/vinDecoder";
import { decodeVin } from "@/lib/vinDecoder";
import DropdownSelector from "./DropdownSelector";
import VinInput from "./VinInput";
import VinScanner from "./VinScanner";
import VehicleConfirmationBar from "./VehicleConfirmationBar";
import { useVehicleSession, type StoredVehicle } from "@/hooks/useVehicleSession";

type TabId = "dropdown" | "vin" | "scan";

const tabs: { id: TabId; label: string; shortLabel: string; icon: typeof Car }[] = [
  { id: "dropdown", label: "Drop-Down", shortLabel: "Drop-Down", icon: Car },
  { id: "vin", label: "Enter VIN", shortLabel: "Type VIN", icon: Keyboard },
  { id: "scan", label: "📷 Scan VIN", shortLabel: "Scan VIN", icon: Camera },
];

export interface VehicleData {
  year: string;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  driveType?: string;
  fuelType?: string;
}

interface Props {
  onVehicleChange: (data: VehicleData | null) => void;
  /** External initial values (e.g. from URL params) */
  initialYear?: string;
  initialMake?: string;
  initialModel?: string;
  /** If provided, auto-decode this VIN on mount */
  initialVin?: string;
  compact?: boolean;
}

export default function VehicleIdentifier({
  onVehicleChange,
  initialYear = "",
  initialMake = "",
  initialModel = "",
  initialVin,
  compact = false,
}: Props) {
  const { vehicle: storedVehicle, setVehicle: storeVehicle, clear: clearStored } = useVehicleSession();

  const [activeTab, setActiveTab] = useState<TabId>("dropdown");
  const [confirmed, setConfirmed] = useState<DecodedVehicle | null>(
    storedVehicle?.decoded || null
  );
  const [vinDecoding, setVinDecoding] = useState(false);

  // Dropdown state — prefer URL params, then session, then empty
  const [year, setYear] = useState(initialYear || storedVehicle?.year || "");
  const [make, setMake] = useState(initialMake || storedVehicle?.make || "");
  const [model, setModel] = useState(initialModel || storedVehicle?.model || "");

  // On mount: if session has a confirmed vehicle, fire onVehicleChange
  useEffect(() => {
    if (storedVehicle && storedVehicle.year && storedVehicle.make && storedVehicle.model) {
      onVehicleChange(storedVehicle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-decode VIN from URL param on mount
  useEffect(() => {
    if (!initialVin || confirmed) return;
    let cancelled = false;
    setVinDecoding(true);
    decodeVin(initialVin)
      .then((vehicle) => {
        if (cancelled) return;
        handleDecoded(vehicle);
      })
      .catch(() => {
        // silently fall back to manual entry
      })
      .finally(() => {
        if (!cancelled) setVinDecoding(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVin]);

  // Sync dropdown changes upward
  const handleYearChange = (v: string) => {
    setYear(v);
    setMake("");
    setModel("");
    const data = v ? { year: v, make: "", model: "" } : null;
    onVehicleChange(data);
    if (data) storeVehicle(data); else clearStored();
  };
  const handleMakeChange = (v: string) => {
    setMake(v);
    setModel("");
    const data = year ? { year, make: v, model: "" } : null;
    onVehicleChange(data);
    if (data) storeVehicle(data); else clearStored();
  };
  const handleModelChange = (v: string) => {
    setModel(v);
    if (year && make && v) {
      const data: StoredVehicle = { year, make, model: v };
      onVehicleChange(data);
      storeVehicle(data);
    }
  };

  const handleDecoded = useCallback(
    (vehicle: DecodedVehicle) => {
      setConfirmed(vehicle);
      setYear(vehicle.year);
      setMake(vehicle.make);
      setModel(vehicle.model);
      const data: StoredVehicle = {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        engine: vehicle.engine,
        transmission: vehicle.transmission,
        driveType: vehicle.driveType,
        fuelType: vehicle.fuelType,
        decoded: vehicle,
      };
      onVehicleChange(data);
      storeVehicle(data);
    },
    [onVehicleChange, storeVehicle]
  );

  const handleClear = () => {
    setConfirmed(null);
    setYear("");
    setMake("");
    setModel("");
    onVehicleChange(null);
    clearStored();
    setActiveTab("dropdown");
  };

  // If vehicle is confirmed via VIN, show confirmation bar
  if (confirmed) {
    return <VehicleConfirmationBar vehicle={confirmed} onClear={handleClear} />;
  }

  // If dropdown selections are complete, show a simple confirmation
  const dropdownComplete = activeTab === "dropdown" && year && make && model;

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex rounded-lg border border-border bg-muted/50 p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              activeTab === tab.id
                ? "bg-wrenchli-teal text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "dropdown" && (
        <DropdownSelector
          year={year}
          make={make}
          model={model}
          onYearChange={handleYearChange}
          onMakeChange={handleMakeChange}
          onModelChange={handleModelChange}
        />
      )}

      {activeTab === "vin" && <VinInput onDecoded={handleDecoded} />}

      {activeTab === "scan" && (
        <VinScanner
          onDecoded={handleDecoded}
          onSwitchToVin={() => setActiveTab("vin")}
          onSwitchToDropdown={() => setActiveTab("dropdown")}
        />
      )}
    </div>
  );
}
