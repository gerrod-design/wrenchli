import { Lock } from "lucide-react";

export default function GaragePrivacyNotice() {
  return (
    <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground/70 leading-relaxed">
      <Lock className="h-3 w-3 shrink-0 mt-0.5" />
      <span>
        Your vehicles are saved in this browser only and are not sent to Wrenchli's servers.
        Clearing your browser data will remove saved vehicles.
      </span>
    </p>
  );
}
