import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Search, ClipboardList, Wrench, Car, ShieldCheck,
  ScanLine, CheckCircle, ArrowRight,
} from "lucide-react";

/** Each "screen" matches a step in the walkthrough. */
const screens = [
  {
    step: 1,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        {/* Fake nav */}
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <div className="h-4 w-4 rounded bg-accent" />
          <span className="text-[10px] font-bold text-primary-foreground">Wrenchli</span>
        </div>
        {/* Quick action bar area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[9px] text-muted-foreground">
            <Car className="h-3 w-3" /> Using: My Camry
          </div>
          <div className="w-full rounded-lg border border-border bg-card p-2">
            <p className="text-[9px] text-muted-foreground mb-1.5">What's wrong with your car?</p>
            <div className="flex items-center gap-1 rounded bg-muted px-2 py-1.5">
              <Search className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] font-medium text-foreground animate-pulse">my brakes are squeaking…</span>
            </div>
          </div>
          <div className="w-full rounded-md bg-accent px-3 py-1.5 text-center text-[9px] font-bold text-accent-foreground">
            Get Your Diagnosis
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">Diagnosis</span>
        </div>
        <div className="flex-1 overflow-hidden px-3 py-3">
          {/* Scanning anim placeholder */}
          <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-primary/5 py-3">
            <ScanLine className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-[9px] font-medium text-foreground">Analyzing your Camry…</span>
          </div>
          {/* Result card */}
          <div className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-foreground">Worn Brake Pads</span>
              <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[8px] font-semibold text-yellow-700">🟡 Medium</span>
            </div>
            <p className="text-[8px] leading-relaxed text-muted-foreground mb-2">
              Brake pads have worn below safe thickness, causing squeaking when stopping.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded bg-muted px-2 py-1">
                <p className="text-[7px] text-muted-foreground">DIY</p>
                <p className="text-[9px] font-bold text-foreground">$25–$60</p>
              </div>
              <div className="rounded bg-muted px-2 py-1">
                <p className="text-[7px] text-muted-foreground">Professional</p>
                <p className="text-[9px] font-bold text-foreground">$150–$350</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 3,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">Your Options</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          {/* DIY path */}
          <div className="rounded-lg border-2 border-wrenchli-teal bg-wrenchli-teal/5 p-2.5">
            <p className="text-[9px] font-bold text-wrenchli-teal mb-1">Fix It Yourself</p>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="rounded bg-wrenchli-teal/10 px-1.5 py-0.5 text-[7px] text-wrenchli-teal">▶ Watch Tutorial</div>
              <div className="rounded bg-wrenchli-teal/10 px-1.5 py-0.5 text-[7px] text-wrenchli-teal">🛒 Order Parts</div>
            </div>
            <p className="text-[7px] text-muted-foreground">Matched to 2019 Toyota Camry</p>
          </div>
          {/* Pro path */}
          <div className="rounded-lg border-2 border-wrenchli-trust-blue bg-wrenchli-trust-blue/5 p-2.5">
            <p className="text-[9px] font-bold text-wrenchli-trust-blue mb-1">Get It Fixed Professionally</p>
            <div className="rounded bg-wrenchli-trust-blue/10 px-1.5 py-0.5 text-[7px] text-wrenchli-trust-blue w-fit">Get Shop Quotes</div>
            <p className="mt-1 text-[7px] text-muted-foreground">Compare prices from vetted shops</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 4,
    duration: 3000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">Shop Quotes</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          {[
            { name: "Metro Brake & Tire", price: "$185", dist: "2.1 mi", rating: "4.8 ★" },
            { name: "Detroit Auto Care", price: "$210", dist: "3.4 mi", rating: "4.6 ★" },
            { name: "Precision Motors", price: "$240", dist: "5.0 mi", rating: "4.9 ★" },
          ].map((shop) => (
            <div key={shop.name} className="rounded-lg border border-border bg-card p-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-foreground">{shop.name}</span>
                <span className="text-[9px] font-bold text-accent">{shop.price}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[7px] text-muted-foreground">{shop.dist}</span>
                <span className="text-[7px] text-yellow-600">{shop.rating}</span>
              </div>
            </div>
          ))}
          <div className="rounded bg-accent/10 px-2 py-1.5 text-center text-[8px] font-semibold text-accent">
            💳 Financing available — all credit types
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 5,
    duration: 3000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">My Garage</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          <div className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-wrenchli-trust-blue/10">
                <Car className="h-3 w-3 text-wrenchli-trust-blue" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-foreground">2019 Toyota Camry</p>
                <p className="text-[7px] text-muted-foreground">Blue · My Camry</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded bg-wrenchli-green/10 px-2 py-1">
              <CheckCircle className="h-3 w-3 text-wrenchli-green" />
              <span className="text-[7px] font-medium text-wrenchli-green">Brake Pads — ✅ Fixed (DIY)</span>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-border bg-muted/50 p-2.5 text-center">
            <p className="text-[8px] text-muted-foreground">+ Add another vehicle</p>
          </div>
          <p className="text-center text-[9px] font-bold text-foreground mt-2">Car repair, finally fixed.</p>
        </div>
      </div>
    ),
  },
];

interface PhoneMockupProps {
  activeStep: number | null;
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  onComplete: () => void;
}

export default function PhoneMockup({
  activeStep,
  onStepChange,
  isPlaying,
  onPlayingChange,
  onComplete,
}: PhoneMockupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance screens when playing
  useEffect(() => {
    if (!isPlaying) return;

    const screen = screens[currentIndex];
    const timer = setTimeout(() => {
      if (currentIndex < screens.length - 1) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        onStepChange(screens[next].step);
      } else {
        onPlayingChange(false);
        onComplete();
      }
    }, screen.duration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, onStepChange, onPlayingChange, onComplete]);

  // Sync external activeStep → internal index
  useEffect(() => {
    if (activeStep !== null) {
      const idx = screens.findIndex((s) => s.step === activeStep);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  }, [activeStep]);

  const handlePlay = useCallback(() => {
    setCurrentIndex(0);
    onStepChange(screens[0].step);
    onPlayingChange(true);
  }, [onStepChange, onPlayingChange]);

  return (
    <div className="flex items-center justify-center">
      {/* Phone frame */}
      <div className="relative w-[260px] rounded-[32px] border-[3px] border-foreground/20 bg-foreground/5 p-2.5 shadow-xl sm:w-[280px]">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/20" />

        {/* Screen */}
        <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[20px] bg-background">
          {screens.map((screen, i) => (
            <div
              key={screen.step}
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                i === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              {screen.render()}
            </div>
          ))}

          {/* Play overlay when not playing and at start */}
          {!isPlaying && (
            <button
              onClick={handlePlay}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-primary/80 transition-all hover:bg-primary/70"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform hover:scale-110">
                <ArrowRight className="h-6 w-6 text-primary ml-0.5" />
              </div>
              <p className="text-[11px] font-medium text-primary-foreground">
                See the walkthrough
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
