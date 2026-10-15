import { Card } from "@/components/ui/card";
import type { CoverageGuidance } from "@/lib/journeyPlan";
import { formatCoverageGuidance } from "@/lib/journeyPlan";

export interface CoverageGuidanceBannerProps {
  guidance: CoverageGuidance;
  providerName: string;
}

export default function CoverageGuidanceBanner({
  guidance,
  providerName,
}: CoverageGuidanceBannerProps): JSX.Element | null {
  if (!guidance.show) {
    return null;
  }

  return (
    <Card className="border border-amber-300 bg-amber-50 rounded-lg p-4">
      <p className="text-sm text-amber-900">
        {formatCoverageGuidance(guidance, providerName)}
      </p>
    </Card>
  );
}
