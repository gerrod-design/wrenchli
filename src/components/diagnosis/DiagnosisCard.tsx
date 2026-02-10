import { useState } from "react";
import { Video, ShoppingCart, Wrench, ArrowRight, CheckCircle, AlertTriangle, XCircle, Star, ChevronDown, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import UrgencyBadge from "./UrgencyBadge";
import YouTubeTutorials from "./YouTubeTutorials";
import OrderParts from "./OrderParts";
import type { Diagnosis } from "./types";
import { cn } from "@/lib/utils";

const diyConfig = {
  easy: {
    icon: CheckCircle,
    label: "Easy",
    badge: "🟢 Easy",
    subtitle: "Most vehicle owners can handle this repair",
    className: "text-wrenchli-green",
    cardBg: "hsl(170 76% 96%)",
    cardBorder: "hsl(170 73% 36%)",
  },
  moderate: {
    icon: AlertTriangle,
    label: "Moderate",
    badge: "🟡 Moderate",
    subtitle: "Doable if you have basic tools and some experience",
    className: "text-amber-500",
    cardBg: "hsl(170 76% 96%)",
    cardBorder: "hsl(170 73% 36%)",
  },
  advanced: {
    icon: XCircle,
    label: "Advanced",
    badge: "🔴 Advanced",
    subtitle: "This repair requires specialized tools and experience",
    className: "text-destructive",
    cardBg: "hsl(45 100% 97%)",
    cardBorder: "hsl(38 92% 50%)",
  },
} as const;

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  vehicle: string;
}

export default function DiagnosisCard({ diagnosis, vehicle }: DiagnosisCardProps) {
  const diy = diyConfig[diagnosis.diy_feasibility];
  const DiyIcon = diy.icon;
  const isAdvanced = diagnosis.diy_feasibility === "advanced";
  const [showTutorials, setShowTutorials] = useState(false);
  const [showParts, setShowParts] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const tools = diagnosis.tools_required || [];

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
          <p className="text-xs text-muted-foreground">{diy.subtitle}</p>
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

      {/* YOUR OPTIONS divider */}
      <div className="flex items-center gap-4 px-5 md:px-6 pt-2 pb-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Your Options</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Dual-path cards */}
      <div className="grid gap-4 px-5 md:px-6 pb-5 md:pb-6 sm:grid-cols-2">
        {/* DIY Path */}
        <div
          className="rounded-xl border p-5 flex flex-col"
          style={{ backgroundColor: diy.cardBg, borderColor: diy.cardBorder }}
        >
          <div className="mb-3">
            <h4 className="font-heading text-base font-bold" style={{ color: isAdvanced ? "hsl(38 92% 40%)" : "hsl(170 73% 36%)" }}>
              🔧 Fix It Yourself
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">{diy.subtitle}</p>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated cost:</span>
              <span className="font-semibold">{diagnosis.diy_cost}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Difficulty:</span>
              <span className="font-semibold">{diy.badge}</span>
            </div>
          </div>

          {/* Tools Required */}
          {tools.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowTools(!showTools)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <HardHat className="h-3.5 w-3.5" />
                Tools Needed ({tools.filter(t => !t.optional).length})
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showTools && "rotate-180")} />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  showTools ? "max-h-[300px] opacity-100 mt-2" : "max-h-0 opacity-0"
                )}
              >
                <div className="rounded-md border border-border bg-muted/50 p-3 space-y-1.5">
                  {tools.filter(t => !t.optional).map((tool, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span>{tool.icon}</span>
                      <span className="font-medium">{tool.name}</span>
                    </div>
                  ))}
                  {tools.some(t => t.optional) && (
                    <>
                      <div className="h-px bg-border my-1.5" />
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Optional</p>
                      {tools.filter(t => t.optional).map((tool, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{tool.icon}</span>
                          <span>{tool.name}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAdvanced && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 mb-4 text-xs text-foreground">
              <span className="font-semibold">⚠️ We recommend professional repair for this issue.</span>{" "}
              Incorrect repair could cause additional damage or safety risk.
            </div>
          )}

          {diagnosis.diy_feasibility === "moderate" && (
            <p className="text-xs text-muted-foreground mb-4 italic">
              Not comfortable? That's okay — <Link to={`/get-quote?diagnosis=${encodeURIComponent(diagnosis.title)}&code=${encodeURIComponent(diagnosis.code || "")}&vehicle=${encodeURIComponent(vehicle)}&urgency=${diagnosis.urgency}&diy=${diagnosis.diy_feasibility}`} className="text-wrenchli-teal font-semibold hover:underline">get a professional quote instead →</Link>
            </p>
          )}

          <div className="space-y-2 mt-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10"
              onClick={() => setShowTutorials(!showTutorials)}
            >
              <Video className="mr-1.5 h-3.5 w-3.5" /> Watch Tutorial
              <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform duration-200", showTutorials && "rotate-180")} />
            </Button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                showTutorials ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="pt-2">
                <YouTubeTutorials diagnosisTitle={diagnosis.title} vehicle={vehicle} />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10"
              onClick={() => setShowParts(!showParts)}
            >
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Order Parts
              <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform duration-200", showParts && "rotate-180")} />
            </Button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                showParts ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="pt-2">
                <OrderParts diagnosisTitle={diagnosis.title} vehicle={vehicle} />
              </div>
            </div>
            <Button
              size="sm"
              className={cn(
                "w-full text-xs font-semibold",
                isAdvanced
                  ? "bg-transparent border border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10"
                  : "bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90"
              )}
            >
              Start DIY Guide <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Professional Path */}
        <div
          className="rounded-xl border p-5 flex flex-col relative"
          style={{ backgroundColor: "hsl(206 100% 97%)", borderColor: "hsl(204 64% 44%)" }}
        >
          {isAdvanced && (
            <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground">
              <Star className="h-3 w-3" /> Recommended
            </div>
          )}

          <div className="mb-3">
            <h4 className="font-heading text-base font-bold" style={{ color: "hsl(204 64% 44%)" }}>
              👨‍🔧 Get It Fixed Professionally
            </h4>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated cost:</span>
              <span className="font-semibold">{diagnosis.shop_cost}</span>
            </div>
          </div>

          <ul className="space-y-2 text-sm mb-4 flex-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(204 64% 44%)" }} />
              <span>Quotes from vetted local shops</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(204 64% 44%)" }} />
              <span>Financing available</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(204 64% 44%)" }} />
              <span>Guaranteed pricing</span>
            </li>
          </ul>

          <Button
            size="sm"
            className="w-full text-xs bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-auto"
            asChild
          >
            <Link to={`/get-quote?diagnosis=${encodeURIComponent(diagnosis.title)}&code=${encodeURIComponent(diagnosis.code || "")}&vehicle=${encodeURIComponent(vehicle)}&urgency=${diagnosis.urgency}&diy=${diagnosis.diy_feasibility}`}>
              <Wrench className="mr-1.5 h-3.5 w-3.5" /> Get Shop Quotes <ArrowRight className="ml-1.5 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Disclaimer reminder */}
      <div className="px-5 md:px-6 pb-4 md:pb-5">
        <p className="text-[11px] text-muted-foreground text-center italic">
          Estimates are for informational purposes only. Actual costs and repair complexity may vary.
        </p>
      </div>
    </div>
  );
}
