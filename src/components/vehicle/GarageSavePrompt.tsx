import { useState } from "react";
import { Save, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useGarage, isDismissedForSession, dismissForSession, vehicleKey } from "@/hooks/useGarage";
import type { DecodedVehicle } from "@/lib/vinDecoder";

interface Props {
  vehicle: DecodedVehicle;
  vin?: string;
}

export default function GarageSavePrompt({ vehicle, vin }: Props) {
  const { addVehicle, findVehicle, isFull } = useGarage();
  const key = vehicleKey(vehicle.year, vehicle.make, vehicle.model);
  const alreadySaved = !!findVehicle(vehicle.year, vehicle.make, vehicle.model, vin);

  const [dismissed, setDismissed] = useState(() => isDismissedForSession(key));
  const [nickname, setNickname] = useState(`My ${vehicle.model}`);
  const [showForm, setShowForm] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  if (alreadySaved && !justSaved) return null;
  if (dismissed) return null;

  if (justSaved) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-wrenchli-green/30 bg-wrenchli-green/5 px-4 py-3">
        <Lock className="h-3.5 w-3.5 text-wrenchli-green shrink-0" />
        <p className="text-xs text-muted-foreground">
          Saved! 🔒 Your vehicle is stored in this browser. Account sync coming soon.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    const success = addVehicle({
      nickname: nickname.trim() || `My ${vehicle.model}`,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      driveType: vehicle.driveType,
      fuelType: vehicle.fuelType,
      vin,
    });

    if (success) {
      const name = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
      toast.success(`🚗 ${name} saved to My Garage`);
      setShowForm(false);
      setJustSaved(true);
    } else if (isFull) {
      toast.error("Garage is full (max 5 vehicles). Remove one to add another.");
    }
  };

  const handleDismiss = () => {
    dismissForSession(key);
    setDismissed(true);
  };

  if (!showForm) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-wrenchli-teal/20 bg-wrenchli-teal/5 px-4 py-3">
          <Save className="h-4 w-4 text-wrenchli-teal shrink-0" />
          <p className="flex-1 text-sm text-muted-foreground">
            <button onClick={() => setShowForm(true)} className="font-semibold text-wrenchli-teal hover:underline">
              Save to My Garage?
            </button>
            {" "}Skip re-entering your vehicle info next time.
          </p>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground/60 leading-relaxed px-1">
          <Lock className="h-3 w-3 shrink-0 mt-0.5" />
          Your vehicles are saved in this browser only and are not sent to Wrenchli's servers.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-wrenchli-teal/30 bg-wrenchli-teal/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Save className="h-4 w-4 text-wrenchli-teal shrink-0" />
        <p className="text-sm font-semibold text-foreground">Save to My Garage</p>
      </div>
      <p className="text-xs text-muted-foreground">Skip re-entering your vehicle info next time.</p>
      <Input
        placeholder={`My ${vehicle.model}`}
        value={nickname}
        onChange={(e) => setNickname(e.target.value.slice(0, 20))}
        maxLength={20}
        className="h-9 text-sm"
      />
      <p className="text-xs text-muted-foreground">Nickname (optional) • max 20 characters</p>
      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm" className="bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 text-xs">
          Save Vehicle
        </Button>
        <Button onClick={handleDismiss} variant="ghost" size="sm" className="text-xs text-muted-foreground">
          No Thanks
        </Button>
      </div>
      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground/60 leading-relaxed">
        <Lock className="h-3 w-3 shrink-0 mt-0.5" />
        Your vehicles are saved in this browser only and are not sent to Wrenchli's servers.
      </p>
    </div>
  );
}
