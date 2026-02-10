import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BrandVideoModal({ isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-[800px]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:text-white transition-colors"
              aria-label="Close video"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Video placeholder */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-primary border border-white/10">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 border border-white/20 mb-6">
                  <Play className="h-7 w-7 text-white/80 ml-1" />
                </div>
                <p className="text-white/90 font-heading text-lg font-semibold">
                  Our story is coming soon.
                </p>
                <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-md">
                  Wrenchli is building the future of auto repair — transparent pricing,
                  DIY empowerment, and trusted local shops. Launching in Detroit.
                </p>
              </div>
            </div>

            {/* Below video CTA */}
            <div className="mt-6 text-center">
              <p className="text-white/70 font-heading text-base font-semibold mb-4">
                Vehicle Repair, Finally Fixed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  onClick={onClose}
                >
                  <Link to="/#quote">Get Your Free Diagnosis</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 border-white/20 text-white hover:bg-white/10 font-semibold"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
