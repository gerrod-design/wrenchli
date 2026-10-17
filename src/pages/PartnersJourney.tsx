import { JOURNEY_STAGES, HANDOFF_LABEL, FEATURE_TITLES, JourneyStage } from '@/lib/journeyMap';
import JourneyPlanCard from '@/components/journey/JourneyPlanCard';
import type { JourneySituationInput } from '@/lib/journeyPlan';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// A stated demo situation used to preview the journey plan component — not a real customer.
export const DEMO_SITUATION: JourneySituationInput = {
  downtimeDaysMin: 2,
  downtimeDaysMax: 4,
  dailyDistanceMiles: 18,
  budgetTier: 'medium',
  vehicleDrivable: false,
  metroArea: 'detroit',
  issueCategory: 'brakes',
};

function StageCard({ stage }: { stage: JourneyStage }) {
  return (
    <Card className="p-4 space-y-2">
      {stage.status === 'live' && (
        <>
          <Badge>Live today</Badge>
          <h3 className="font-semibold">{stage.title}</h3>
          <p className="text-sm">{stage.summary}</p>
          <p className="text-xs text-muted-foreground">{stage.partnerNote}</p>
        </>
      )}
      {stage.status === 'v1' && (
        <>
          <Badge>New in this build</Badge>
          <h3 className="font-semibold">{stage.title}</h3>
          <p className="text-sm">{stage.summary}</p>
          <p className="text-xs text-muted-foreground">{stage.partnerNote}</p>
          {stage.featureRefs.length > 0 && (
            <div className="space-y-1 pt-1">
              {stage.featureRefs.map((ref) => (
                <div key={ref} className="text-xs text-muted-foreground">
                  Includes: {FEATURE_TITLES[ref]}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {stage.status === 'later' && (
        <>
          <Badge variant="outline">Coming with partners</Badge>
          <h3 className="font-semibold">{stage.title}</h3>
          <p className="text-sm">{stage.summary}</p>
          <p className="text-xs text-muted-foreground">Why not yet: {stage.laterReason}</p>
          <p className="text-xs text-muted-foreground">{stage.partnerNote}</p>
          <p className="text-xs font-medium">Launching with partners nationally — be first.</p>
        </>
      )}
    </Card>
  );
}

export default function PartnersJourney() {
  const consumerStages = JOURNEY_STAGES.filter((s) => s.lane === 'consumer');
  const shopStages = JOURNEY_STAGES.filter((s) => s.lane === 'shop');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">The complete Wrenchli journey — partner preview</h1>
        <p className="text-sm font-medium">
          Launching with partners nationally — be first.
        </p>
        <p className="text-sm text-muted-foreground">
          This page walks the whole journey a Wrenchli customer and shop take together. Every
          stage below is labeled honestly. Partner slots are open categories, not simulated
          services.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Badge>Live today</Badge>
          <span className="text-muted-foreground">in the product now</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge>New in this build</Badge>
          <span className="text-muted-foreground">built and tested in this release</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline">Coming with partners</Badge>
          <span className="text-muted-foreground">
            not live yet — shown so partners can see where they fit
          </span>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Consumer: the unexpected repair</h2>
        {consumerStages.map((stage) => (
          <div key={stage.id} className="space-y-4">
            <StageCard stage={stage} />
            {stage.id === 'C4' && (
              <Card className="p-4 space-y-3">
                <p className="text-sm font-medium">
                  The journey plan — live in this build. This is the same component consumers
                  get; try the situation inputs.
                </p>
                <JourneyPlanCard mode="partner_preview" initialSituation={DEMO_SITUATION} />
              </Card>
            )}
          </div>
        ))}
      </section>

      <div className="text-center text-sm font-medium py-2 border-y">{HANDOFF_LABEL}</div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Repair shop: the unexpected appointment</h2>
        {shopStages.map((stage) => (
          <StageCard key={stage.id} stage={stage} />
        ))}
      </section>
    </div>
  );
}
