import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function SaveAssessmentPrompt() {
  const { user, loading } = useAuth();

  if (loading || user) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5 md:p-6 space-y-4">
      <h3 className="font-heading text-lg font-bold text-foreground">
        Save this assessment
      </h3>
      <ul className="space-y-2.5 text-sm text-foreground">
        <li className="flex items-start gap-2.5">
          <span className="shrink-0 text-base" aria-hidden="true">🚗</span>
          Save your vehicle for faster future assessments
        </li>
        <li className="flex items-start gap-2.5">
          <span className="shrink-0 text-base" aria-hidden="true">🔔</span>
          Get alerted if a recall is issued for this vehicle
        </li>
        <li className="flex items-start gap-2.5">
          <span className="shrink-0 text-base" aria-hidden="true">📋</span>
          Keep a history of all your assessments
        </li>
      </ul>
      <Link
        to="/owners"
        className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-colors"
      >
        Create Free Account
      </Link>
      <p className="text-center text-xs text-muted-foreground">
        No credit card. No obligation.
      </p>
    </div>
  );
}
