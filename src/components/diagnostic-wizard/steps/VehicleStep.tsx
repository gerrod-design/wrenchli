import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleData } from "../DiagnosticWizard";

interface Props {
  onNext: (vehicle: VehicleData, sessionId: string) => void;
}

const currentYear = new Date().getFullYear() + 1;

export default function VehicleStep({ onNext }: Props) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mileage, setMileage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = year && make && model && mileage && !loading;

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
      // Create vehicle record
      const { data: vehicleRec, error: vErr } = await supabase
        .from("vehicles")
        .insert({ year: y, make: make.trim(), model: model.trim(), mileage: m })
        .select()
        .single();
      if (vErr) throw vErr;

      // Create diagnostic session
      const { data: session, error: sErr } = await supabase
        .from("diagnostic_sessions")
        .insert({ vehicle_id: vehicleRec.id, status: "intake" })
        .select()
        .single();
      if (sErr) throw sErr;

      onNext({ year: y, make: make.trim(), model: model.trim(), mileage: m }, session.id);
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
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>We'll use this to give you an accurate diagnosis.</p>
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
