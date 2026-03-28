import { AlertTriangle, CheckCircle, Clock, DollarSign, Wrench, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import ShareWithShopButton from "@/components/ShareWithShopButton";

export interface RepairOption {
  option: string;
  description: string;
  estimated_cost_low: number;
  estimated_cost_high: number;
  difficulty: "DIY" | "Professional" | "Body Shop";
  time_estimate: string;
}

export interface DamageDiagnosis {
  damage_type: string;
  severity: "minor" | "moderate" | "severe";
  affected_area: string;
  description: string;
  safety_concern: boolean;
  safety_notes: string;
  repair_options: RepairOption[];
  recommended_action: string;
  urgency: "can_wait" | "soon" | "immediate";
}

interface Props {
  diagnosis: DamageDiagnosis;
  imageUrls: string[];
  vehicleInfo?: string;
}

const severityConfig = {
  minor: { label: "Minor", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  moderate: { label: "Moderate", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  severe: { label: "Severe", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
};

const urgencyConfig = {
  can_wait: { label: "Can Wait", color: "bg-muted text-muted-foreground" },
  soon: { label: "Address Soon", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  immediate: { label: "Immediate Attention", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const difficultyColors: Record<string, string> = {
  DIY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Professional: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Body Shop": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function DamageAnalysisResult({ diagnosis, imageUrls, vehicleInfo }: Props) {
  const sev = severityConfig[diagnosis.severity];
  const urg = urgencyConfig[diagnosis.urgency];
  const SevIcon = sev.icon;

  const quoteParams = new URLSearchParams({
    diagnosis: diagnosis.damage_type,
    ...(vehicleInfo && { vehicle: vehicleInfo }),
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-bold">{diagnosis.damage_type}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{diagnosis.affected_area}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Badge className={sev.color} variant="secondary">
                <SevIcon className="h-3 w-3 mr-1" />
                {sev.label}
              </Badge>
              <Badge className={urg.color} variant="secondary">{urg.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">{diagnosis.description}</p>

          {diagnosis.safety_concern && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">Safety Concern</p>
                <p className="text-sm text-foreground/80">{diagnosis.safety_notes}</p>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm font-medium text-foreground">
              <Wrench className="inline h-4 w-4 mr-1.5 text-accent" />
              Recommended: {diagnosis.recommended_action}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Repair options */}
      <div>
        <h3 className="font-heading text-lg font-semibold mb-3">Repair Options</h3>
        <div className="grid gap-3">
          {diagnosis.repair_options.map((opt, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{opt.option}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                  </div>
                  <Badge className={difficultyColors[opt.difficulty] || "bg-muted text-muted-foreground"} variant="secondary">
                    {opt.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <DollarSign className="h-4 w-4 text-accent" />
                    ${opt.estimated_cost_low.toLocaleString()} – ${opt.estimated_cost_high.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {opt.time_estimate}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to={`/get-quote?${quoteParams.toString()}`}>
            Get a Professional Quote <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/find-shops">Find Nearby Shops</Link>
        </Button>
      </div>
    </div>
  );
}
