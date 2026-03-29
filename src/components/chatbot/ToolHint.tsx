import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ToolHintProps {
  /** Unique key for localStorage dismiss tracking */
  id: string;
  /** Tooltip text */
  label: string;
  /** Delay before showing (ms) */
  delay?: number;
  /** Position relative to the child */
  position?: "top" | "bottom";
  children: React.ReactNode;
}

const STORAGE_PREFIX = "wrenchli_hint_dismissed_";

const ToolHint = memo(function ToolHint({
  id,
  label,
  delay = 2000,
  position = "top",
  children,
}: ToolHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), delay);
    // Auto-dismiss after 8 seconds
    const autoHide = setTimeout(() => {
      setVisible(false);
      localStorage.setItem(`${STORAGE_PREFIX}${id}`, "1");
    }, delay + 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHide);
    };
  }, [id, delay]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, "1");
  };

  const posClasses =
    position === "top"
      ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
      : "top-full mt-2 left-1/2 -translate-x-1/2";

  const arrowClasses =
    position === "top"
      ? "top-full left-1/2 -translate-x-1/2 border-t-primary border-x-transparent border-b-transparent"
      : "bottom-full left-1/2 -translate-x-1/2 border-b-primary border-x-transparent border-t-transparent";

  return (
    <span className="relative inline-flex">
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            initial={{ opacity: 0, y: position === "top" ? 6 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === "top" ? 6 : -6 }}
            transition={{ duration: 0.25 }}
            className={`absolute z-50 ${posClasses} pointer-events-auto`}
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground shadow-lg">
              {label}
              <button
                onClick={dismiss}
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Dismiss hint"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
            <span
              className={`absolute h-0 w-0 border-[5px] ${arrowClasses}`}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
});

export default ToolHint;
