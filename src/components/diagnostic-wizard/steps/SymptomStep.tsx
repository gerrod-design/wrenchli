import { useState } from "react";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleData, SymptomData, DiagnosisResult } from "../DiagnosticWizard";
import { parseDiagnosticCodes } from "../codes";

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

// Brief 5, Item 1: the engine has always accepted symptom_location,
// when_it_happens, and warning_lights; the wizard finally sends them.
const LOCATION_OPTIONS = [
  "Front of the car",
  "Back of the car",
  "Left side",
  "Right side",
  "Under the hood",
  "Under the car",
  "Inside the cabin",
  "All over / not sure",
] as const;

const WHEN_OPTIONS = [
  "Cold start",
  "Warming up",
  "Highway speeds",
  "Braking",
  "Turning",
  "All the time",
] as const;

const WARNING_LIGHT_OPTIONS = [
  "Check engine",
  "ABS",
  "Battery",
  "Oil pressure",
  "Temperature",
  "Tire pressure",
  "Airbag",
  "None",
] as const;

const chipStyle = (selected: boolean): React.CSSProperties => ({
  background: selected ? "#E07B3920" : "#0F1117",
  border: `1px solid ${selected ? "#E07B39" : "#2A2D37"}`,
  color: selected ? "#E07B39" : "#9CA3AF",
});

export default function SymptomStep({ vehicle, sessionId, onNext, onVehicleInvalid, onBack }: Props) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SymptomData["severity"]>();
  const [location, setLocation] = useState<string>("");
  const [locationDetail, setLocationDetail] = useState("");
  const [whenHappens, setWhenHappens] = useState<string[]>([]);
  const [warningLights, setWarningLights] = useState<string[]>([]);
  const [codesInput, setCodesInput] = useState("");
  const [codesError, setCodesError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = description.trim().length >= 10 && !loading;

  const toggleWhen = (value: string) => {
    setWhenHappens((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleWarningLight = (value: string) => {
    setWarningLights((prev) => {
      // "None" means no lights are on: it clears the rest, and picking any
      // real light clears "None".
      if (value === "None") return prev.includes("None") ? [] : ["None"];
      const withoutNone = prev.filter((v) => v !== "None");
      return withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    });
  };

  const handleSubmit = async () => {
    // Brief 5, Item 2: codes are format-validated at the field. An invalid
    // entry is rejected here with a plain message and never submitted.
    const parsedCodes = parseDiagnosticCodes(codesInput);
    if (parsedCodes.invalid.length > 0) {
      setCodesError(
        `${parsedCodes.invalid.join(", ")} doesn't look like a code. Codes look like P0300: the letter P, B, C, or U followed by 4 characters.`
      );
      return;
    }
    setCodesError("");

    setLoading(true);
    setError("");

    const symptomLocation = [location, locationDetail.trim()]
      .filter((part) => part.length > 0)
      .join(": ");

    const symptomData: SymptomData = {
      primary_symptom: description.trim(),
      severity,
      raw_description: description.trim(),
      ...(symptomLocation ? { symptom_location: symptomLocation } : {}),
      ...(whenHappens.length > 0 ? { when_it_happens: whenHappens.join(", ") } : {}),
      ...(warningLights.length > 0 ? { warning_lights: warningLights } : {}),
      ...(parsedCodes.codes.length > 0 ? { codes: parsedCodes.codes } : {}),
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
      setError(e.message || "Assessment failed. Please try again.");
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
        <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>Where on the car? <span style={{ color: "#6B7280" }}>(optional)</span></div>
        <div className="flex flex-wrap gap-2">
          {LOCATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setLocation(location === opt ? "" : opt)}
              className="rounded-lg px-3 py-1.5 transition-all text-xs"
              style={chipStyle(location === opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Or say it in your own words, e.g. near the back wheel"
          value={locationDetail}
          onChange={(e) => setLocationDetail(e.target.value)}
          className="w-full rounded-lg px-3 py-2 mt-2 text-sm outline-none"
          style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#F5F5F5" }}
        />
      </div>

      <div>
        <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>When does it happen? <span style={{ color: "#6B7280" }}>(pick any that fit, optional)</span></div>
        <div className="flex flex-wrap gap-2">
          {WHEN_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleWhen(opt)}
              className="rounded-lg px-3 py-1.5 transition-all text-xs"
              style={chipStyle(whenHappens.includes(opt))}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>Any warning lights on? <span style={{ color: "#6B7280" }}>(pick any that fit, optional)</span></div>
        <div className="flex flex-wrap gap-2">
          {WARNING_LIGHT_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleWarningLight(opt)}
              className="rounded-lg px-3 py-1.5 transition-all text-xs"
              style={chipStyle(warningLights.includes(opt))}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>Have any fault codes? <span style={{ color: "#6B7280" }}>(optional)</span></div>
        <input
          type="text"
          placeholder="If a scanner or a parts store gave you codes, enter them here, e.g. P0300"
          value={codesInput}
          onChange={(e) => {
            setCodesInput(e.target.value);
            if (codesError) setCodesError("");
          }}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono"
          style={{ background: "#0F1117", border: `1px solid ${codesError ? "#F87171" : "#2A2D37"}`, color: "#F5F5F5" }}
        />
        {codesError && <p className="text-xs text-red-400 mt-1">{codesError}</p>}
      </div>

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
            <>Get Assessment <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
