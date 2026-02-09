import { useState, useCallback } from "react";
import { Cpu, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DisclaimerBanner from "./diagnosis/DisclaimerBanner";
import VehicleContextBar from "./diagnosis/VehicleContextBar";
import DiagnosisCard from "./diagnosis/DiagnosisCard";
import StillNotSure from "./diagnosis/StillNotSure";
import type { Diagnosis, DiagnosisResultProps } from "./diagnosis/types";

const DIAGNOSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnose`;

export default function DiagnosisResult({ codes, symptom, year, make, model }: DiagnosisResultProps) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState("");

  const vehicleStr = [year, make, model].filter(Boolean).join(" ");

  const runDiagnosis = useCallback(async () => {
    setIsLoading(true);
    setDiagnoses([]);
    setError("");
    setHasRun(true);

    try {
      const resp = await fetch(DIAGNOSE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ codes, symptom, year, make, model }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data.error || "Failed to get diagnosis";
        if (resp.status === 429) toast.error("Rate limit exceeded. Please try again shortly.");
        else if (resp.status === 402) toast.error("AI service temporarily unavailable.");
        else toast.error(msg);
        setError(msg);
        setIsLoading(false);
        return;
      }

      const data = await resp.json();
      setDiagnoses(data.diagnoses || []);
    } catch (e) {
      console.error("Diagnosis error:", e);
      setError("Failed to connect to diagnosis service. Please try again.");
      toast.error("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [codes, symptom, year, make, model]);

  const hasInput = Boolean(codes || symptom);
  if (!hasInput) return null;

  const handleChangeVehicle = () => {
    document.getElementById("diagnosis-input")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="section-padding bg-secondary">
      <div className="container-wrenchli max-w-3xl">
        <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">
          {hasRun ? "Your Diagnosis" : "Ready to Diagnose"}
        </h2>
        <p className="mt-3 mb-8 text-center text-muted-foreground">
          {hasRun
            ? `AI-powered analysis${vehicleStr ? ` for your ${vehicleStr}` : ""}`
            : `Get an AI-powered diagnosis${vehicleStr ? ` for your ${vehicleStr}` : ""}`}
        </p>

        {!hasRun && (
          <div className="text-center">
            <Button
              onClick={runDiagnosis}
              size="lg"
              className="h-14 px-10 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-bold text-lg transition-transform hover:scale-[1.02]"
            >
              <Cpu className="mr-2 h-5 w-5" />
              Run AI Diagnosis
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Free • No account required • Powered by AI
            </p>
          </div>
        )}

        {isLoading && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-wrenchli-teal" />
            <p className="text-sm text-muted-foreground">Analyzing your vehicle issue...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-destructive mb-2" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={runDiagnosis}
              variant="outline"
              size="sm"
              className="mt-4 border-destructive text-destructive hover:bg-destructive/10"
            >
              Try Again
            </Button>
          </div>
        )}

        {diagnoses.length > 0 && !isLoading && (
          <div className="space-y-6">
            <DisclaimerBanner />
            <VehicleContextBar vehicleStr={vehicleStr} onChangeVehicle={handleChangeVehicle} />

            <div className="space-y-6">
              {diagnoses.map((diag, i) => (
                <DiagnosisCard key={i} diagnosis={diag} vehicle={vehicleStr} />
              ))}
            </div>

            {diagnoses.length > 1 && (
              <p className="text-center text-sm text-muted-foreground italic">
                Multiple potential causes are listed because symptoms can overlap. A qualified technician can perform a hands-on inspection to pinpoint the exact issue for your vehicle.
              </p>
            )}

            <StillNotSure vehicle={vehicleStr} />
          </div>
        )}
      </div>
    </section>
  );
}
