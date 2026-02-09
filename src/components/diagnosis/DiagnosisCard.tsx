import { Video, ShoppingCart, Wrench, ArrowRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import UrgencyBadge from "./UrgencyBadge";
import type { Diagnosis } from "./types";
import { cn } from "@/lib/utils";

const diyConfig = {
  easy: { icon: CheckCircle, label: "Easy", desc: "Most people can do this", className: "text-wrenchli-green" },
  moderate: { icon: AlertTriangle, label: "Moderate", desc: "Some mechanical experience needed", className: "text-amber-500" },
  advanced: { icon: XCircle, label: "Advanced", desc: "Professional recommended", className: "text-destructive" },
} as const;

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  vehicle: string;
}

export default function DiagnosisCard({ diagnosis, vehicle }: DiagnosisCardProps) {
  const diy = diyConfig[diagnosis.diy_feasibility];
  const DiyIcon = diy.icon;
  const searchQuery = encodeURIComponent(`${diagnosis.title} ${vehicle} repair`);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 md:p-6 pb-0">
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-bold">{diagnosis.title}</h3>
          {diagnosis.code && (
            <span className="inline-flex items-center rounded-full bg-wrenchli-teal/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-wrenchli-teal">
              Code: {diagnosis.code}
            </span>
          )}
        </div>
        <UrgencyBadge urgency={diagnosis.urgency} />
      </div>

      {/* Body - 2x2 grid */}
      <div className="grid gap-4 p-5 md:p-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What's Happening</h4>
          <p className="text-sm leading-relaxed">{diagnosis.whats_happening}</p>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Common Causes</h4>
          <ul className="space-y-1">
            {diagnosis.common_causes.map((cause, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-wrenchli-teal mt-0.5 shrink-0">•</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DIY Feasibility</h4>
          <div className="flex items-center gap-2">
            <DiyIcon className={cn("h-4 w-4", diy.className)} />
            <span className={cn("text-sm font-semibold", diy.className)}>{diy.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{diy.desc}</p>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated Cost Range</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">DIY (parts only):</span>
              <span className="font-semibold">{diagnosis.diy_cost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Professional Repair:</span>
              <span className="font-semibold">{diagnosis.shop_cost}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground italic">Costs vary by location and vehicle</p>
        </div>
      </div>

      {/* Footer - 3 action buttons */}
      <div className="grid grid-cols-3 gap-3 border-t border-border p-4 md:p-5 bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10"
          asChild
        >
          <a href={`https://www.youtube.com/results?search_query=${searchQuery}`} target="_blank" rel="noopener noreferrer">
            <Video className="mr-1 h-3.5 w-3.5" /> Watch DIY Tutorial
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10"
        >
          <ShoppingCart className="mr-1 h-3.5 w-3.5" /> Order Parts
        </Button>
        <Button
          size="sm"
          className="text-xs bg-accent text-accent-foreground hover:bg-accent/90"
          asChild
        >
          <Link to={`/get-quote?diagnosis=${encodeURIComponent(diagnosis.title)}&vehicle=${encodeURIComponent(vehicle)}`}>
            <Wrench className="mr-1 h-3.5 w-3.5" /> Get Shop Quotes <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
