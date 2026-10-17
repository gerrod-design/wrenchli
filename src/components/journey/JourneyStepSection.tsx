import type { PlanStep } from "@/lib/journeyPlan";
import PartnerSlot from "@/components/journey/PartnerSlot";

export interface JourneyStepSectionProps {
  step: PlanStep;
  surface: "consumer" | "partner_preview";
}

export default function JourneyStepSection({
  step,
  surface,
}: JourneyStepSectionProps): JSX.Element {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{step.title}</h2>
      <div className="space-y-4">
        {step.items.map((item, idx) => {
          if (item.kind === "partner_slot") {
            return (
              <PartnerSlot
                key={item.key ?? idx}
                label={item.label}
                description={item.description}
                surface={surface}
                slotKey={item.key}
              />
            );
          }

          return (
            <div key={idx} className="border rounded-lg p-4 space-y-1">
              <p className="font-semibold">{item.label}</p>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
              {item.transitOption && (
                <a
                  href={item.transitOption.plannerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-medium text-primary underline underline-offset-4"
                >
                  Plan your trip with {item.transitOption.agencyName}
                </a>
              )}
              {item.links && item.links.length > 0 && (
                <div className="space-y-1">
                  {item.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-sm font-medium text-primary underline underline-offset-4"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
