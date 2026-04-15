import { DollarSign } from "lucide-react";
import type { PreliminaryCostRange } from "@/data/preliminaryCostRanges";

interface Props {
  range: PreliminaryCostRange;
}

export default function PreliminaryCostCard({ range }: Props) {
  return (
    <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4 text-center max-w-sm mx-auto">
      <div className="flex items-center justify-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Estimated range while we assess your symptoms
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground">
        ${range.low} – ${range.high}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        typical {range.category.toLowerCase()} repair range
      </p>
      <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
        Final cost range is in your full assessment results. Ranges vary by vehicle year and local market.
      </p>
    </div>
  );
}
