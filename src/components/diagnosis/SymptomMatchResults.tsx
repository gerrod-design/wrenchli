import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { SymptomMatch } from "@/data/symptomLibrary";
import DiagnosisCard from "./DiagnosisCard";
import type { Diagnosis } from "./types";

interface SymptomMatchResultsProps {
  matches: SymptomMatch[];
  vehicle: string;
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
  };
}

export default function SymptomMatchResults({ matches, vehicle }: SymptomMatchResultsProps) {
  return (
    <div className="space-y-4">
      {matches.map((match, i) => (
        <div key={i} className="space-y-2">
          <DiagnosisCard diagnosis={entryToDiagnosis(match.entry)} vehicle={vehicle} />
          {match.entry.specialNote && (
            <div className="flex gap-2 rounded-lg border border-wrenchli-teal/20 bg-wrenchli-teal/5 p-3 text-sm">
              <Info className="h-4 w-4 text-wrenchli-teal shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{match.entry.specialNote}</p>
            </div>
          )}
        </div>
      ))}
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
