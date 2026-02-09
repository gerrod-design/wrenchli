import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search, ClipboardList, GitFork, Wrench, CheckCircle,
  ArrowRight, RotateCcw, Play, Tv, Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/SectionReveal";
import PhoneMockup, { type WalkthroughPath } from "@/components/PhoneMockup";

/* Step definitions that change based on selected path */
const sharedSteps = [
  { step: 1, icon: Search, title: "Tell Us What's Wrong", desc: "Describe your issue in plain English or enter a diagnostic code from your OBD2 scanner." },
  { step: 2, icon: ClipboardList, title: "Get Your Diagnosis", desc: "See what's likely wrong, how urgent it is, and what it might cost." },
];

const diySteps = [
  { step: 3, icon: Tv, title: "Watch a Tutorial", desc: "Get a step-by-step video guide matched to your exact vehicle." },
  { step: 4, icon: Wrench, title: "Order Parts", desc: "One-click ordering for the exact parts your car needs." },
  { step: 5, icon: CheckCircle, title: "Fix It Yourself", desc: "Follow the guide, save hundreds, and feel the satisfaction." },
];

const shopSteps = [
  { step: 3, icon: Store, title: "Compare Shop Quotes", desc: "Get instant quotes from vetted local shops — see prices side by side." },
  { step: 4, icon: GitFork, title: "Choose Financing", desc: "Pay in full or split into payments. All credit types welcome." },
  { step: 5, icon: CheckCircle, title: "Book & Get Fixed", desc: "Pick a time, show up, and get back on the road with confidence." },
];

const branchStep = {
  step: 3,
  icon: GitFork,
  title: "Choose Your Path",
  desc: "Fix it yourself with video guides, or get quotes from trusted local shops.",
};

export default function HowItWorksVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [hasPlayed, setHasPlayed] = useState(false);
  const [selectedPath, setSelectedPath] = useState<WalkthroughPath>(null);

  // Build the visible steps list
  const getSteps = () => {
    if (!selectedPath) {
      // Before a path is chosen, show shared + the branch prompt
      return [...sharedSteps, branchStep];
    }
    return [...sharedSteps, ...(selectedPath === "diy" ? diySteps : shopSteps)];
  };
  const steps = getSteps();

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
    // Mark steps 1-2 as completed
    setCompletedSteps(new Set([1, 2]));
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

        {/* Desktop/Tablet: side by side — Mobile: stacked */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[55%_1fr] lg:gap-10 items-start">
          {/* Animated Phone Mockup */}
          <SectionReveal>
            <PhoneMockup
              activeStep={activeStep}
              onStepChange={handleStepChange}
              isPlaying={isPlaying}
              onPlayingChange={setIsPlaying}
              onComplete={handleComplete}
              selectedPath={selectedPath}
              onPathSelect={handlePathSelect}
            />
          </SectionReveal>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((s, i) => {
              const isActive = activeStep === s.step;
              const isCompleted = completedSteps.has(s.step) && !isActive;

              return (
                <SectionReveal key={`${s.step}-${s.title}`} delay={i * 80}>
                  <button
                    onClick={() => handleStepClick(s.step)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 rounded-lg border-l-[3px] px-4 py-3 transition-all duration-300",
                      isActive
                        ? "border-l-accent bg-accent/5 opacity-100 translate-x-1"
                        : isCompleted
                          ? "border-l-accent/40 opacity-80"
                          : "border-l-border opacity-60 hover:opacity-80 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                        isActive || isCompleted
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
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
                          isActive ? "text-accent" : "text-muted-foreground"
                        )} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </button>
                </SectionReveal>
              );
            })}

            {/* Path indicator pill */}
            {selectedPath && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-semibold",
                  selectedPath === "diy"
                    ? "bg-wrenchli-teal/10 text-wrenchli-teal"
                    : "bg-accent/10 text-accent"
                )}>
                  {selectedPath === "diy" ? "🔧 DIY Path" : "👨‍🔧 Shop Path"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* After-walkthrough CTA */}
        <SectionReveal>
          <div className="mt-10 text-center space-y-3">
            <p className="font-heading text-lg font-bold text-foreground md:text-2xl">
              Ready to try it yourself?
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
              Takes about 60 seconds. No account required.
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
