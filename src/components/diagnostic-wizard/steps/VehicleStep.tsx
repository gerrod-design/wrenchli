import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleData } from "../DiagnosticWizard";
import { getAnonSessionId } from "@/lib/anonSession";

interface Props {
  onNext: (vehicle: VehicleData, sessionId: string) => void;
}

const currentYear = new Date().getFullYear() + 1;

export default function VehicleStep({ onNext }: Props) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [vin, setVin] = useState("");
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = year && make && model && mileage && !loading;

  const handleVinChange = (raw: string) => {
    const sanitized = raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, "").slice(0, 17);
    setVin(sanitized);
    setVinError("");
    if (sanitized.length === 17) {
      decodeVin(sanitized);
    }
  };

  const decodeVin = async (vinValue: string) => {
    setVinDecoding(true);
    setVinError("");
    try {
      const resp = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vinValue}?format=json`
      );
      if (!resp.ok) throw new Error("API error");
      const data = await resp.json();
      const results = data.Results as Array<{ Variable: string; Value: string | null }> | undefined;
      if (!results) throw new Error("No results");

      const get = (variable: string) =>
        results.find((r) => r.Variable === variable)?.Value || "";

      const decodedMake = get("Make");
      const decodedModel = get("Model");
      const decodedYear = get("Model Year");

      if (!decodedMake && !decodedModel) {
        setVinError("We couldn't decode that VIN. Please fill in your vehicle details manually.");
        return;
      }
      if (decodedYear) setYear(decodedYear);
      if (decodedMake) setMake(decodedMake);
      if (decodedModel) setModel(decodedModel);
    } catch {
      setVinError("We couldn't decode that VIN. Please fill in your vehicle details manually.");
    } finally {
      setVinDecoding(false);
    }
  };

  const handleSubmit = async () => {
    const y = parseInt(year);
    const m = parseInt(mileage.replace(/,/g, ""));
    if (isNaN(y) || y < 1900 || y > currentYear) {
      setError("Enter a valid year (1900–" + currentYear + ")");
      return;
    }
    if (isNaN(m) || m < 0) {
      setError("Enter a valid mileage");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const anonSessionId = getAnonSessionId();

      // Pre-generate IDs so we don't need SELECT policies for anon users
      const vehicleId = crypto.randomUUID();
      const sessionId = crypto.randomUUID();

      // Create vehicle record (no .select() — anon has no SELECT policy)
      const { error: vErr } = await supabase
        .from("vehicles")
        .insert({ id: vehicleId, year: y, make: make.trim(), model: model.trim(), mileage: m, anon_session_id: anonSessionId } as any);
      if (vErr) throw vErr;

      // Create diagnostic session
      const { error: sErr } = await supabase
        .from("diagnostic_sessions")
        .insert({ id: sessionId, vehicle_id: vehicleId, status: "intake", anon_session_id: anonSessionId });
      if (sErr) throw sErr;

      onNext({ year: y, make: make.trim(), model: model.trim(), mileage: m }, sessionId);
    } catch (e: any) {
      setError(e.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-mono mb-1" style={{ color: "#E07B39" }}>STEP 1</div>
        <h3 className="text-lg font-semibold" style={{ color: "#F5F5F5" }}>Tell us about your vehicle</h3>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>We'll use this to give you an accurate assessment.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Year (e.g. 2019)"
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#F5F5F5" }}
        />
        <input
          placeholder="Mileage"
          value={mileage}
          onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))}
          className="rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#F5F5F5" }}
        />
        <input
          placeholder="Make (e.g. Honda)"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#F5F5F5" }}
        />
        <input
          placeholder="Model (e.g. Civic)"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#F5F5F5" }}
        />
      </div>

      {/* VIN field */}
      <div>
        <div className="relative">
          <input
            placeholder="VIN (optional)"
            value={vin}
            onChange={(e) => handleVinChange(e.target.value)}
            maxLength={17}
            className="w-full rounded-lg px-3 py-2.5 text-sm font-mono uppercase outline-none"
            style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#F5F5F5" }}
          />
          {vinDecoding && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#E07B39" }} />
              <span className="text-[10px]" style={{ color: "#6B7280" }}>Decoding…</span>
            </div>
          )}
        </div>
        <p className="text-[10px] mt-1 leading-relaxed" style={{ color: "#6B728099" }}>
          Optional. Your VIN helps us auto-fill your vehicle details and check for open safety recalls. It is stored securely, never sold, and can be deleted at any time.
        </p>
        {vinError && <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{vinError}</p>}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
        style={{ background: "#E07B39", color: "#0F1117" }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
      </button>
    </div>
  );
}
