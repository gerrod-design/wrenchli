import { Users, ListChecks, Sparkles } from "lucide-react";

interface ConfidenceBuilderProps {
  successRate: number;
  estimatedSteps: number;
  confidenceMessage: string;
}

export default function ConfidenceBuilder({ successRate, estimatedSteps, confidenceMessage }: ConfidenceBuilderProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-wrenchli-teal" />
          <span className="text-xs font-bold text-foreground">{successRate}% success rate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5 text-wrenchli-teal" />
          <span className="text-xs font-bold text-foreground">{estimatedSteps} steps</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-wrenchli-teal shrink-0" />
        <p className="text-[11px] text-muted-foreground italic">{confidenceMessage}</p>
      </div>
    </div>
  );
}
