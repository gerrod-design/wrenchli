// R-70 Tier 2 — linked assessments for this vehicle, read from the immutable snapshots;
// the section shows only rows linked by user_vehicle_id.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setPendingHandoff } from "@/lib/handoff";
import type { HandoffSnapshot } from "@/lib/handoff";

interface VehicleAssessmentsSectionProps {
  handoffs: Array<{ id: string; snapshot: HandoffSnapshot }>;
}

function openChatWithHandoff(id: string) {
  setPendingHandoff({ kind: "owned", id });

  const trigger = document.querySelector<HTMLElement>("[data-chat-trigger]");
  if (trigger) {
    trigger.click();
    return;
  }

  const panel = document.querySelector<HTMLElement>("[data-chat-panel]");
  panel?.scrollIntoView({ behavior: "smooth" });
}

function formatDate(completedAt: string): string {
  return new Date(completedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getSymptomSummary(symptoms: Record<string, unknown>): string {
  const primary = symptoms?.primary_symptom;
  if (typeof primary === "string" && primary.trim().length > 0) {
    return primary;
  }

  const raw = symptoms?.raw_description;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw;
  }

  return "Assessment";
}

function formatCostRange(costRange: { low: number; high: number } | null): string | null {
  if (!costRange) {
    return null;
  }

  return `Estimated cost: $${costRange.low.toLocaleString()} – $${costRange.high.toLocaleString()}`;
}

export default function VehicleAssessmentsSection({ handoffs }: VehicleAssessmentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessments</CardTitle>
      </CardHeader>
      <CardContent>
        {handoffs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assessments have been linked to this vehicle yet.
          </p>
        ) : (
          <ul className="space-y-6">
            {handoffs.map(({ id, snapshot }) => {
              const causeNames = snapshot.assessment.possible_causes
                .map((cause) => cause.name)
                .filter((name) => Boolean(name));
              const costLine = formatCostRange(snapshot.assessment.cost_range);

              return (
                <li key={id} className="space-y-2 border-b pb-6 last:border-b-0 last:pb-0">
                  <div className="text-sm text-muted-foreground">
                    {formatDate(snapshot.completed_at)}
                  </div>
                  <div className="font-medium">{getSymptomSummary(snapshot.symptoms)}</div>

                  {causeNames.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Likely causes</span>{" "}
                      {causeNames.join(", ")}
                    </div>
                  )}

                  {costLine && <div className="text-sm">{costLine}</div>}

                  <p className="text-sm">{snapshot.assessment.explanation}</p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openChatWithHandoff(id)}
                  >
                    Talk it through
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
