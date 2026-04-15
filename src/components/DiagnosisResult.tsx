import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Cpu, AlertCircle, Car } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import RecommendShopPrompt from "./recommend/RecommendShopPrompt";
import DownloadReportButton from "./diagnosis/DownloadReportButton";
import RecommendShopModal from "./recommend/RecommendShopModal";
import VehicleScanLoader from "./diagnosis/VehicleScanLoader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DisclaimerBanner from "./diagnosis/DisclaimerBanner";
import PreliminaryCostCard from "./diagnosis/PreliminaryCostCard";
import { getPreliminaryCostRange } from "@/data/preliminaryCostRanges";
import VehicleContextBar from "./diagnosis/VehicleContextBar";
import DiagnosisCard from "./diagnosis/DiagnosisCard";
import StillNotSure from "./diagnosis/StillNotSure";
import ShopShareConsent from "./diagnosis/ShopShareConsent";
import SymptomMatchResults, { NoMatchFallback } from "./diagnosis/SymptomMatchResults";
import { matchSymptoms } from "@/data/symptomLibrary";
import { getDtcEntry } from "@/data/dtcCodes";
import { getToolsForDiagnosis } from "@/data/toolsLibrary";
import type { Diagnosis, DiagnosisResultProps } from "./diagnosis/types";
import { useGarage } from "@/hooks/useGarage";
import { useAuth } from "@/contexts/AuthContext";
import { useCloudVehicles } from "@/hooks/useCloudVehicles";
import AuthGateModal from "@/components/AuthGateModal";

const DIAGNOSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnose`;

function SaveToGaragePrompt({ year, make, model }: { year?: string; make?: string; model?: string }) {
  const { user } = useAuth();
  const { vehicles } = useCloudVehicles();
  const navigate = useNavigate();
  const [showAuthGate, setShowAuthGate] = useState(false);

  if (!year || !make || !model) return null;

  const alreadySaved = vehicles.some(
    (v) => String(v.year) === year && v.make.toLowerCase() === make.toLowerCase() && v.model.toLowerCase() === model.toLowerCase()
  );
  if (alreadySaved) return null;

  const handleClick = () => {
    if (!user) {
      setShowAuthGate(true);
      return;
    }
    navigate(`/garage?addYear=${encodeURIComponent(year)}&addMake=${encodeURIComponent(make)}&addModel=${encodeURIComponent(model)}`);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Car className="h-5 w-5" />
          <p className="text-sm">
            Save this vehicle to your garage for recall alerts and assessment history.
          </p>
        </div>
        <Button
          onClick={handleClick}
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
        >
          <Car className="mr-2 h-4 w-4" />
          Save to My Garage
        </Button>
      </div>
      <AuthGateModal
        open={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        onAuthenticated={() => {
          setShowAuthGate(false);
          navigate(`/garage?addYear=${encodeURIComponent(year!)}&addMake=${encodeURIComponent(make!)}&addModel=${encodeURIComponent(model!)}`);
        }}
      />
    </>
  );
}

export default function DiagnosisResult({ codes, symptom, year, make, model, onSwitchToDtc }: DiagnosisResultProps) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState("");
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [shopShareConsent, setShopShareConsent] = useState(false);

  const vehicleStr = [year, make, model].filter(Boolean).join(" ");
  const { findVehicle, addDiagnosticEntry } = useGarage();
  const garageVehicle = findVehicle(year, make, model);
  const savedToHistory = useRef(false);

  // Instant client-side symptom matching
  const symptomMatches = useMemo(() => {
    if (!symptom) return [];
    return matchSymptoms(symptom);
  }, [symptom]);
  // Save diagnosis to garage history when results arrive
  useEffect(() => {
    if (diagnoses.length === 0 || savedToHistory.current || !garageVehicle) return;
    savedToHistory.current = true;

    const resultSummaries = diagnoses.map((d) => d.title || "Unknown");
    addDiagnosticEntry(garageVehicle.garageId, {
      type: codes ? "code" : "symptom",
      input: codes || symptom || "",
      results: resultSummaries,
    });
  }, [diagnoses, garageVehicle, codes, symptom, addDiagnosticEntry]);

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
      const enriched = (data.diagnoses || []).map((diag: Diagnosis) => {
        if (!diag.tools_required || diag.tools_required.length === 0) {
          const dtcEntry = diag.code ? getDtcEntry(diag.code) : null;
          diag.tools_required = getToolsForDiagnosis(
            dtcEntry?.category,
            diag.diy_feasibility
          );
          if (dtcEntry) diag.category = dtcEntry.category;
        }
        return diag;
      });
      setDiagnoses(enriched);
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

  // Show instant symptom matches when symptom is provided (before AI run)
  const showInstantMatches = symptom && !hasRun;

  return (
    <section id="diagnosis-results" className="section-padding bg-secondary">
      <div className="container-wrenchli max-w-3xl">
        {/* Instant symptom matches (shown before AI diagnosis) */}
        {showInstantMatches && (
          <>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">
              {symptomMatches.length > 0 ? "Quick Match Results" : "Ready to Diagnose"}
            </h2>
            <p className="mt-3 mb-8 text-center text-muted-foreground">
              {symptomMatches.length > 0
                ? "Based on common symptom patterns — run AI diagnosis for a more detailed analysis."
                : `Get an AI-powered diagnosis${vehicleStr ? ` for your ${vehicleStr}` : ""}`}
            </p>

            {symptomMatches.length > 0 && (
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 mb-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-blue-600" />
                  <p className="text-sm leading-relaxed text-blue-900">
                    This is a symptom assessment, not a professional inspection. Use it to ask better questions at the shop — not to skip one.
                  </p>
                </div>
                <DisclaimerBanner />
                <VehicleContextBar vehicleStr={vehicleStr} onChangeVehicle={handleChangeVehicle} />
                <SymptomMatchResults matches={symptomMatches} vehicle={vehicleStr} onSwitchToDtc={onSwitchToDtc} />

                {symptomMatches.length > 1 && (
                  <p className="text-center text-sm text-muted-foreground italic">
                    Multiple potential causes are listed because symptoms can overlap. A qualified technician can perform a hands-on inspection to pinpoint the exact issue for your vehicle.
                  </p>
                )}
              </div>
            )}

            {symptomMatches.length === 0 && (
              <div className="mb-8">
                <NoMatchFallback vehicle={vehicleStr} />
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3">
                {symptomMatches.length > 0 ? "Want a deeper, vehicle-specific analysis?" : ""}
              </p>
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
          </>
        )}

        {/* DTC code flow — no instant matches, just the run button */}
        {codes && !hasRun && (
          <>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Ready to Diagnose</h2>
            <p className="mt-3 mb-8 text-center text-muted-foreground">
              Get an AI-powered diagnosis{vehicleStr ? ` for your ${vehicleStr}` : ""}
            </p>
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
          </>
        )}

        {/* Branded loading state */}
        {isLoading && (
          <div className="mt-8">
            <VehicleScanLoader
              vehicleName={vehicleStr}
              bodyType={garageVehicle?.bodyType}
              color={garageVehicle?.color}
              codes={codes}
            />
            {(() => {
              const range = getPreliminaryCostRange(symptom || codes || "");
              return range ? <PreliminaryCostCard range={range} /> : null;
            })()}
          </div>
        )}

        {/* Error state */}
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

        {/* AI diagnosis results */}
        {diagnoses.length > 0 && !isLoading && (
          <div className="space-y-6">
            {!showInstantMatches && (
              <>
                <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Your AI Diagnosis</h2>
                <p className="mt-1 mb-4 text-center text-muted-foreground">
                  AI-powered analysis{vehicleStr ? ` for your ${vehicleStr}` : ""}
                </p>
              </>
            )}

            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 mb-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-blue-600" />
              <p className="text-sm leading-relaxed text-blue-900">
                This is a symptom assessment, not a professional inspection. Use it to ask better questions at the shop — not to skip one.
              </p>
            </div>
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

            <div className="flex justify-center">
              <DownloadReportButton vehicle={vehicleStr} diagnoses={diagnoses} symptom={symptom} codes={codes} year={year} make={make} model={model} />
            </div>

            <ShopShareConsent
              consented={shopShareConsent}
              onConsentChange={setShopShareConsent}
            />

            {shopShareConsent && (
              <>
                <StillNotSure vehicle={vehicleStr} />
                <RecommendShopPrompt onOpenModal={() => setRecommendOpen(true)} />
              </>
            )}

            <SaveToGaragePrompt year={year} make={make} model={model} />
          </div>
        )}

        <RecommendShopModal open={recommendOpen} onClose={() => setRecommendOpen(false)} />
      </div>
    </section>
  );
}
