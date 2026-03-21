import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "wrenchli_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-[140px] left-4 right-4 z-[60] mx-auto max-w-lg rounded-xl border border-border bg-card p-4 shadow-xl sm:bottom-6 sm:left-6 sm:right-auto"
        >
          <button
            onClick={decline}
            className="absolute right-3 top-3 text-muted-foreground/60 hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <Cookie className="h-5 w-5 shrink-0 text-accent mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                We use cookies and local storage for essential site functionality and anonymous analytics.{" "}
                <Link to="/privacy" className="text-accent hover:underline font-medium">
                  Privacy Policy
                </Link>
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={accept} className="h-8 text-xs font-semibold">
                  Accept All
                </Button>
                <Button size="sm" variant="outline" onClick={decline} className="h-8 text-xs">
                  Essential Only
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
