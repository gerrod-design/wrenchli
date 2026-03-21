import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "mi_loan_banner_dismissed";
const DISMISS_EXPIRY_DAYS = 7;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const { timestamp } = JSON.parse(raw);
    const elapsed = Date.now() - timestamp;
    return elapsed < DISMISS_EXPIRY_DAYS * 86400000;
  } catch {
    return false;
  }
}

export default function MILoanBanner() {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isDismissed()) return;

    // Check if user already detected as MI via LocationContext localStorage
    const stored = localStorage.getItem("user_state");
    if (stored === "MI") {
      setShow(true);
      setVisible(true);
      return;
    }

    // Attempt IP geolocation
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        const state = data.region_code || "";
        localStorage.setItem("user_state", state);
        if (state === "MI") {
          setShow(true);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ timestamp: Date.now() }));
    setVisible(false);
  }

  if (!show) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-[60] bg-gradient-to-r from-primary to-accent text-primary-foreground"
        >
          <div className="container-wrenchli flex flex-col items-start gap-3 py-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">🏛️</span>
              <div>
                <h3 className="font-heading text-sm font-bold sm:text-base">
                  Michigan Residents: Get Up To $1,200 for Car Repairs
                </h3>
                <p className="text-xs opacity-90 sm:text-sm">
                  State-backed loans • 12 months • 36% APR max • No traditional credit check
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                size="sm"
                variant="secondary"
                className="text-xs sm:text-sm"
                asChild
              >
                <Link to="/mi-affordable-loan">Learn More</Link>
              </Button>
              <Button
                size="sm"
                className="bg-accent-foreground text-accent hover:bg-accent-foreground/90 text-xs sm:text-sm"
                asChild
              >
                <Link to="/mi-loan-eligibility">Check Eligibility</Link>
              </Button>
              <button
                onClick={handleDismiss}
                className="ml-1 rounded p-1 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
