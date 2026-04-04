import { DollarSign, TrendingDown, TrendingUp, Minus, ChevronRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RankedShop, PriceApproval } from "./types";

interface PriceApprovalStepProps {
  shop: RankedShop;
  priceData: PriceApproval;
  diagnosis: string;
  onApprove: () => void;
  onGetSecondQuote: () => void;
  onBack: () => void;
}

const fairnessLabels = {
  BELOW_MARKET: { label: "Below Market", color: "text-accent", bg: "bg-accent/10", icon: TrendingDown },
  FAIR: { label: "Fair Price", color: "text-accent", bg: "bg-accent/10", icon: Minus },
  ABOVE_MARKET: { label: "Above Market", color: "text-amber-500", bg: "bg-amber-500/10", icon: TrendingUp },
  SIGNIFICANTLY_ABOVE: { label: "Significantly Above", color: "text-destructive", bg: "bg-destructive/10", icon: TrendingUp },
};

export default function PriceApprovalStep({ shop, priceData, diagnosis, onApprove, onGetSecondQuote, onBack }: PriceApprovalStepProps) {
  const fairness = fairnessLabels[priceData.fairnessLabel] || fairnessLabels.FAIR;
  const FairnessIcon = fairness.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
          <DollarSign className="h-4 w-4" />
          Step 4 of 5: Review Pricing
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground">
          Price Transparency
        </h2>
        <p className="text-muted-foreground mt-2">
          Review the estimated cost and market comparison before proceeding.
        </p>
      </div>

      <div className="space-y-4">
        {/* Main price card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Cost at</p>
              <p className="font-bold text-foreground">{shop.name}</p>
            </div>
            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium", fairness.bg, fairness.color)}>
              <FairnessIcon className="h-4 w-4" />
              {fairness.label}
            </div>
          </div>

          <div className="text-center py-4">
            <div className="text-5xl font-bold text-foreground">
              ${priceData.estimatedCost.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{diagnosis}</p>
          </div>

          {/* Breakdown */}
          <div className="bg-secondary/50 rounded-xl p-4 mt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Cost Breakdown</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{priceData.breakdown}</p>
          </div>
        </div>

        {/* Market comparison */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Market Comparison
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <span className="text-xs text-muted-foreground">This Shop</span>
              <div className="text-xl font-bold text-foreground">${priceData.estimatedCost.toLocaleString()}</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <span className="text-xs text-muted-foreground">Market Average</span>
              <div className="text-xl font-bold text-foreground">
                {priceData.marketAverage ? `$${priceData.marketAverage.toLocaleString()}` : "N/A"}
              </div>
            </div>
            {priceData.lowestInArea !== null && (
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground">Lowest in Area</span>
                <div className="text-lg font-bold text-foreground">${priceData.lowestInArea.toLocaleString()}</div>
              </div>
            )}
            {priceData.highestInArea !== null && (
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground">Highest in Area</span>
                <div className="text-lg font-bold text-foreground">${priceData.highestInArea.toLocaleString()}</div>
              </div>
            )}
          </div>
          {priceData.variancePercent !== null && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              {priceData.variancePercent >= 0 ? "+" : ""}{priceData.variancePercent}% vs. market average
            </p>
          )}
        </div>

        {/* Decision buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={onApprove}
            size="lg"
            className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Approve & Proceed to Booking
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button onClick={onGetSecondQuote} variant="outline" size="lg" className="w-full">
            Get Second Quote
          </Button>
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to shop selection
          </Button>
        </div>
      </div>
    </div>
  );
}
