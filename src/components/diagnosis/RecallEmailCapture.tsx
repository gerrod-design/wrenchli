import { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecallEmailCaptureProps {
  vehicleYear: string | number;
  vehicleMake: string;
  vehicleModel: string;
  sessionId?: string;
  isSignedIn?: boolean;
}

const DISMISSED_KEY = "wrenchli_recall_email_dismissed";

export default function RecallEmailCapture({
  vehicleYear,
  vehicleMake,
  vehicleModel,
  sessionId,
  isSignedIn,
}: RecallEmailCaptureProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isSignedIn) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 10_000);
    return () => clearTimeout(timer);
  }, [isSignedIn]);

  if (!visible || submitted) return null;

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("recall_email_captures" as any)
        .insert({
          email: trimmed,
          vehicle_year: String(vehicleYear),
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          session_id: sessionId || null,
        } as any);

      if (error) throw error;

      setSubmitted(true);
      sessionStorage.setItem(DISMISSED_KEY, "1");
      toast.success("You're signed up for recall alerts!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const vehicleStr = `${vehicleYear} ${vehicleMake} ${vehicleModel}`;

  return (
    <div
      className="rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom-4 duration-500"
      style={{ background: "#0F1117", border: "1px solid #E07B3940" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 shrink-0" style={{ color: "#E07B39" }} />
          <h4 className="text-sm font-heading font-bold" style={{ color: "#F5F5F5" }}>
            Get recall alerts for this vehicle
          </h4>
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" style={{ color: "#6B7280" }} />
        </button>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
        Enter your email and we'll notify you if a safety recall is issued for your {vehicleStr}.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 h-9 rounded-lg px-3 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#E07B39]"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-9 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "#E07B39", color: "#0F1117" }}
        >
          {submitting ? "…" : "Send Me Recall Alerts"}
        </button>
      </form>

      <p className="text-[11px]" style={{ color: "#6B7280" }}>
        Unsubscribe anytime. No spam. Ever.
      </p>
    </div>
  );
}
