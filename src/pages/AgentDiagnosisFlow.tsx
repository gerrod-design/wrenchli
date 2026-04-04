import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import SymptomInput from "@/components/agent/SymptomInput";
import DiagnosisCardAgent from "@/components/agent/DiagnosisCardAgent";
import ShopSelection from "@/components/agent/ShopSelection";
import PriceApprovalStep from "@/components/agent/PriceApprovalStep";
import BookingConfirmation from "@/components/agent/BookingConfirmation";
import OutcomeCapture from "@/components/agent/OutcomeCapture";
import type { AgentDiagnosis, RankedShop, PriceApproval, FlowStep } from "@/components/agent/types";

const AGENT_DIAGNOSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-diagnose`;
const AGENT_RANK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-rank-shops`;

export default function AgentDiagnosisFlow() {
  const [step, setStep] = useState<FlowStep>("symptoms");
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState({ year: "", make: "", model: "", zipCode: "" });
  const [diagnosis, setDiagnosis] = useState<AgentDiagnosis | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("");
  const [shops, setShops] = useState<RankedShop[]>([]);
  const [marketAvgCost, setMarketAvgCost] = useState<number | null>(null);
  const [selectedShop, setSelectedShop] = useState<RankedShop | null>(null);
  const [priceData, setPriceData] = useState<PriceApproval | null>(null);

  // Step 1: Run diagnosis
  const handleSymptomSubmit = useCallback(async (data: { symptoms: string; year: string; make: string; model: string; zipCode: string }) => {
    setIsLoading(true);
    setVehicleInfo({ year: data.year, make: data.make, model: data.model, zipCode: data.zipCode });

    try {
      const resp = await fetch(AGENT_DIAGNOSE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          symptoms: data.symptoms,
          year: data.year,
          make: data.make,
          model: data.model,
          zip_code: data.zipCode,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Diagnosis failed");
      }

      const result: AgentDiagnosis = await resp.json();
      setDiagnosis(result);
      setStep("diagnosis");
    } catch (e) {
      console.error("Diagnosis error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to get diagnosis");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 2: Approve diagnosis → fetch shops
  const handleDiagnosisApprove = useCallback(async (selected: string) => {
    setSelectedDiagnosis(selected);
    setIsLoading(true);

    try {
      const resp = await fetch(AGENT_RANK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          zip_code: vehicleInfo.zipCode,
          diagnosis: selected,
          repair_type: diagnosis?.urgency,
          vehicle_make: vehicleInfo.make,
        }),
      });

      if (!resp.ok) throw new Error("Failed to fetch shops");

      const data = await resp.json();
      setShops(data.shops || []);
      setMarketAvgCost(data.marketAvgCost);
      setStep("shop_selection");
    } catch (e) {
      console.error("Shop fetch error:", e);
      toast.error("Failed to fetch nearby shops. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [vehicleInfo, diagnosis]);

  // Step 3: Select shop → build price data
  const handleShopSelect = useCallback((shop: RankedShop) => {
    setSelectedShop(shop);

    // Build price approval data
    const estimated = shop.metrics.avgCost || (diagnosis?.costEstimate
      ? Math.round((diagnosis.costEstimate.min + diagnosis.costEstimate.max) / 2)
      : 0);

    const variance = marketAvgCost && marketAvgCost > 0
      ? Math.round(((estimated - marketAvgCost) / marketAvgCost) * 100)
      : null;

    let fairnessLabel: PriceApproval["fairnessLabel"] = "FAIR";
    if (variance !== null) {
      if (variance < -5) fairnessLabel = "BELOW_MARKET";
      else if (variance > 20) fairnessLabel = "SIGNIFICANTLY_ABOVE";
      else if (variance > 10) fairnessLabel = "ABOVE_MARKET";
    }

    // Get price range from all shops
    const allCosts = shops
      .map(s => s.metrics.avgCost)
      .filter((c): c is number => c !== null);

    setPriceData({
      estimatedCost: estimated,
      breakdown: diagnosis?.costEstimate?.breakdown || "Contact shop for detailed breakdown",
      marketAverage: marketAvgCost,
      variancePercent: variance,
      lowestInArea: allCosts.length > 0 ? Math.min(...allCosts) : null,
      highestInArea: allCosts.length > 0 ? Math.max(...allCosts) : null,
      fairnessLabel,
    });

    setStep("price_approval");
  }, [diagnosis, marketAvgCost, shops]);

  // Step 4: Approve price → show booking
  const handlePriceApprove = useCallback(() => {
    setStep("booking");
  }, []);

  // Step 5: Navigate to outcome
  const handleViewOutcome = useCallback(() => {
    setStep("outcome");
  }, []);

  // Reset
  const handleDone = useCallback(() => {
    setStep("symptoms");
    setDiagnosis(null);
    setShops([]);
    setSelectedShop(null);
    setPriceData(null);
  }, []);

  // Progress indicator
  const steps: FlowStep[] = ["symptoms", "diagnosis", "shop_selection", "price_approval", "booking"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <>
      <SEO
        title="AI Vehicle Diagnosis | Wrenchli"
        description="Get a transparent, data-driven AI diagnosis for your vehicle. Full observability on every recommendation."
      />
      <main className="min-h-screen bg-secondary pt-8 pb-20 px-4">
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStepIndex ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === "symptoms" && (
              <SymptomInput onSubmit={handleSymptomSubmit} isLoading={isLoading} />
            )}

            {step === "diagnosis" && diagnosis && (
              <DiagnosisCardAgent
                diagnosis={diagnosis}
                onApprove={handleDiagnosisApprove}
                onRequestReview={() => toast.info("Specialist review is coming soon!")}
              />
            )}

            {step === "shop_selection" && (
              <ShopSelection
                shops={shops}
                marketAvgCost={marketAvgCost}
                diagnosis={selectedDiagnosis}
                onSelectShop={handleShopSelect}
                onBack={() => setStep("diagnosis")}
              />
            )}

            {step === "price_approval" && selectedShop && priceData && (
              <PriceApprovalStep
                shop={selectedShop}
                priceData={priceData}
                diagnosis={selectedDiagnosis}
                onApprove={handlePriceApprove}
                onGetSecondQuote={() => setStep("shop_selection")}
                onBack={() => setStep("shop_selection")}
              />
            )}

            {step === "booking" && selectedShop && priceData && diagnosis && (
              <BookingConfirmation
                shop={selectedShop}
                diagnosis={selectedDiagnosis}
                estimatedCost={priceData.estimatedCost}
                trackingNumber={diagnosis.trackingNumber || "—"}
                onDone={handleDone}
                onViewOutcome={handleViewOutcome}
              />
            )}

            {step === "outcome" && selectedShop && priceData && diagnosis && (
              <OutcomeCapture
                trackingNumber={diagnosis.trackingNumber || ""}
                originalDiagnosis={selectedDiagnosis}
                estimatedCost={priceData.estimatedCost}
                shopName={selectedShop.name}
                onDone={handleDone}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
