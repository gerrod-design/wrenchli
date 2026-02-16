import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, MapPin } from "lucide-react";
import { sanitizeVin, isValidVin, decodeVin } from "@/lib/vinDecoder";
import type { DecodedVehicle } from "@/lib/vinDecoder";
import { cn } from "@/lib/utils";
import VinPrivacyNotice from "./VinPrivacyNotice";

interface Props {
  onDecoded: (vehicle: DecodedVehicle) => void;
}

export default function VinInput({ onDecoded }: Props) {
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const handleChange = (val: string) => {
    const sanitized = sanitizeVin(val);
    setVin(sanitized);
    setError("");
  };

  const handleDecode = async () => {
    if (!isValidVin(vin)) {
      setError("VINs are exactly 17 characters and don't contain the letters I, O, or Q. Please check your entry.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const vehicle = await decodeVin(vin);
      if (!vehicle.make || !vehicle.model) {
        setError("We couldn't find complete vehicle details for that VIN. This can happen with older vehicles (pre-2000), imports, or specialty vehicles. Please use the Year/Make/Model dropdown instead.");
        return;
      }
      onDecoded(vehicle);
    } catch (err) {
      console.error("[VinInput] decode error:", err);
      setError("We couldn't find vehicle details for that VIN. Please double-check and try again, or use the Year/Make/Model dropdown instead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Enter your 17-character VIN
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 4T1B11HK5KU123456"
            value={vin}
            onChange={(e) => handleChange(e.target.value)}
            className="h-12 text-base font-mono uppercase flex-1"
            maxLength={17}
          />
          <Button
            onClick={handleDecode}
            disabled={vin.length < 17 || loading}
            className="h-12 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-semibold px-5 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decode"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {vin.length} / 17 characters
        </p>
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <button
        onClick={() => setShowHelp(!showHelp)}
        className="text-xs text-wrenchli-teal font-semibold hover:underline inline-flex items-center gap-1"
      >
        <MapPin className="h-3 w-3" />
        Where do I find my VIN?
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showHelp && "rotate-180")} />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          showHelp ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">📍 Where to Find Your VIN</p>
          <p>Your VIN (Vehicle Identification Number) is a 17-character code unique to your vehicle. You can find it:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs">
            <li><span className="font-medium text-foreground">Dashboard</span> — Look through the windshield at the driver's side corner (small metal plate visible from outside)</li>
            <li><span className="font-medium text-foreground">Driver's door jamb</span> — Open the driver's door and look for a sticker on the door frame</li>
            <li><span className="font-medium text-foreground">Registration card</span> — Your state vehicle registration document lists the VIN</li>
            <li><span className="font-medium text-foreground">Insurance card</span> — Your auto insurance documents include the VIN</li>
            <li><span className="font-medium text-foreground">Vehicle title</span> — The VIN appears on your title document</li>
          </ol>
        </div>
      </div>

      <VinPrivacyNotice />
    </div>
  );
}
