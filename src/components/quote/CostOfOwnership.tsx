import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown, Scale, Loader2, AlertCircle, TrendingDown, TrendingUp,
  DollarSign, Car, Wrench, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COMPARE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-ownership`;

interface TCOOption {
  upfront_cost: number;
  monthly_payment: number;
  annual_insurance: number;
  annual_depreciation: number;
  maintenance_3yr: number;
  total_3yr: number;
}

interface TCOResult {
  repair_option: TCOOption;
  replace_option: TCOOption;
  recommendation: string;
  assumptions: string[];
  savings_amount: number;
  better_option: "repair" | "replace";
}

interface CostOfOwnershipProps {
  currentVehicle: string;
  repairCostLow: number;
  repairCostHigh: number;
  zipCode: string;
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

export default function CostOfOwnership({
  currentVehicle,
  repairCostLow,
  repairCostHigh,
  zipCode,
}: CostOfOwnershipProps) {
  const [expanded, setExpanded] = useState(false);
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [price, setPrice] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TCOResult | null>(null);

  const handleCompare = async () => {
    if (!price.trim()) {
      toast.error("Please enter an approximate purchase price.");
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch(COMPARE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          current_vehicle: currentVehicle,
          repair_cost_low: repairCostLow,
          repair_cost_high: repairCostHigh,
          replacement_year: year,
          replacement_make: make,
          replacement_model: model,
          replacement_price: price.replace(/\D/g, ""),
          replacement_url: listingUrl,
          zip_code: zipCode,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Comparison failed");
      }

      const data: TCOResult = await resp.json();
      setResult(data);
    } catch (e) {
      console.error("TCO error:", e);
      toast.error(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-5 md:p-6 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 shrink-0">
          <Scale className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-bold">Repair vs. Replace — Cost of Ownership</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare the cost of repairing your vehicle to buying a different one
          </p>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0", expanded && "rotate-180")} />
      </button>

      <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}>
        <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-5 border-t border-border pt-5">
          {!result ? (
            <>
              {/* Input form */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter details about a vehicle you're considering purchasing. We'll use AI to compare the 3-year total cost of ownership.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    placeholder="Year (e.g., 2023)"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="h-11"
                    maxLength={4}
                    inputMode="numeric"
                  />
                  <Input
                    placeholder="Make (e.g., Toyota)"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder="Model (e.g., Camry)"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-11"
                  />
                </div>

                <Input
                  placeholder="Approximate purchase price *"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11"
                  inputMode="numeric"
                />

                <div className="relative">
                  <Input
                    placeholder="Link to listing (AutoTrader, Cars.com, etc.) — optional"
                    value={listingUrl}
                    onChange={(e) => setListingUrl(e.target.value)}
                    className="h-11 pr-9"
                    type="url"
                  />
                  <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                <Button
                  onClick={handleCompare}
                  disabled={isLoading || !price.trim()}
                  className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Comparing...
                    </>
                  ) : (
                    <>
                      <Scale className="mr-2 h-4 w-4" /> Compare Cost of Ownership
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-5">
                {/* Verdict banner */}
                <div
                  className={cn(
                    "rounded-xl p-4 text-center space-y-1",
                    result.better_option === "repair"
                      ? "bg-wrenchli-teal/10 border border-wrenchli-teal/30"
                      : "bg-accent/10 border border-accent/30"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    {result.better_option === "repair" ? (
                      <Wrench className="h-5 w-5 text-wrenchli-teal" />
                    ) : (
                      <Car className="h-5 w-5 text-accent" />
                    )}
                    <span className="font-heading text-lg font-bold">
                      {result.better_option === "repair" ? "Repairing is cheaper" : "Replacing may be cheaper"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You could save approximately <strong className="text-foreground">{fmt(result.savings_amount)}</strong> over 3 years by{" "}
                    {result.better_option === "repair" ? "repairing" : "replacing"} your vehicle.
                  </p>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ComparisonCard
                    title="🔧 Repair & Keep"
                    subtitle={currentVehicle}
                    option={result.repair_option}
                    highlighted={result.better_option === "repair"}
                    highlightColor="wrenchli-teal"
                  />
                  <ComparisonCard
                    title="🚗 Buy Replacement"
                    subtitle={[year, make, model].filter(Boolean).join(" ") || "New vehicle"}
                    option={result.replace_option}
                    highlighted={result.better_option === "replace"}
                    highlightColor="accent"
                  />
                </div>

                {/* Recommendation */}
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Recommendation</h4>
                  <p className="text-sm">{result.recommendation}</p>
                </div>

                {/* Assumptions */}
                {result.assumptions.length > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Key Assumptions
                    </h4>
                    <ul className="space-y-0.5">
                      {result.assumptions.map((a, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-accent mt-0.5 shrink-0">•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground text-center italic">
                  This comparison is an AI-generated estimate for informational purposes only. Actual costs may vary significantly.
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setResult(null)}
                >
                  Compare a Different Vehicle
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({
  title,
  subtitle,
  option,
  highlighted,
  highlightColor,
}: {
  title: string;
  subtitle: string;
  option: TCOOption;
  highlighted: boolean;
  highlightColor: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3",
        highlighted
          ? highlightColor === "wrenchli-teal"
            ? "border-wrenchli-teal/40 bg-wrenchli-teal/5"
            : "border-accent/40 bg-accent/5"
          : "border-border bg-muted/20"
      )}
    >
      <div>
        <h4 className="font-heading text-sm font-bold">{title}</h4>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        {highlighted && (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold mt-1.5",
            highlightColor === "wrenchli-teal"
              ? "bg-wrenchli-teal/15 text-wrenchli-teal"
              : "bg-accent/15 text-accent"
          )}>
            <TrendingDown className="h-3 w-3" /> Better Value
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs">
        <Row label="Upfront cost" value={fmt(option.upfront_cost)} />
        <Row label="Monthly payment" value={option.monthly_payment > 0 ? `${fmt(option.monthly_payment)}/mo` : "—"} />
        <Row label="Annual insurance" value={`${fmt(option.annual_insurance)}/yr`} />
        <Row label="Annual depreciation" value={`${fmt(option.annual_depreciation)}/yr`} />
        <Row label="Maintenance (3yr)" value={fmt(option.maintenance_3yr)} />
        <div className="h-px bg-border my-1" />
        <div className="flex justify-between font-bold text-sm">
          <span>3-Year Total</span>
          <span>{fmt(option.total_3yr)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
