import { useState, useCallback } from "react";
import { Car, Keyboard, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DecodedVehicle } from "@/lib/vinDecoder";
import DropdownSelector from "./DropdownSelector";
import VinInput from "./VinInput";
import VinScanner from "./VinScanner";
import VehicleConfirmationBar from "./VehicleConfirmationBar";

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
  compact?: boolean;
}

export default function VehicleIdentifier({
  onVehicleChange,
  initialYear = "",
  initialMake = "",
  initialModel = "",
  compact = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("dropdown");
  const [confirmed, setConfirmed] = useState<DecodedVehicle | null>(null);

  // Dropdown state
  const [year, setYear] = useState(initialYear);
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);

  // Sync dropdown changes upward
  const handleYearChange = (v: string) => {
    setYear(v);
    setMake("");
    setModel("");
    onVehicleChange(v ? { year: v, make: "", model: "" } : null);
  };
  const handleMakeChange = (v: string) => {
    setMake(v);
    setModel("");
    onVehicleChange(year ? { year, make: v, model: "" } : null);
  };
  const handleModelChange = (v: string) => {
    setModel(v);
    if (year && make && v) {
      onVehicleChange({ year, make, model: v });
    }
  };

  const handleDecoded = useCallback(
    (vehicle: DecodedVehicle) => {
      setConfirmed(vehicle);
      setYear(vehicle.year);
      setMake(vehicle.make);
      setModel(vehicle.model);
      onVehicleChange({
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        engine: vehicle.engine,
        transmission: vehicle.transmission,
        driveType: vehicle.driveType,
        fuelType: vehicle.fuelType,
      });
    },
    [onVehicleChange]
  );

  const handleClear = () => {
    setConfirmed(null);
    setYear("");
    setMake("");
    setModel("");
    onVehicleChange(null);
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
