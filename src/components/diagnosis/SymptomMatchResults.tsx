import { AlertTriangle, ArrowRight, Info, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { SymptomMatch } from "@/data/symptomLibrary";
import DiagnosisCard from "./DiagnosisCard";
import type { Diagnosis } from "./types";
import { getToolsForDiagnosis } from "@/data/toolsLibrary";

interface SymptomMatchResultsProps {
  matches: SymptomMatch[];
  vehicle: string;
  onSwitchToDtc?: () => void;
}

function entryToDiagnosis(entry: SymptomMatch["entry"]): Diagnosis {
  return {
    title: entry.diagnosis,
    code: "",
    urgency: entry.urgency,
    whats_happening: entry.description,
    common_causes: entry.commonCauses,
    diy_feasibility: entry.diyFeasibility,
    diy_cost: entry.costRange.diy,
    shop_cost: entry.costRange.professional,
    tools_required: getToolsForDiagnosis(undefined, entry.diyFeasibility),
  };
}

function SpecialNote({ text }: { text: string }) {
  return (
    <div
      className="flex gap-3 rounded-lg border-l-4 p-4 text-sm"
      style={{ backgroundColor: "hsl(213 100% 96%)", borderLeftColor: "hsl(217 91% 60%)" }}
    >
      <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(217 91% 60%)" }} />
      <p className="text-foreground">
        <span className="font-bold">Note: </span>{text}
      </p>
    </div>
  );
}

function OBD2ScannerRecommendation({ onSwitchToDtc }: { onSwitchToDtc?: () => void }) {
  return (
    <div
      className="rounded-lg border-l-4 p-4 md:p-5 space-y-3"
      style={{ backgroundColor: "hsl(170 76% 96%)", borderLeftColor: "hsl(170 73% 36%)" }}
    >
      <div className="flex items-start gap-3">
        <Plug className="h-5 w-5 shrink-0 mt-0.5 text-wrenchli-teal" />
        <div className="space-y-2">
          <h4 className="font-heading text-sm font-bold">Get a more accurate diagnosis with an OBD2 scanner</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An OBD2 scanner reads the specific diagnostic code stored in your vehicle's computer, giving you a much more targeted diagnosis. Many auto parts stores (AutoZone, O'Reilly, Advance Auto) will scan your vehicle for free. Or you can purchase a scanner for home use:
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {["FIXD", "BlueDriver", "Innova"].map((brand) => (
              <span key={brand} className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                {brand}
              </span>
            ))}
          </div>
          {onSwitchToDtc && (
            <p className="text-sm">
              Already have a code?{" "}
              <button
                onClick={onSwitchToDtc}
                className="text-wrenchli-teal font-semibold hover:underline"
              >
                Enter it here →
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SymptomMatchResults({ matches, vehicle, onSwitchToDtc }: SymptomMatchResultsProps) {
  const hasAmbiguousDiagnosis = matches.some(
    (m) =>
      m.entry.diagnosis.includes("Multiple Possible Causes") ||
      m.entry.diagnosis.includes("Check Engine Light")
  );

  return (
    <div className="space-y-4">
      {matches.map((match, i) => (
        <div key={i} className="space-y-3">
          <DiagnosisCard diagnosis={entryToDiagnosis(match.entry)} vehicle={vehicle} />
          {match.entry.specialNote && <SpecialNote text={match.entry.specialNote} />}
        </div>
      ))}

      {hasAmbiguousDiagnosis && (
        <OBD2ScannerRecommendation onSwitchToDtc={onSwitchToDtc} />
      )}
    </div>
  );
}

interface NoMatchFallbackProps {
  vehicle: string;
}

export function NoMatchFallback({ vehicle }: NoMatchFallbackProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <h3 className="font-heading text-lg font-bold">We weren't able to match your description to a common issue.</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Car problems can be complex, and sometimes a description alone isn't enough to narrow down the cause. Here are your options:
      </p>

      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Option 1: Scan with an OBD2 Reader</h4>
          <p className="text-sm text-muted-foreground">
            If you have an OBD2 scanner, plug it in and enter the diagnostic code above for a more specific diagnosis.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Option 2: Get a Professional Inspection</h4>
          <p className="text-sm text-muted-foreground">
            Get quotes from trusted local shops who can perform a hands-on diagnostic inspection.
          </p>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link to={`/get-quote?type=diagnostic&vehicle=${encodeURIComponent(vehicle)}`}>
              Get a Professional Diagnostic Quote <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Option 3: Rephrase Your Description</h4>
          <p className="text-sm text-muted-foreground">
            Try rephrasing your description with specific details — what you hear, see, smell, or feel, and when it happens (at startup, while braking, at highway speed, etc.).
          </p>
        </div>
      </div>
    </div>
  );
}
