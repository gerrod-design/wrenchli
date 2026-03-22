import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isMichiganZip } from "@/lib/financing";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SESSION_KEY = "mi_popup_shown";
const DISMISS_KEY = "mi_loan_banner_dismissed";

interface Props {
  zip: string;
}

export default function MILoanEligibilityPopup({ zip }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!zip || zip.length < 5) return;
    if (!isMichiganZip(zip)) return;

    // Don't show if already shown this session or banner was dismissed
    if (sessionStorage.getItem(SESSION_KEY)) return;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const { timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp < 7 * 86400000) return;
      }
    } catch {}

    sessionStorage.setItem(SESSION_KEY, "true");
    setOpen(true);

    // Auto-dismiss after 15 seconds
    const timer = setTimeout(() => setOpen(false), 15000);
    return () => clearTimeout(timer);
  }, [zip]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            ✨ You May Qualify for MI Affordable Loan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We noticed you're in Michigan. You may be eligible for a
            state-backed repair loan:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">✅ Up to $1,200</li>
            <li className="flex items-center gap-2">✅ 12 months, 36% APR max</li>
            <li className="flex items-center gap-2">✨ No traditional credit check</li>
            <li className="flex items-center gap-2">🏛️ State of Michigan program</li>
          </ul>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link to="/mi-loan-eligibility">Check Eligibility</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/mi-affordable-loan">Learn More</Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="w-full text-muted-foreground"
          >
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
