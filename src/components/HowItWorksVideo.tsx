import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search, ClipboardList, GitFork, Wrench, CheckCircle,
  ArrowRight, RotateCcw, Tv, Store, CreditCard, MapPin,
  ShoppingCart, DollarSign, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/SectionReveal";
import PhoneMockup, { type WalkthroughPath } from "@/components/PhoneMockup";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── Step definitions ─── */

const sharedSteps = [
  { step: 1, icon: Search, title: "Tell Us What's Wrong", desc: "Describe your issue or enter a diagnostic code." },
  { step: 2, icon: ClipboardList, title: "Get Your Diagnosis", desc: "See what's likely wrong, how urgent it is, and estimated costs." },
];

const defaultSteps = [
  { step: 3, icon: GitFork, title: "Explore Your Options", desc: "Choose your path: DIY tutorial or shop quotes." },
  { step: 4, icon: Wrench, title: "Fix It Your Way", desc: "Follow a video guide, or book a shop appointment with financing." },
  { step: 5, icon: CheckCircle, title: "Get Back on the Road", desc: "Whether you fixed it or used a shop, you're back in control." },
];

const diySteps = [
  { step: 3, icon: Tv, title: "Watch a DIY Tutorial", desc: "Video guides matched to your exact vehicle — year, make, model, engine." },
  { step: 4, icon: ShoppingCart, title: "Order the Right Parts", desc: "See exactly what you need with links to AutoZone, O'Reilly, and Amazon." },
  { step: 5, icon: DollarSign, title: "Fix It & Save", desc: "Follow along at your own pace. Typical savings: $100–$300 vs. a shop visit." },
];

const shopSteps = [
  { step: 3, icon: MapPin, title: "Compare Local Shops", desc: "Instant quotes from vetted shops — prices, ratings, and availability side by side." },
  { step: 4, icon: CreditCard, title: "Book & Finance Your Way", desc: "Schedule online. Payment plans available for all credit profiles." },
  { step: 5, icon: Truck, title: "Track & Get Back on the Road", desc: "Real-time status updates until your car is ready for pickup." },
];

/* ─── Path Toggle ─── */

function PathToggle({
  selectedPath,
  onSwitch,
}: {
  selectedPath: "diy" | "shop";
  onSwitch: (path: "diy" | "shop") => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <button
        onClick={() => onSwitch("diy")}
        className={cn(
          "rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 border-2",
          selectedPath === "diy"
            ? "bg-wrenchli-teal text-white border-wrenchli-teal"
            : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
        )}
      >
        🔧 DIY Path {selectedPath === "diy" && "✓"}
      </button>
      <button
        onClick={() => onSwitch("shop")}
        className={cn(
          "rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 border-2",
          selectedPath === "shop"
            ? "bg-accent text-accent-foreground border-accent"
            : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
        )}
      >
        👨‍🔧 Shop Path {selectedPath === "shop" && "✓"}
      </button>
    </div>
  );
}

/* ─── Component ─── */

export default function HowItWorksVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [hasPlayed, setHasPlayed] = useState(false);
  const [selectedPath, setSelectedPath] = useState<WalkthroughPath>(null);
  const isMobile = useIsMobile();

  const pathSteps = selectedPath === "diy" ? diySteps : selectedPath === "shop" ? shopSteps : defaultSteps;
  const steps = [...sharedSteps, ...pathSteps];

  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      for (let i = 1; i < step; i++) next.add(i);
      return next;
    });
  }, []);

  const handleComplete = useCallback(() => {
    setCompletedSteps(new Set([1, 2, 3, 4, 5]));
    setHasPlayed(true);
  }, []);

  const handleStepClick = useCallback((step: number) => {
    setActiveStep(step);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      for (let i = 1; i < step; i++) next.add(i);
      return next;
    });
    setIsPlaying(true);
  }, []);

  const handleReplay = useCallback(() => {
    setActiveStep(1);
    setCompletedSteps(new Set());
    setSelectedPath(null);
    setIsPlaying(true);
  }, []);

  const handlePathSelect = useCallback((path: "diy" | "shop") => {
    setSelectedPath(path);
    setCompletedSteps(new Set([1, 2]));
  }, []);

  const handlePathSwitch = useCallback((path: "diy" | "shop") => {
    setSelectedPath(path);
    setActiveStep(3);
    setCompletedSteps(new Set([1, 2]));
    setIsPlaying(true);
  }, []);

  return (
    <section className="section-padding bg-background">
      <div className="container-wrenchli">
        {/* Section header */}
        <SectionReveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[3px] text-muted-foreground">
            How It Works
          </p>
          <h2 className="mt-2 text-center font-heading text-2xl font-bold text-foreground md:text-4xl">
            Your car, your choice — in under 70 seconds.
          </h2>
        </SectionReveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[55%_1fr] lg:gap-10 items-start">
          {/* Phone mockup + path toggle */}
          <SectionReveal>
            <div>
              {/* Path toggle — only after initial choice */}
              <AnimatePresence>
                {selectedPath && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PathToggle selectedPath={selectedPath} onSwitch={handlePathSwitch} />
                  </motion.div>
                )}
              </AnimatePresence>

              <PhoneMockup
                activeStep={activeStep}
                onStepChange={handleStepChange}
                isPlaying={isPlaying}
                onPlayingChange={setIsPlaying}
                onComplete={handleComplete}
                selectedPath={selectedPath}
                onPathSelect={handlePathSelect}
              />
            </div>
          </SectionReveal>

          {/* Steps list */}
          <div className="space-y-2">
            <AnimatePresence mode="wait">
              {steps.map((s, i) => {
                const isActive = activeStep === s.step;
                const isCompleted = completedSteps.has(s.step) && !isActive;
                const isPathStep = s.step >= 3;

                // Path-specific border accent for steps 3-5
                const borderClass = isActive
                  ? isPathStep && selectedPath === "diy"
                    ? "border-l-wrenchli-teal bg-wrenchli-teal/5"
                    : isPathStep && selectedPath === "shop"
                      ? "border-l-accent bg-accent/5"
                      : "border-l-accent bg-accent/5"
                  : isCompleted
                    ? isPathStep && selectedPath === "diy"
                      ? "border-l-wrenchli-teal/40"
                      : isPathStep && selectedPath === "shop"
                        ? "border-l-accent/40"
                        : "border-l-accent/40"
                    : "border-l-border";

                const circleClass = isActive || isCompleted
                  ? isPathStep && selectedPath === "diy"
                    ? "bg-wrenchli-teal text-white"
                    : "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground";

                return (
                  <motion.div
                    key={`${selectedPath ?? "default"}-${s.step}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: isPathStep ? (s.step - 3) * 0.08 : 0 }}
                  >
                    <SectionReveal delay={i * 80}>
                      <button
                        onClick={() => handleStepClick(s.step)}
                        className={cn(
                          "w-full text-left flex items-start gap-3 rounded-lg border-l-[3px] px-4 py-3 transition-all duration-300",
                          borderClass,
                          isActive
                            ? "opacity-100 translate-x-1"
                            : isCompleted
                              ? "opacity-80"
                              : "opacity-60 hover:opacity-80 hover:bg-muted/30"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                            circleClass
                          )}
                        >
                          {isCompleted ? <CheckCircle className="h-4 w-4" /> : s.step}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={cn(
                              "font-heading text-sm font-semibold transition-colors",
                              isActive ? "text-foreground" : "text-foreground/80"
                            )}>
                              {s.title}
                            </h3>
                            <s.icon className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-colors",
                              isActive
                                ? isPathStep && selectedPath === "diy"
                                  ? "text-wrenchli-teal"
                                  : "text-accent"
                                : "text-muted-foreground"
                            )} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                        </div>
                      </button>
                    </SectionReveal>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* After-walkthrough CTA */}
        <SectionReveal>
          <div className="mt-10 text-center space-y-3">
            <p className="font-heading text-lg font-bold text-foreground md:text-2xl">
              {isMobile
                ? "Ready to try it? Tap below — takes about 60 seconds."
                : "Ready to try it? Your first diagnosis takes about 60 seconds."}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
                <Link to="/vehicle-insights">
                  Get Your Free Diagnosis <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {hasPlayed && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleReplay}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Watch Again
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              No account required.
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
