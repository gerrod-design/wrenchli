import { useState } from "react";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleData, SymptomData, DiagnosisResult } from "../DiagnosticWizard";

interface Props {
  vehicle: VehicleData;
  sessionId: string;
  onNext: (symptoms: SymptomData, diagnosis: DiagnosisResult) => void;
  onVehicleInvalid: (message: string) => void;
  onBack: () => void;
}

const SEVERITY_OPTIONS = [
  { value: "minor", label: "Minor", desc: "Annoying but drivable" },
  { value: "moderate", label: "Moderate", desc: "Affects driving" },
  { value: "urgent", label: "Urgent", desc: "Needs attention soon" },
  { value: "do_not_drive", label: "Don't Drive", desc: "Unsafe to drive" },
] as const;

export default function SymptomStep({ vehicle, sessionId, onNext, onVehicleInvalid, onBack }: Props) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SymptomData["severity"]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = description.trim().length >= 10 && !loading;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const symptomData: SymptomData = {
      primary_symptom: description.trim(),
      severity,
      raw_description: description.trim(),
    };

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("diagnose-vehicle", {
        body: {
          session_id: sessionId,
          vehicle,
          symptom: symptomData,
        },
      });

      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      // Check for vehicle validation rejection
      if (data?.vehicle_invalid) {
        onVehicleInvalid(data.validation_message || `We don't have records of a ${vehicle.year} ${vehicle.make} ${vehicle.model}. Could you double-check your vehicle details?`);
        return;
      }

      onNext(symptomData, data as DiagnosisResult);
    } catch (e: any) {
      setError(e.message || "Diagnosis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-mono mb-1" style={{ color: "#E07B39" }}>STEP 2</div>
        <h3 className="text-lg font-semibold" style={{ color: "#F5F5F5" }}>Describe the problem</h3>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          What's happening with your {vehicle.year} {vehicle.make} {vehicle.model}?
        </p>
      </div>

      <textarea
        placeholder="e.g. Car won't start, clicking sound when I turn the key, dashboard lights flicker..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
        style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#F5F5F5" }}
      />

      <div>
        <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>How severe is it?</div>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSeverity(opt.value)}
              className="rounded-lg px-3 py-2 text-left transition-all text-xs"
              style={{
                background: severity === opt.value ? "#E07B3920" : "#0F1117",
                border: `1px solid ${severity === opt.value ? "#E07B39" : "#2A2D37"}`,
                color: severity === opt.value ? "#E07B39" : "#9CA3AF",
              }}
            >
              <div className="font-semibold">{opt.label}</div>
              <div style={{ color: "#6B7280" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-lg text-sm font-medium"
          style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "#E07B39", color: "#0F1117" }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>Get Diagnosis <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
