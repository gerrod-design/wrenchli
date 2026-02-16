import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Car, Calculator, Loader2, CheckCircle, Info, AlertTriangle,
  TrendingDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ── */
export interface RecommendationLevel {
  type: "repair_only" | "repair_with_note" | "repair_and_replace" | "replace_emphasis";
  message: string;
  reasoning: string;
  costRatio: number;
  threshold: number;
}

interface ValueEstimate {
  estimatedValue: number;
  confidence: number;
  breakdown: {
    baseMSRP: number;
    ageDepreciation: number;
    mileageAdjustment: number;
    regionalAdjustment: number;
  };
}

interface Props {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim?: string;
  repairCostLow: number;
  repairCostHigh: number;
  onRecommendation?: (rec: RecommendationLevel) => void;
}

/* ── Trim-level MSRP database ── */
const MSRP_DATABASE: Record<string, number> = {
  "Honda-Accord-2019-LX": 24020, "Honda-Accord-2020-LX": 24970,
  "Honda-Accord-2021-LX": 25470, "Honda-Accord-2022-LX": 27615,
  "Honda-Civic-2019-LX": 20345, "Honda-Civic-2020-LX": 21050,
  "Honda-Civic-2021-LX": 21700, "Honda-Civic-2022-LX": 22550,
  "Honda-CR-V-2019-LX": 25350, "Honda-CR-V-2020-LX": 25850,
  "Toyota-Camry-2019-LE": 24095, "Toyota-Camry-2020-LE": 24425,
  "Toyota-Camry-2021-LE": 25045, "Toyota-Camry-2022-LE": 25945,
  "Toyota-Corolla-2019-LE": 19600, "Toyota-Corolla-2020-LE": 20025,
  "Toyota-RAV4-2019-LE": 26545, "Toyota-RAV4-2020-LE": 26950,
  "Ford-F-150-2019-XL": 28155, "Ford-F-150-2020-XL": 28940,
  "Ford-F-150-2021-XL": 29290, "Ford-F-150-2022-XL": 30165,
  "Ford-Escape-2019-S": 25200, "Ford-Escape-2020-S": 25980,
  "Chevrolet-Silverado 1500-2019-WT": 29795, "Chevrolet-Silverado 1500-2020-WT": 29300,
  "Chevrolet-Equinox-2019-L": 24995, "Chevrolet-Equinox-2020-L": 25800,
  "Nissan-Altima-2019-S": 24100, "Nissan-Altima-2020-S": 24300,
  "Nissan-Rogue-2019-S": 26260, "Nissan-Rogue-2020-S": 26750,
  "Hyundai-Elantra-2019-SE": 17985, "Hyundai-Elantra-2020-SE": 19650,
  "Hyundai-Tucson-2019-SE": 23550, "Hyundai-Tucson-2020-SE": 23550,
  "Kia-Forte-2019-FE": 17690, "Kia-Forte-2020-FE": 17890,
  "Kia-Sorento-2019-L": 26290, "Kia-Sorento-2020-L": 27060,
  "Subaru-Outback-2019-2.5i": 26795, "Subaru-Outback-2020-Base": 27655,
  "Mazda-CX-5-2019-Sport": 25345, "Mazda-CX-5-2020-Sport": 25190,
  "Jeep-Grand Cherokee-2019-Laredo": 32195, "Jeep-Grand Cherokee-2020-Laredo": 33090,
  "BMW-3 Series-2019-330i": 40250, "BMW-3 Series-2020-330i": 41250,
  "Mercedes-Benz-C-Class-2019-C 300": 41400, "Mercedes-Benz-C-Class-2020-C 300": 42650,
  "Tesla-Model 3-2019-Standard Range Plus": 35000, "Tesla-Model 3-2020-Standard Range Plus": 37990,
};

/* ── Brand-average fallback ── */
const BRAND_AVERAGES: Record<string, number> = {
  Honda: 28000, Toyota: 29000, Ford: 32000, Chevrolet: 31000,
  BMW: 45000, Mercedes: 52000, "Mercedes-Benz": 52000, Audi: 48000,
  Nissan: 26000, Hyundai: 24000, Kia: 23000, Subaru: 29000,
  Mazda: 27000, Volkswagen: 30000, Jeep: 34000, Ram: 36000,
  GMC: 38000, Dodge: 30000, Lexus: 42000, Acura: 37000,
  Infiniti: 40000, Buick: 32000, Cadillac: 46000, Lincoln: 48000,
  Volvo: 42000, Tesla: 45000, Chrysler: 30000,
};

function estimateMSRP(make: string, model: string, year: number, trim?: string): number {
  // Try trim-level lookup first
  if (trim) {
    const trimKey = `${make}-${model}-${year}-${trim}`;
    if (MSRP_DATABASE[trimKey]) return MSRP_DATABASE[trimKey];
  }
  // Try without trim (first matching entry for make-model-year)
  const prefix = `${make}-${model}-${year}-`;
  const match = Object.keys(MSRP_DATABASE).find((k) => k.startsWith(prefix));
  if (match) return MSRP_DATABASE[match];

  // Fall back to brand average
  const base = BRAND_AVERAGES[make] ?? 30000;
  const yearAdj = (year - 2020) * 1000;
  return Math.max(base + yearAdj, 15000);
}

/* ── Value estimator ── */
function estimateValue(make: string, model: string, year: number, mileage: number, trim?: string): ValueEstimate {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const baseMSRP = estimateMSRP(make, model, year, trim);

  // Depreciation curve
  let depRate = 0;
  if (age >= 1) depRate += 0.20;
  if (age >= 2) depRate += 0.15;
  if (age >= 3) depRate += Math.min(age - 2, 5) * 0.10;
  if (age > 7) depRate += (age - 7) * 0.05;
  const ageDepreciation = baseMSRP * Math.min(depRate, 0.85);

  // Mileage adjustment ($0.15 per mile above/below expected 12k/yr)
  const expectedMileage = age * 12000;
  const mileageAdjustment = (mileage - expectedMileage) * 0.15;

  // Regional adjustment (slight below-average)
  const regionalAdjustment = baseMSRP * 0.02;

  const estimatedValue = Math.max(
    Math.round(baseMSRP - ageDepreciation - mileageAdjustment - regionalAdjustment),
    500,
  );

  return {
    estimatedValue,
    confidence: 85,
    breakdown: {
      baseMSRP: Math.round(baseMSRP),
      ageDepreciation: Math.round(ageDepreciation),
      mileageAdjustment: Math.round(mileageAdjustment),
      regionalAdjustment: Math.round(regionalAdjustment),
    },
  };
}

/* ── Recommendation engine ── */
function calculateRecommendation(
  repairCost: number,
  value: number,
  vehicleAge: number,
  mileage: number,
): RecommendationLevel {
  const costRatio = repairCost / value;

  let threshold = 0.20;
  if (vehicleAge <= 3) threshold = 0.25;
  if (vehicleAge >= 9) threshold = 0.15;
  if (mileage > 100000) threshold = 0.12;
  if (vehicleAge >= 12) threshold = 0.10;

  if (costRatio < threshold * 0.6) {
    return {
      type: "repair_only",
      message: "Smart Investment — Repair Recommended",
      reasoning: `This repair costs only ${(costRatio * 100).toFixed(1)}% of your vehicle's estimated value. It's a financially sound investment.`,
      costRatio,
      threshold,
    };
  }
  if (costRatio < threshold) {
    return {
      type: "repair_with_note",
      message: "Reasonable Repair Cost",
      reasoning: `At ${(costRatio * 100).toFixed(1)}% of vehicle value, this repair is still reasonable, but worth considering your long-term plans.`,
      costRatio,
      threshold,
    };
  }
  if (costRatio < threshold * 1.5) {
    return {
      type: "repair_and_replace",
      message: "Consider All Options",
      reasoning: `This repair costs ${(costRatio * 100).toFixed(1)}% of your vehicle's value. It's worth comparing repair vs. replacement to make the best financial decision.`,
      costRatio,
      threshold,
    };
  }
  return {
    type: "replace_emphasis",
    message: "Replacement May Be Wiser",
    reasoning: `At ${(costRatio * 100).toFixed(1)}% of vehicle value, this repair is relatively expensive. A different vehicle might offer better long-term value.`,
    costRatio,
    threshold,
  };
}

/* ── Helpers ── */
function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

const REC_STYLES: Record<RecommendationLevel["type"], { border: string; bg: string; text: string; badge: string }> = {
  repair_only: {
    border: "border-wrenchli-teal/40",
    bg: "bg-wrenchli-teal/5",
    text: "text-wrenchli-teal",
    badge: "bg-wrenchli-teal/15 text-wrenchli-teal",
  },
  repair_with_note: {
    border: "border-accent/40",
    bg: "bg-accent/5",
    text: "text-accent",
    badge: "bg-accent/15 text-accent",
  },
  repair_and_replace: {
    border: "border-wrenchli-amber/40",
    bg: "bg-wrenchli-amber/5",
    text: "text-wrenchli-amber",
    badge: "bg-wrenchli-amber/15 text-wrenchli-amber",
  },
  replace_emphasis: {
    border: "border-destructive/40",
    bg: "bg-destructive/5",
    text: "text-destructive",
    badge: "bg-destructive/15 text-destructive",
  },
};

const REC_ICON: Record<RecommendationLevel["type"], typeof CheckCircle> = {
  repair_only: CheckCircle,
  repair_with_note: Info,
  repair_and_replace: Calculator,
  replace_emphasis: AlertTriangle,
};

/* ── Component ── */
export default function VehicleValueAnalyzer({
  vehicleYear,
  vehicleMake,
  vehicleModel,
  vehicleTrim,
  repairCostLow,
  repairCostHigh,
  onRecommendation,
}: Props) {
  const [mileage, setMileage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ estimate: ValueEstimate; rec: RecommendationLevel } | null>(null);

  const yearNum = parseInt(vehicleYear, 10);
  const vehicleLabel = [vehicleYear, vehicleMake, vehicleModel, vehicleTrim].filter(Boolean).join(" ");
  const avgRepairCost = Math.round((repairCostLow + repairCostHigh) / 2);

  const handleAnalyze = async () => {
    const miles = parseInt(mileage.replace(/\D/g, ""), 10);
    if (!miles || miles < 0) return;

    setLoading(true);
    // Small delay for perceived thoroughness
    await new Promise((r) => setTimeout(r, 600));

    const est = estimateValue(vehicleMake, vehicleModel, yearNum, miles, vehicleTrim);
    const age = new Date().getFullYear() - yearNum;
    const rec = calculateRecommendation(avgRepairCost, est.estimatedValue, age, miles);

    setResult({ estimate: est, rec });
    onRecommendation?.(rec);
    setLoading(false);
  };

  const styles = result ? REC_STYLES[result.rec.type] : null;
  const Icon = result ? REC_ICON[result.rec.type] : null;

  return (
    <div className="space-y-4">
      {/* Mileage input row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            <Car className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
            Current mileage on your {vehicleLabel}
          </label>
          <Input
            placeholder="e.g., 85000"
            value={mileage}
            onChange={(e) => setMileage(e.target.value.replace(/[^\d]/g, ""))}
            className="h-11"
            inputMode="numeric"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={loading || !mileage.trim()}
          className="h-11 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</>
          ) : (
            <><Calculator className="mr-2 h-4 w-4" /> Analyze Value</>
          )}
        </Button>
      </div>

      {/* Results */}
      {result && styles && Icon && (
        <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {/* Recommendation banner */}
          <div className={cn("rounded-xl border p-4 space-y-2", styles.border, styles.bg)}>
            <div className="flex items-center gap-2">
              <Icon className={cn("h-5 w-5 shrink-0", styles.text)} />
              <span className="font-heading text-base font-bold">{result.rec.message}</span>
            </div>
            <p className="text-sm text-muted-foreground">{result.rec.reasoning}</p>
          </div>

          {/* Value breakdown */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground">Estimated Vehicle Value</p>
              <p className="font-heading text-2xl font-bold text-foreground">
                {fmt(result.estimate.estimatedValue)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {result.estimate.confidence}% confidence
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground">Repair-to-Value Ratio</p>
              <p className={cn("font-heading text-2xl font-bold", styles.text)}>
                {(result.rec.costRatio * 100).toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground">
                {fmt(avgRepairCost)} repair on {fmt(result.estimate.estimatedValue)} vehicle
              </p>
            </div>
          </div>

          {/* Value breakdown details */}
          <details className="group text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              Value breakdown
            </summary>
            <div className="mt-2 rounded-lg bg-muted/30 p-3 space-y-1.5">
              <Row label="Est. original MSRP" value={fmt(result.estimate.breakdown.baseMSRP)} />
              <Row label="Age depreciation" value={`-${fmt(result.estimate.breakdown.ageDepreciation)}`} negative />
              <Row
                label="Mileage adjustment"
                value={`${result.estimate.breakdown.mileageAdjustment > 0 ? "-" : "+"}${fmt(Math.abs(result.estimate.breakdown.mileageAdjustment))}`}
                negative={result.estimate.breakdown.mileageAdjustment > 0}
              />
              <Row label="Regional adjustment" value={`-${fmt(result.estimate.breakdown.regionalAdjustment)}`} negative />
            </div>
          </details>

          {/* Nudge toward TCO tool when replacement is worth considering */}
          {["repair_and_replace", "replace_emphasis"].includes(result.rec.type) && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground flex items-start gap-2">
              <TrendingDown className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                Use the <strong className="text-foreground">Repair vs. Replace</strong> comparison below to run a full 3-year cost-of-ownership analysis.
              </span>
            </div>
          )}

          {/* Override: let repair-recommended users still browse vehicles */}
          {["repair_only", "repair_with_note"].includes(result.rec.type) && (
            <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Want to explore vehicles anyway?</p>
                <p className="text-xs text-muted-foreground">
                  Sometimes it's worth seeing what's available, regardless of the math.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  onRecommendation?.({ ...result.rec, type: "repair_and_replace" });
                }}
              >
                <Car className="mr-1.5 h-3.5 w-3.5" />
                Browse Vehicles
              </Button>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground text-center italic">
            This is an estimate based on general depreciation curves and brand averages. Actual market value may vary.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", negative ? "text-destructive" : "text-wrenchli-teal")}>{value}</span>
    </div>
  );
}
