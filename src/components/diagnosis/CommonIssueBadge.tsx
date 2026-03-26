import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface CommonIssueBadgeProps {
  isCommonIssue: boolean;
  reason: string;
  vehicle: string;
}

export default function CommonIssueBadge({ isCommonIssue, reason, vehicle }: CommonIssueBadgeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isCommonIssue) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        trackEvent({ event_type: "ad_impression", category: "diy_product", action: "common_issue_badge_impression", label: vehicle, metadata: { reason } });
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isCommonIssue, vehicle, reason]);

  if (!isCommonIssue || !reason) return null;

  return (
    <div ref={ref} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 mt-0.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
      </div>
      <div>
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
          ⚡ Known Common Issue{vehicle ? ` for ${vehicle}` : ""}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {reason}
        </p>
      </div>
    </div>
  );
}
