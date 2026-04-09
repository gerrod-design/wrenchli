import { useState, useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import VehicleStep from "./steps/VehicleStep";
import SymptomStep from "./steps/SymptomStep";
import DiagnosisStep from "./steps/DiagnosisStep";
import RecommendationStep from "./steps/RecommendationStep";
import { logFunnelEvent, flushPendingFunnelEvents } from "@/lib/funnelTracking";

export type WizardStep = "vehicle" | "symptoms" | "diagnosing" | "recommendation";

export interface VehicleData {
  year: number;
  make: string;
  model: string;
  mileage: number;
  trim?: string;
}

export interface SymptomData {
  primary_symptom: string;
  symptom_location?: string;
  when_it_happens?: string;
  severity?: "minor" | "moderate" | "urgent" | "do_not_drive";
  warning_lights?: string[];
  raw_description?: string;
}

export interface PossibleCause {
  name: string;
  probability: number;
  estimated_cost_low: number;
  estimated_cost_high: number;
  diy_difficulty: "easy" | "moderate" | "professional_only";
  notes?: string;
}

export interface DiagnosisResult {
  diagnosis_id: string;
  confidence: "low" | "medium" | "high";
  urgency: "monitor" | "schedule" | "soon" | "immediate";
  explanation: string;
  possible_causes: PossibleCause[];
}

export interface RecommendationResult {
  recommendation_id: string;
  action: string;
  next_steps: string[];
  questions_to_ask_mechanic: string[];
  parts_likely_needed: string[];
}

export default function DiagnosticWizard() {
  const [step, setStep] = useState<WizardStep>("vehicle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomData | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

  const stepIndex = ["vehicle", "symptoms", "diagnosing", "recommendation"].indexOf(step);

  const STEP_MAP: Record<WizardStep, { number: number; name: string }> = {
    vehicle: { number: 1, name: "vehicle_entry" },
    symptoms: { number: 2, name: "symptom_entry" },
    diagnosing: { number: 3, name: "assessment_generating" },
    recommendation: { number: 5, name: "recommendation_shown" },
  };

  // Track step changes
  const prevStep = useRef<WizardStep | null>(null);
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;

    const info = STEP_MAP[step];
    if (!info) return;

    logFunnelEvent(sessionId, info.number, info.name);

    // When diagnosing starts, also log step 4 when diagnosis arrives
    // (handled below via diagnosis effect)
  }, [step, sessionId]);

  // Track step 4 when diagnosis result is set
  const diagnosisLogged = useRef(false);
  useEffect(() => {
    if (diagnosis && !diagnosisLogged.current) {
      diagnosisLogged.current = true;
      logFunnelEvent(sessionId, 4, "results_shown");
    }
  }, [diagnosis, sessionId]);

  // Flush pending events once sessionId is available
  useEffect(() => {
    if (sessionId) {
      flushPendingFunnelEvents(sessionId);
    }
  }, [sessionId]);

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "#1A1D27", border: "1px solid #2A2D37", WebkitTransform: "translate3d(0,0,0)" }}>
      {/* Step indicator */}
      <div className="flex border-b" style={{ borderColor: "#2A2D37" }}>
        {["Vehicle", "Symptoms", "Diagnosis", "Plan"].map((label, i) => (
          <div
            key={label}
            className="flex-1 text-center py-3 text-xs font-mono transition-colors"
            style={{
              background: i <= stepIndex ? "#E07B3915" : "transparent",
              color: i <= stepIndex ? "#E07B39" : "#4B5563",
              borderBottom: i === stepIndex ? "2px solid #E07B39" : "2px solid transparent",
            }}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="p-5">
        {step === "vehicle" && (
          <VehicleStep
            onNext={(v, sid) => {
              setVehicle(v);
              setSessionId(sid);
              setStep("symptoms");
            }}
          />
        )}
        {step === "symptoms" && vehicle && sessionId && (
          <SymptomStep
            vehicle={vehicle}
            sessionId={sessionId}
            onNext={(s, d) => {
              setSymptoms(s);
              setDiagnosis(d);
              setStep("diagnosing");
            }}
            onBack={() => setStep("vehicle")}
          />
        )}
        {step === "diagnosing" && diagnosis && vehicle && sessionId && (
          <DiagnosisStep
            diagnosis={diagnosis}
            vehicle={vehicle}
            sessionId={sessionId}
            onNext={(r) => {
              setRecommendation(r);
              setStep("recommendation");
            }}
            onBack={() => setStep("symptoms")}
          />
        )}
        {step === "recommendation" && recommendation && diagnosis && vehicle && sessionId && (
          <RecommendationStep
            recommendation={recommendation}
            diagnosis={diagnosis}
            vehicle={vehicle}
            sessionId={sessionId}
            onRestart={() => {
              setStep("vehicle");
              setVehicle(null);
              setSymptoms(null);
              setDiagnosis(null);
              setRecommendation(null);
              setSessionId(null);
            }}
          />
        )}
      </div>

      {/* Chat bridge */}
      <button
        onClick={() => {
          const chatTrigger = document.querySelector<HTMLElement>('[data-chat-trigger]');
          if (chatTrigger) {
            chatTrigger.click();
          } else {
            // Chat is already open — scroll it into view
            const chatPanel = document.querySelector('[data-chat-panel]');
            if (chatPanel) chatPanel.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-b-xl text-sm font-medium transition-colors"
        style={{ background: "#141720", borderTop: "1px solid #2A2D37", color: "#9CA3AF" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#E07B39"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#9CA3AF"; }}
      >
        <MessageCircle className="h-4 w-4" />
        Prefer to talk it through? Chat with our advisor
      </button>
    </div>
  );
}
