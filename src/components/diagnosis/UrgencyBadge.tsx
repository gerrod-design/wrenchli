import { cn } from "@/lib/utils";

const urgencyConfig = {
  low: {
    label: "Low",
    description: "Safe to monitor. Address within the next few weeks.",
    className: "bg-wrenchli-green text-white",
  },
  medium: {
    label: "Medium",
    description: "Should be addressed soon. Don't ignore for more than a week or two.",
    className: "bg-amber-500 text-foreground",
  },
  high: {
    label: "High",
    description: "Address immediately. Continued driving may cause further damage or safety risk.",
    className: "bg-destructive text-white",
  },
} as const;

interface UrgencyBadgeProps {
  urgency: "low" | "medium" | "high";
  showDescription?: boolean;
}

export default function UrgencyBadge({ urgency, showDescription = false }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency];
  return (
    <div className="flex items-center gap-2">
      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", config.className)}>
        {config.label}
      </span>
      {showDescription && (
        <span className="text-xs text-muted-foreground">{config.description}</span>
      )}
    </div>
  );
}
