import { useState, useRef } from "react";
import { toast } from "sonner";
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

/* ── MSRP database — Make-Model-Year (base trim) ── */
const MSRP_DATABASE: Record<string, number> = {
  // Honda
  "Honda-Accord-2024": 27295, "Honda-Accord-2023": 26120, "Honda-Accord-2022": 25100, "Honda-Accord-2021": 24970, "Honda-Accord-2020": 24020, "Honda-Accord-2019": 24020,
  "Honda-Civic-2024": 25050, "Honda-Civic-2023": 24100, "Honda-Civic-2022": 23100, "Honda-Civic-2021": 22550, "Honda-Civic-2020": 21250, "Honda-Civic-2019": 20345,
  "Honda-CR-V-2024": 33200, "Honda-CR-V-2023": 32350, "Honda-CR-V-2022": 31100, "Honda-CR-V-2021": 30100, "Honda-CR-V-2020": 28945, "Honda-CR-V-2019": 25350,
  // Toyota
  "Toyota-Camry-2024": 26320, "Toyota-Camry-2023": 25295, "Toyota-Camry-2022": 24425, "Toyota-Camry-2021": 24970, "Toyota-Camry-2020": 24095, "Toyota-Camry-2019": 24095,
  "Toyota-Corolla-2024": 24255, "Toyota-Corolla-2023": 23195, "Toyota-Corolla-2022": 22195, "Toyota-Corolla-2021": 21550, "Toyota-Corolla-2020": 20430, "Toyota-Corolla-2019": 19600,
  "Toyota-RAV4-2024": 31080, "Toyota-RAV4-2023": 29825, "Toyota-RAV4-2022": 28500, "Toyota-RAV4-2021": 27325, "Toyota-RAV4-2020": 26350, "Toyota-RAV4-2019": 26545,
  // Ford
  "Ford-F-150-2024": 37240, "Ford-F-150-2023": 35290, "Ford-F-150-2022": 33695, "Ford-F-150-2021": 31895, "Ford-F-150-2020": 28745, "Ford-F-150-2019": 28155,
  "Ford-Escape-2024": 27170, "Ford-Escape-2023": 26080, "Ford-Escape-2022": 25200, "Ford-Escape-2021": 24885, "Ford-Escape-2020": 24885, "Ford-Escape-2019": 25200,
  "Ford-Explorer-2024": 36760, "Ford-Explorer-2023": 35650, "Ford-Explorer-2022": 33245, "Ford-Explorer-2021": 32765, "Ford-Explorer-2020": 32765,
  // Chevrolet
  "Chevrolet-Silverado-2024": 36200, "Chevrolet-Silverado-2023": 34600, "Chevrolet-Silverado-2022": 32220, "Chevrolet-Silverado-2021": 30400, "Chevrolet-Silverado-2020": 28300,
  "Chevrolet-Equinox-2024": 27200, "Chevrolet-Equinox-2023": 26600, "Chevrolet-Equinox-2022": 25800, "Chevrolet-Equinox-2021": 24995, "Chevrolet-Equinox-2020": 23800,
  "Chevrolet-Malibu-2024": 25100, "Chevrolet-Malibu-2023": 24200, "Chevrolet-Malibu-2022": 23220, "Chevrolet-Malibu-2021": 22270, "Chevrolet-Malibu-2020": 22140,
  // Nissan
  "Nissan-Altima-2024": 25080, "Nissan-Altima-2023": 24300, "Nissan-Altima-2022": 23550, "Nissan-Altima-2021": 24400, "Nissan-Altima-2020": 24200, "Nissan-Altima-2019": 24100,
  "Nissan-Rogue-2024": 27360, "Nissan-Rogue-2023": 26745, "Nissan-Rogue-2022": 25850, "Nissan-Rogue-2021": 25650, "Nissan-Rogue-2020": 25300, "Nissan-Rogue-2019": 26260,
  "Nissan-Sentra-2024": 20680, "Nissan-Sentra-2023": 19460, "Nissan-Sentra-2022": 18940, "Nissan-Sentra-2021": 19090, "Nissan-Sentra-2020": 17990,
  // Hyundai
  "Hyundai-Elantra-2024": 22750, "Hyundai-Elantra-2023": 21600, "Hyundai-Elantra-2022": 20350, "Hyundai-Elantra-2021": 19650, "Hyundai-Elantra-2020": 19300, "Hyundai-Elantra-2019": 17985,
  "Hyundai-Tucson-2024": 27700, "Hyundai-Tucson-2023": 26400, "Hyundai-Tucson-2022": 25350, "Hyundai-Tucson-2021": 24950, "Hyundai-Tucson-2020": 23700, "Hyundai-Tucson-2019": 23550,
  "Hyundai-Santa Fe-2024": 33900, "Hyundai-Santa Fe-2023": 32200, "Hyundai-Santa Fe-2022": 30800, "Hyundai-Santa Fe-2021": 28200, "Hyundai-Santa Fe-2020": 26900,
  // Kia
  "Kia-Forte-2024": 19490, "Kia-Forte-2023": 18890, "Kia-Forte-2022": 17890, "Kia-Forte-2021": 17790, "Kia-Forte-2020": 17890, "Kia-Forte-2019": 17690,
  "Kia-Sorento-2024": 31990, "Kia-Sorento-2023": 30990, "Kia-Sorento-2022": 29990, "Kia-Sorento-2021": 29590, "Kia-Sorento-2020": 27060, "Kia-Sorento-2019": 26290,
  // Subaru
  "Subaru-Outback-2024": 30090, "Subaru-Outback-2023": 29295, "Subaru-Outback-2022": 28070, "Subaru-Outback-2021": 27655, "Subaru-Outback-2020": 27655, "Subaru-Outback-2019": 26795,
  // Mazda
  "Mazda-CX-5-2024": 28250, "Mazda-CX-5-2023": 26700, "Mazda-CX-5-2022": 26100, "Mazda-CX-5-2021": 25370, "Mazda-CX-5-2020": 25190, "Mazda-CX-5-2019": 25345,
  // Jeep
  "Jeep-Grand Cherokee-2024": 38995, "Jeep-Grand Cherokee-2023": 37545, "Jeep-Grand Cherokee-2022": 36290, "Jeep-Grand Cherokee-2021": 33090, "Jeep-Grand Cherokee-2020": 33090, "Jeep-Grand Cherokee-2019": 32195,
  // BMW
  "BMW-3 Series-2024": 43800, "BMW-3 Series-2023": 43000, "BMW-3 Series-2022": 41450, "BMW-3 Series-2021": 41250, "BMW-3 Series-2020": 41250, "BMW-3 Series-2019": 40250,
  // Mercedes-Benz
  "Mercedes-Benz-C-Class-2024": 44600, "Mercedes-Benz-C-Class-2023": 43550, "Mercedes-Benz-C-Class-2022": 43050, "Mercedes-Benz-C-Class-2021": 42650, "Mercedes-Benz-C-Class-2020": 42650, "Mercedes-Benz-C-Class-2019": 41400,
  // Tesla
  "Tesla-Model 3-2024": 38990, "Tesla-Model 3-2023": 40240, "Tesla-Model 3-2022": 46990, "Tesla-Model 3-2021": 37990, "Tesla-Model 3-2020": 37990, "Tesla-Model 3-2019": 35000,
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

/* ── Brand reliability tiers ── */
const RELIABLE_BRANDS = ["Honda", "Toyota", "Mazda", "Subaru"];
const LESS_RELIABLE_BRANDS = ["BMW", "Mercedes-Benz", "Audi", "Jaguar", "Land Rover"];

/* ── Trim-level MSRP multipliers ── */
/* When a trim is a premium/performance variant, multiply the base MSRP */
const TRIM_MULTIPLIERS: Record<string, number> = {
  // Jeep Grand Cherokee trims
  "summit": 1.55, "summit 4xe": 1.70, "summit reserve": 1.65, "overland": 1.30,
  "limited": 1.20, "trailhawk": 1.25, "l limited": 1.25, "l overland": 1.35,
  // Toyota
  "trd pro": 1.40, "trd off-road": 1.15, "platinum": 1.35, "xle": 1.10,
  // Honda
  "touring": 1.20, "sport touring": 1.25, "ex-l": 1.15, "sport": 1.08,
  // Ford
  "king ranch": 1.45, "lariat": 1.30, "xlt": 1.10,
  // Chevrolet
  "high country": 1.50, "ltz": 1.25, "rst": 1.15, "lt": 1.08,
  // BMW
  "m sport": 1.15, "m": 1.60, "competition": 1.70,
  // Generic luxury/performance
  "denali": 1.40, "srt": 1.50, "hellcat": 1.80, "gt": 1.20,
};

function getTrimMultiplier(trim?: string): number {
  if (!trim) return 1.0;
  const normalized = trim.toLowerCase().trim();
  // Try exact match first
  if (TRIM_MULTIPLIERS[normalized]) return TRIM_MULTIPLIERS[normalized];
  // Try partial match (e.g. "Summit 4XE" contains "summit 4xe")
  for (const [key, mult] of Object.entries(TRIM_MULTIPLIERS)) {
    if (normalized.includes(key) || key.includes(normalized)) return mult;
  }
  return 1.0;
}

function estimateMSRP(make: string, model: string, year: number, trim?: string): number {
  // Try exact make-model-year lookup
  const key = `${make}-${model}-${year}`;
  const baseMSRP = MSRP_DATABASE[key];
  
  if (baseMSRP) {
    // Apply trim multiplier to the base MSRP
    return Math.round(baseMSRP * getTrimMultiplier(trim));
  }

  // Try trim-level key (legacy compat)
  if (trim) {
    const trimKey = `${key}-${trim}`;
    if (MSRP_DATABASE[trimKey]) return MSRP_DATABASE[trimKey];
  }

  // Fall back to brand average with trim multiplier
  const base = BRAND_AVERAGES[make] ?? 30000;
  const yearAdj = (year - 2020) * 1000;
  return Math.max(Math.round((base + yearAdj) * getTrimMultiplier(trim)), 15000);
}

/* ── Value estimator ── */
function estimateValue(make: string, model: string, year: number, mileage: number, trim?: string): ValueEstimate {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const baseMSRP = estimateMSRP(make, model, year, trim);

  // Realistic depreciation curve (industry-standard declining rate)
  // Year 1: ~20%, Year 2: ~10%, Year 3: ~8%, Years 4-7: ~6%/yr, 8+: ~4%/yr
  let depRate = 0;
  if (age >= 1) depRate += 0.20;
  if (age >= 2) depRate += 0.10;
  if (age >= 3) depRate += 0.08;
  if (age >= 4) depRate += Math.min(age - 3, 4) * 0.06; // years 4-7
  if (age > 7) depRate += Math.min(age - 7, 8) * 0.04;  // years 8-15
  const ageDepreciation = baseMSRP * Math.min(depRate, 0.82);

  // Mileage adjustment — only penalize excess miles, not below-average
  const expectedMileage = Math.max(age, 1) * 12000;
  const excessMiles = mileage - expectedMileage;
  // $0.08/mile for excess (gentler), $0.04/mile credit for low mileage
  const mileageAdjustment = excessMiles > 0 ? excessMiles * 0.08 : excessMiles * 0.04;

  // Regional adjustment (slight below-average)
  const regionalAdjustment = baseMSRP * 0.01;

  const estimatedValue = Math.max(
    Math.round(baseMSRP - ageDepreciation - mileageAdjustment - regionalAdjustment),
    1500,
  );

  return {
    estimatedValue,
    confidence: 82,
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
  make?: string,
): RecommendationLevel {
  const costRatio = repairCost / value;

  let threshold = 0.20;
  if (vehicleAge <= 3) threshold = 0.25;
  if (vehicleAge >= 9) threshold = 0.15;
  if (mileage > 100000) threshold = 0.12;
  if (vehicleAge >= 12) threshold = 0.10;

  // Brand reliability adjustments
  if (make && RELIABLE_BRANDS.includes(make)) threshold += 0.03;
  if (make && LESS_RELIABLE_BRANDS.includes(make) && vehicleAge > 7) threshold -= 0.03;

  if (costRatio < threshold * 0.6) {
    return {
      type: "repair_only",
      message: "Smart Investment — Repair Recommended",
      reasoning: `This repair costs only ${(costRatio * 100).toFixed(1)}% of your vehicle's estimated value. It's a financially sound investment that should give you reliable transportation.`,
      costRatio,
      threshold,
    };
  }
  if (costRatio < threshold) {
    return {
      type: "repair_with_note",
      message: "Reasonable Repair Cost",
      reasoning: `At ${(costRatio * 100).toFixed(1)}% of your vehicle's value, this repair is still reasonable. Consider your long-term plans and how much longer you want to keep this vehicle.`,
      costRatio,
      threshold,
    };
  }
  if (costRatio < threshold * 1.5) {
    return {
      type: "repair_and_replace",
      message: "Consider All Your Options",
      reasoning: `This repair costs ${(costRatio * 100).toFixed(1)}% of your vehicle's estimated value. You should compare the cost of repair against the benefits of upgrading to a newer vehicle.`,
      costRatio,
      threshold,
    };
  }
  return {
    type: "replace_emphasis",
    message: "Replacement Likely More Economical",
    reasoning: `At ${(costRatio * 100).toFixed(1)}% of your vehicle's value, this repair is quite expensive. A newer vehicle would likely offer better long-term value and reliability.`,
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
  const browseRef = useRef<HTMLDivElement>(null);

  const yearNum = parseInt(vehicleYear, 10);
  const vehicleLabel = [vehicleYear, vehicleMake, vehicleModel, vehicleTrim].filter(Boolean).join(" ");
  const avgRepairCost = Math.round((repairCostLow + repairCostHigh) / 2);
  const hasRepairContext = avgRepairCost > 0;

  const handleAnalyze = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const miles = parseInt(mileage.replace(/\D/g, ""), 10);
    if (!miles || miles < 0) return;

    setLoading(true);
    // Small delay for perceived thoroughness
    await new Promise((r) => setTimeout(r, 600));

    const est = estimateValue(vehicleMake, vehicleModel, yearNum, miles, vehicleTrim);
    const age = new Date().getFullYear() - yearNum;
    const rec = calculateRecommendation(avgRepairCost, est.estimatedValue, age, miles, vehicleMake);

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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleAnalyze();
              }
            }}
          />
        </div>
        <Button
          type="button"
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
      {result && (
        <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {/* Recommendation banner — only show when there's a repair to compare against */}
          {hasRepairContext && styles && Icon && (
            <div className={cn("rounded-xl border p-4 space-y-2", styles.border, styles.bg)}>
              <div className="flex items-center gap-2">
                <Icon className={cn("h-5 w-5 shrink-0", styles.text)} />
                <span className="font-heading text-base font-bold">{result.rec.message}</span>
              </div>
              <p className="text-sm text-muted-foreground">{result.rec.reasoning}</p>
            </div>
          )}

          {/* Value breakdown */}
          <div className={cn("grid gap-3", hasRepairContext ? "sm:grid-cols-2" : "")}>
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground">Estimated Vehicle Value</p>
              <p className="font-heading text-2xl font-bold text-foreground">
                {fmt(result.estimate.estimatedValue)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {result.estimate.confidence}% confidence
              </p>
            </div>
            {hasRepairContext && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">Repair-to-Value Ratio</p>
                <p className={cn("font-heading text-2xl font-bold", styles?.text)}>
                  {(result.rec.costRatio * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {fmt(avgRepairCost)} repair on {fmt(result.estimate.estimatedValue)} vehicle
                </p>
              </div>
            )}
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
          {hasRepairContext && ["repair_and_replace", "replace_emphasis"].includes(result.rec.type) && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground flex items-start gap-2">
              <TrendingDown className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                Use the <strong className="text-foreground">Repair vs. Replace</strong> comparison below to run a full 3-year cost-of-ownership analysis.
              </span>
            </div>
          )}

          {/* Override: let repair-recommended users still browse vehicles */}
          {hasRepairContext && ["repair_only", "repair_with_note"].includes(result.rec.type) && (
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRecommendation?.({ ...result.rec, type: "repair_and_replace" });
                  toast.success("Vehicle listings unlocked — scroll down to browse!");
                  // Scroll the replacement section into view
                  setTimeout(() => {
                    const section = document.getElementById("vehicle-replacement-section");
                    if (section) {
                      section.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }, 200);
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
