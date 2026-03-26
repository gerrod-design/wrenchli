import { AlertTriangle } from "lucide-react";

interface CommonIssueBadgeProps {
  isCommonIssue: boolean;
  reason: string;
  vehicle: string;
}

export default function CommonIssueBadge({ isCommonIssue, reason, vehicle }: CommonIssueBadgeProps) {
  if (!isCommonIssue || !reason) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
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
