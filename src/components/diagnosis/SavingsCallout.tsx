import { DollarSign, TrendingDown, ArrowRight } from "lucide-react";

interface SavingsCalloutProps {
  diyCost: string;
  shopCost: string;
}

/** Parse "$150 - $300" → average number */
function parseCostAvg(cost: string): number | null {
  const nums = cost.match(/[\d,]+/g);
  if (!nums || nums.length === 0) return null;
  const parsed = nums.map((n) => parseFloat(n.replace(/,/g, "")));
  return parsed.reduce((a, b) => a + b, 0) / parsed.length;
}

export default function SavingsCallout({ diyCost, shopCost }: SavingsCalloutProps) {
  const diyAvg = parseCostAvg(diyCost);
  const shopAvg = parseCostAvg(shopCost);

  if (!diyAvg || !shopAvg || shopAvg <= diyAvg) return null;

  const savings = Math.round(shopAvg - diyAvg);
  const pct = Math.round(((shopAvg - diyAvg) / shopAvg) * 100);

  return (
    <div className="rounded-lg border border-wrenchli-green/30 bg-wrenchli-green/5 p-3 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wrenchli-green/15">
        <TrendingDown className="h-4 w-4 text-wrenchli-green" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">
          Save ~${savings.toLocaleString()} by doing it yourself
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="line-through">{shopCost} (shop)</span>
          <ArrowRight className="inline h-3 w-3 mx-1" />
          <span className="font-semibold text-wrenchli-green">{diyCost} (DIY parts only)</span>
          <span className="ml-1.5 font-bold text-wrenchli-green">— {pct}% less</span>
        </p>
      </div>
    </div>
  );
}
