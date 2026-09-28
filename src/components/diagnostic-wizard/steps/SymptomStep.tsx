import { useState, useRef } from "react";
import { Loader2, ArrowRight, ArrowLeft, Camera, ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleData, SymptomData, DiagnosisResult } from "../DiagnosticWizard";
import { logFunnelEvent } from "@/lib/funnelTracking";

interface Props {
  vehicle: VehicleData;
  sessionId: string;
  onNext: (symptoms: SymptomData, diagnosis: DiagnosisResult) => void;
  onVehicleInvalid: (message: string) => void;
  onBack: () => void;
}

// Consumer-friendly labels that double as mechanic-meaningful values.
// They are interpolated verbatim into the assessment prompt, so keep them plain.
const LOCATION_OPTIONS = [
  "Front of the car",
  "Back of the car",
  "Underneath the car",
  "Inside the car",
  "Around the wheels",
  "Exhaust / tailpipe area",
  "Not sure",
];

const WHEN_OPTIONS = [
  "When starting up",
  "While idling",
  "While driving",
  "When braking",
  "When turning",
  "Cold mornings / first drive",
  "All the time",
];

const WARNING_LIGHT_OPTIONS = [
  "Check engine",
  "Oil pressure",
  "Battery / charging",
  "Brake warning",
  "ABS",
  "Tire pressure",
  "Coolant temperature",
  "Airbag",
];

const SEVERITY_OPTIONS = [
  { value: "minor", label: "Minor", desc: "Annoying but drivable" },
  { value: "moderate", label: "Moderate", desc: "Affects driving" },
  { value: "urgent", label: "Urgent", desc: "Needs attention soon" },
  { value: "do_not_drive", label: "Don't Drive", desc: "Unsafe to drive" },
] as const;

interface PhotoItem {
  id: string;
  previewUrl: string;
  uploadedUrl: string | null;
  failed: boolean;
}

const MAX_PHOTOS = 5;

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    background: selected ? "#E07B3920" : "#0F1117",
    border: `1px solid ${selected ? "#E07B39" : "#2A2D37"}`,
    color: selected ? "#E07B39" : "#9CA3AF",
  };
}

export default function SymptomStep({ vehicle, sessionId, onNext, onVehicleInvalid, onBack }: Props) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SymptomData["severity"]>();
  const [location, setLocation] = useState("");
  const [whenItHappens, setWhenItHappens] = useState<string[]>([]);
  const [warningLights, setWarningLights] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoNote, setPhotoNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = description.trim().length >= 10 && !loading;

  const toggleMulti = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `wizard/${sessionId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("damage-photos")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      console.error("Wizard photo upload error:", upErr);
      return null;
    }
    const { data, error: signErr } = await supabase.storage
      .from("damage-photos")
      .createSignedUrl(path, 3600 * 24 * 7);
    if (signErr || !data?.signedUrl) {
      console.error("Wizard photo signed-URL error:", signErr);
      return null;
    }
    return data.signedUrl;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const picked = Array.from(files).slice(0, remaining);
    const items: PhotoItem[] = picked.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      previewUrl: URL.createObjectURL(f),
      uploadedUrl: null,
      failed: false,
    }));
    setPhotos((prev) => [...prev, ...items]);

    // Upload in the background; the run continues with or without photos.
    await Promise.all(
      picked.map(async (file, i) => {
        const url = await uploadPhoto(file);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === items[i].id ? { ...p, uploadedUrl: url, failed: url === null } : p
          )
        );
        if (url === null) {
          setPhotoNote(
            "Photos couldn't attach just now — no problem, your description is enough to continue."
          );
        }
      })
    );
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const uploadedUrls = photos.map((p) => p.uploadedUrl).filter((u): u is string => u !== null);

    const symptomData: SymptomData = {
      primary_symptom: description.trim(),
      symptom_location: location || undefined,
      when_it_happens: whenItHappens.length ? whenItHappens.join("; ") : undefined,
      severity,
      warning_lights: warningLights.length ? warningLights : undefined,
      raw_description: description.trim(),
      // Forward-compatible: the assessment endpoint ignores unknown fields today;
      // photo URLs ride along so image-aware assessment can consume them later.
      photo_urls: uploadedUrls.length ? uploadedUrls : undefined,
    };

    // Instrumentation: which guided fields earned their place vs. were skipped.
    const used: string[] = [];
    if (location) used.push("loc");
    if (whenItHappens.length) used.push("when");
    if (warningLights.length) used.push("lights");
    if (uploadedUrls.length) used.push(`photos${uploadedUrls.length}`);
    logFunnelEvent(sessionId, 2, `symptom_detail:${used.join("+") || "none"}`);

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
    <div className="space-y-5">
      {/* 1 — The consumer's own words first */}
      <div>
        <div className="text-xs font-mono mb-1" style={{ color: "#E07B39" }}>STEP 2</div>
        <h3 className="text-lg font-semibold" style={{ color: "#F5F5F5" }}>Describe the problem</h3>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Tell us what's happening with your {vehicle.year} {vehicle.make} {vehicle.model}, in your own words.
        </p>
      </div>

      <textarea
        placeholder="e.g. Squealing noise when I brake, worse first thing in the morning…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
        style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#F5F5F5" }}
      />

      {/* 2 — Guided structure: the questions a good mechanic would ask */}
      <div className="rounded-lg p-4 space-y-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
        <p className="text-sm font-medium" style={{ color: "#F5F5F5" }}>
          Help us pinpoint it <span style={{ color: "#6B7280", fontWeight: 400 }}>(optional — 30 seconds)</span>
        </p>

        <div>
          <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>Where's it coming from?</div>
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={location === opt}
                onClick={() => setLocation((prev) => (prev === opt ? "" : opt))}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={chipStyle(location === opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>When does it happen? <span style={{ color: "#6B7280" }}>(pick any)</span></div>
          <div className="flex flex-wrap gap-2">
            {WHEN_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={whenItHappens.includes(opt)}
                onClick={() => setWhenItHappens((prev) => toggleMulti(prev, opt))}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={chipStyle(whenItHappens.includes(opt))}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>Any warning lights on the dash?</div>
          <div className="flex flex-wrap gap-2">
            {WARNING_LIGHT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={warningLights.includes(opt)}
                onClick={() =>
                  setWarningLights((prev) => toggleMulti(prev.filter((l) => l !== "None"), opt))
                }
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={chipStyle(warningLights.includes(opt))}
              >
                {opt}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={warningLights.includes("None")}
              onClick={() =>
                setWarningLights((prev) => (prev.includes("None") ? [] : ["None"]))
              }
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              style={chipStyle(warningLights.includes("None"))}
            >
              None
            </button>
          </div>
        </div>
      </div>

      {/* 3 — The car speaks: photos */}
      <div className="rounded-lg p-4 space-y-3" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
        <div>
          <p className="text-sm font-medium" style={{ color: "#F5F5F5" }}>
            Show us <span style={{ color: "#6B7280", fontWeight: 400 }}>(optional)</span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
            A photo is worth five minutes of typing — snap the warning light, the leak, the worn part. Your mechanic sees exactly what you see.
          </p>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
            style={{ background: "#E07B3920", border: "1px solid #E07B3940", color: "#E07B39" }}
          >
            <Camera className="h-4 w-4" /> Take photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
            style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
          >
            <ImagePlus className="h-4 w-4" /> Upload
          </button>
        </div>

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative">
                <img
                  src={p.previewUrl}
                  alt="Symptom photo"
                  className="h-16 w-16 rounded-lg object-cover"
                  style={{ border: "1px solid #2A2D37", opacity: p.failed ? 0.45 : 1 }}
                />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => removePhoto(p.id)}
                  className="absolute -top-1.5 -right-1.5 rounded-full p-0.5"
                  style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {photoNote && <p className="text-xs" style={{ color: "#F59E0B" }}>{photoNote}</p>}
      </div>

      {/* 4 — Severity */}
      <div>
        <div className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>How severe is it?</div>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={severity === opt.value}
              onClick={() => setSeverity((prev) => (prev === opt.value ? undefined : opt.value))}
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
          type="button"
          onClick={onBack}
          className="px-4 py-3 rounded-lg text-sm font-medium"
          style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "#E07B39", color: "#0F1117" }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>Get Assessment <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
