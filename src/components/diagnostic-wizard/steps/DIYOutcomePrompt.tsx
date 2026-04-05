import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DIYOutcomePromptProps {
  sessionId: string;
  onGoToShop?: () => void;
}

export default function DIYOutcomePrompt({ sessionId, onGoToShop }: DIYOutcomePromptProps) {
  const [status, setStatus] = useState<"prompt" | "saving" | "done">("prompt");

  const submit = async (
    problemFixed: "yes" | "no",
    diyNotes: string,
    noVisitReason?: string
  ) => {
    setStatus("saving");
    // Fire-and-forget to report-diagnostic-outcome edge function
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/report-diagnostic-outcome`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        shop_visit: false,
        problem_fixed: problemFixed,
        diy_notes: diyNotes,
        no_visit_reason: noVisitReason,
      }),
    }).catch(console.error);

    setStatus("done");

    if (noVisitReason === "diy" && onGoToShop) {
      setTimeout(onGoToShop, 1500);
    }
  };

  if (status === "done") {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        Thanks — this helps us improve.
      </p>
    );
  }

  return (
    <div className="rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
      <p className="text-sm font-medium mb-3" style={{ color: "#F5F5F5" }}>
        Did you attempt this repair?
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => submit("yes", "DIY successful")}
          disabled={status === "saving"}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{ background: "#22C55E20", color: "#22C55E", border: "1px solid #22C55E40" }}
        >
          Yes, fixed it
        </button>
        <button
          onClick={() => submit("no", "DIY attempted, unsuccessful")}
          disabled={status === "saving"}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{ background: "#F59E0B20", color: "#F59E0B", border: "1px solid #F59E0B40" }}
        >
          Tried, no luck
        </button>
        <button
          onClick={() => submit("no", "", "diy")}
          disabled={status === "saving"}
          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{ background: "#3B82F620", color: "#3B82F6", border: "1px solid #3B82F640" }}
        >
          Going to a shop
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        Your answer helps improve Wrenchli for everyone.
      </p>
    </div>
  );
}
