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
          className="fixed bottom-[76px] left-2 right-2 z-[60] mx-auto rounded-lg border border-border bg-card px-3 py-2 shadow-xl sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-lg sm:rounded-xl sm:p-4"
        >
          <div className="flex items-center gap-2 sm:items-start sm:gap-3">
            <Cookie className="h-4 w-4 shrink-0 text-accent sm:h-5 sm:w-5 sm:mt-0.5" />
            <p className="flex-1 text-[11px] leading-snug text-foreground sm:text-sm sm:leading-relaxed">
              Cookies &amp; local storage for essentials &amp; analytics.{" "}
              <Link to="/privacy" className="text-accent hover:underline font-medium">
                Privacy
              </Link>
            </p>
            <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
              <Button size="sm" onClick={accept} className="h-7 px-2.5 text-[11px] font-semibold sm:h-8 sm:px-3 sm:text-xs">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={decline} className="h-7 px-2.5 text-[11px] sm:h-8 sm:px-3 sm:text-xs">
                Essential
              </Button>
              <button
                onClick={decline}
                className="ml-0.5 text-muted-foreground/60 hover:text-foreground transition-colors sm:ml-1"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
