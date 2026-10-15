import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SituationForm from "./SituationForm";
import JourneyStepSection from "./JourneyStepSection";
import CoverageGuidanceBanner from "./CoverageGuidanceBanner";
import {
  JourneySituationInput,
  JourneyPlan,
  MetroArea,
  buildJourneyPlan,
  filterPlanForShopContext,
  buildCoverageGuidance,
} from "@/lib/journeyPlan";
import { JourneyPlanRow } from "@/lib/journeyPlanData";

export interface JourneyPlanCardProps {
  mode: "consumer" | "partner_preview";
  initialSituation?: JourneySituationInput;
  existingPlan?: JourneyPlanRow | null;
  shopCapabilities?: string[] | null;
  serviceContractProvider?: string;
  onSave?: (input: JourneySituationInput, plan: JourneyPlan) => void;
}

const metroLabels: Record<MetroArea, string> = {
  detroit: "Detroit",
  columbus: "Columbus",
  other: "Other area",
};

function situationFromRow(row: JourneyPlanRow): JourneySituationInput {
  return {
    downtimeDaysMin: row.downtime_days_min,
    downtimeDaysMax: row.downtime_days_max,
    dailyDistanceMiles: row.daily_distance_miles,
    budgetTier: row.budget_tier,
    vehicleDrivable: row.vehicle_drivable,
    metroArea: row.metro_area,
    issueCategory: row.issue_category,
  };
}

export default function JourneyPlanCard({
  mode,
  initialSituation,
  existingPlan,
  shopCapabilities,
  serviceContractProvider,
  onSave,
}: JourneyPlanCardProps) {
  const [situation, setSituation] = useState<JourneySituationInput | null>(
    existingPlan ? situationFromRow(existingPlan) : initialSituation ?? null
  );
  const [activePlan, setActivePlan] = useState<JourneyPlan | null>(
    existingPlan ? (existingPlan.plan_snapshot as JourneyPlan) : null
  );
  const [editing, setEditing] = useState(false);

  const handleSubmit = (input: JourneySituationInput) => {
    const plan = buildJourneyPlan(input);
    setSituation(input);
    setActivePlan(plan);
    setEditing(false);
    onSave?.(input, plan);
  };

  if (!activePlan || !situation || editing) {
    return (
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">While your car is being fixed</h2>
        <p className="text-sm text-muted-foreground">
          Three things to sort out while your car is in the shop — getting around, getting the car
          there, and paying for it.
        </p>
        <SituationForm
          initial={situation ?? undefined}
          onSubmit={handleSubmit}
          submitLabel={editing ? "Update" : "Continue"}
        />
      </Card>
    );
  }

  const filteredPlan = filterPlanForShopContext(activePlan, shopCapabilities ?? null);
  const budgetLabel =
    situation.budgetTier.charAt(0).toUpperCase() + situation.budgetTier.slice(1);
  const metroLabel = metroLabels[situation.metroArea];

  const guidance = serviceContractProvider
    ? buildCoverageGuidance(true, situation.issueCategory)
    : null;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Downtime: {situation.downtimeDaysMin}–{situation.downtimeDaysMax} days ·{" "}
          {situation.dailyDistanceMiles} mi/day · Budget: {budgetLabel} · {metroLabel}
        </p>
        <Button variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>

      {filteredPlan.steps.map((s) => (
        <JourneyStepSection key={s.step} step={s} surface={mode} />
      ))}

      {guidance && serviceContractProvider && (
        <CoverageGuidanceBanner guidance={guidance} providerName={serviceContractProvider} />
      )}
    </Card>
  );
}
