import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Search, ClipboardList, Wrench, Car, ShieldCheck,
  ScanLine, CheckCircle, ArrowRight, RotateCcw,
  Play, Store,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

/* ─── Screen definitions ─── */

/** Shared screens (steps 1–2) shown to everyone */
const sharedScreens = [
  {
    step: 1,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <img src={wrenchliLogo} alt="Wrenchli" className="h-4 w-4 rounded object-cover" />
          <span className="text-[10px] font-bold text-primary-foreground">Wrenchli</span>
        </div>
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
          <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-primary/5 py-3">
            <ScanLine className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-[9px] font-medium text-foreground">Analyzing your Camry…</span>
          </div>
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
];

/** DIY path screens (steps 3–5) */
const diyScreens = [
  {
    step: 3,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">DIY Tutorial</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          <div className="rounded-lg border-2 border-wrenchli-teal bg-wrenchli-teal/5 p-2.5">
            <p className="text-[9px] font-bold text-wrenchli-teal mb-1">▶ How to Replace Brake Pads</p>
            <div className="aspect-video rounded bg-muted flex items-center justify-center">
              <Play className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-1.5 text-[7px] text-muted-foreground">Matched to 2019 Toyota Camry · 12 min</p>
          </div>
          <div className="rounded bg-wrenchli-teal/10 px-2 py-1.5 text-center text-[8px] font-semibold text-wrenchli-teal">
            🔧 Difficulty: Beginner-Friendly
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
          <span className="text-[10px] font-bold text-primary-foreground">Order Parts</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          {[
            { name: "Ceramic Brake Pads (Front)", price: "$32.99", brand: "Bosch" },
            { name: "Brake Pad Set (Rear)", price: "$28.49", brand: "ACDelco" },
          ].map((part) => (
            <div key={part.name} className="rounded-lg border border-border bg-card p-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-foreground">{part.name}</span>
                <span className="text-[9px] font-bold text-accent">{part.price}</span>
              </div>
              <span className="text-[7px] text-muted-foreground">{part.brand}</span>
            </div>
          ))}
          <div className="rounded bg-accent px-2 py-1.5 text-center text-[8px] font-bold text-accent-foreground">
            🛒 Add to Cart — $61.48
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
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-wrenchli-teal/10">
                <Wrench className="h-3 w-3 text-wrenchli-teal" />
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
          <p className="text-center text-[9px] font-bold text-foreground mt-2">You saved $150+</p>
        </div>
      </div>
    ),
  },
];

/** Shop path screens (steps 3–5) */
const shopScreens = [
  {
    step: 3,
    duration: 3500,
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
          <span className="text-[10px] font-bold text-primary-foreground">Financing</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          <div className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-foreground mb-1">Metro Brake & Tire — $185</p>
            <div className="space-y-1">
              <div className="rounded bg-muted px-2 py-1 flex justify-between">
                <span className="text-[8px] text-muted-foreground">Pay in full</span>
                <span className="text-[8px] font-bold text-foreground">$185</span>
              </div>
              <div className="rounded bg-accent/10 px-2 py-1 flex justify-between border border-accent/30">
                <span className="text-[8px] text-accent font-medium">4 payments</span>
                <span className="text-[8px] font-bold text-accent">$46.25/mo</span>
              </div>
            </div>
          </div>
          <div className="rounded bg-accent/10 px-2 py-1.5 text-center text-[8px] font-semibold text-accent">
            💳 All credit types welcome
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
              <span className="text-[7px] font-medium text-wrenchli-green">Brake Pads — ✅ Fixed (Shop)</span>
            </div>
            <p className="mt-1 text-[7px] text-muted-foreground">Metro Brake & Tire · Appointment: Tues 10am</p>
          </div>
          <p className="text-center text-[9px] font-bold text-foreground mt-2">Car repair, finally fixed.</p>
        </div>
      </div>
    ),
  },
];

export type WalkthroughPath = "diy" | "shop" | null;

/* ─── Component ─── */

interface PhoneMockupProps {
  activeStep: number | null;
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  onComplete: () => void;
  selectedPath: WalkthroughPath;
  onPathSelect: (path: "diy" | "shop") => void;
}

type Phase = "idle" | "shared" | "choosing" | "path" | "done";

export default function PhoneMockup({
  activeStep,
  onStepChange,
  isPlaying,
  onPlayingChange,
  onComplete,
  selectedPath,
  onPathSelect,
}: PhoneMockupProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [screenIndex, setScreenIndex] = useState(0);

  // Get the active screen list based on phase
  const getScreens = () => {
    if (phase === "shared" || phase === "choosing") return sharedScreens;
    if (phase === "path" || phase === "done") {
      return selectedPath === "diy" ? diyScreens : shopScreens;
    }
    return sharedScreens;
  };

  const currentScreens = getScreens();
  const currentScreen = currentScreens[screenIndex];

  // Auto-advance screens
  useEffect(() => {
    if (!isPlaying || phase === "choosing" || phase === "done" || phase === "idle") return;

    const timer = setTimeout(() => {
      if (phase === "shared") {
        if (screenIndex < sharedScreens.length - 1) {
          const next = screenIndex + 1;
          setScreenIndex(next);
          onStepChange(sharedScreens[next].step);
        } else {
          // Shared segment done → show choice
          setPhase("choosing");
          onPlayingChange(false);
        }
      } else if (phase === "path") {
        const pathScreens = selectedPath === "diy" ? diyScreens : shopScreens;
        if (screenIndex < pathScreens.length - 1) {
          const next = screenIndex + 1;
          setScreenIndex(next);
          onStepChange(pathScreens[next].step);
        } else {
          // Path complete
          setPhase("done");
          onPlayingChange(false);
          onComplete();
        }
      }
    }, currentScreen?.duration ?? 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, phase, screenIndex, selectedPath, currentScreen, onStepChange, onPlayingChange, onComplete]);

  // Handle path selection
  const handlePathSelect = useCallback((path: "diy" | "shop") => {
    onPathSelect(path);
    setPhase("path");
    setScreenIndex(0);
    const pathScreens = path === "diy" ? diyScreens : shopScreens;
    onStepChange(pathScreens[0].step);
    onPlayingChange(true);
  }, [onPathSelect, onStepChange, onPlayingChange]);

  // Handle initial play
  const handlePlay = useCallback(() => {
    setPhase("shared");
    setScreenIndex(0);
    onStepChange(sharedScreens[0].step);
    onPlayingChange(true);
  }, [onStepChange, onPlayingChange]);

  // Handle replay
  const handleReplay = useCallback(() => {
    setPhase("shared");
    setScreenIndex(0);
    onStepChange(sharedScreens[0].step);
    onPlayingChange(true);
  }, [onStepChange, onPlayingChange]);

  // Handle watch other path
  const handleWatchOther = useCallback(() => {
    const otherPath = selectedPath === "diy" ? "shop" : "diy";
    handlePathSelect(otherPath);
  }, [selectedPath, handlePathSelect]);

  // Handle step click from sidebar
  useEffect(() => {
    if (activeStep === null) return;

    // Steps 1-2 are shared
    if (activeStep <= 2) {
      const idx = sharedScreens.findIndex((s) => s.step === activeStep);
      if (idx !== -1) {
        setPhase("shared");
        setScreenIndex(idx);
      }
    } else if (selectedPath) {
      // Steps 3-5 require a path
      const pathScreens = selectedPath === "diy" ? diyScreens : shopScreens;
      const idx = pathScreens.findIndex((s) => s.step === activeStep);
      if (idx !== -1) {
        setPhase("path");
        setScreenIndex(idx);
      }
    }
  }, [activeStep]);

  // Compute which screen to render
  const renderScreen = () => {
    if (phase === "idle" || phase === "shared" || phase === "choosing") {
      return sharedScreens[screenIndex]?.render();
    }
    if (phase === "path" || phase === "done") {
      const pathScreens = selectedPath === "diy" ? diyScreens : shopScreens;
      return pathScreens[screenIndex]?.render();
    }
    return sharedScreens[0]?.render();
  };

  return (
    <div className="flex items-center justify-center" role="region" aria-label="Interactive branching walkthrough showing how to use Wrenchli">
      <div className="relative w-[260px] rounded-[32px] border-[3px] border-foreground/20 bg-foreground/5 p-2.5 shadow-xl sm:w-[280px]">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/20" aria-hidden="true" />

        {/* Screen */}
        <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[20px] bg-background">
          {/* Active screen content */}
          <div className="absolute inset-0">{renderScreen()}</div>

          {/* Play overlay (initial state) */}
          <AnimatePresence>
            {phase === "idle" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={handlePlay}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-primary/80"
                aria-label="Play walkthrough animation"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform hover:scale-110">
                  <ArrowRight className="h-6 w-6 text-primary ml-0.5" />
                </div>
                <p className="text-[11px] font-medium text-primary-foreground">See the walkthrough</p>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Branch choice overlay */}
          <AnimatePresence>
            {phase === "choosing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center px-3 py-4"
                style={{ backgroundColor: "rgba(30, 58, 95, 0.92)" }}
              >
                <p className="font-heading text-[13px] font-bold text-white text-center mb-3 leading-tight">
                  Now, how do you want to fix it?
                </p>

                <div className="flex flex-col gap-2 w-full max-w-[220px]">
                  {/* DIY card */}
                  <button
                    onClick={() => handlePathSelect("diy")}
                    className="rounded-xl p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border-2 border-wrenchli-teal"
                    style={{ backgroundColor: "rgba(22, 160, 133, 0.2)" }}
                  >
                    <p className="text-lg mb-1">🔧</p>
                    <p className="text-[10px] font-bold text-white mb-0.5">WATCH THE DIY PATH</p>
                    <p className="text-[8px] text-white/80 leading-snug">Fix it yourself with video guides and parts links</p>
                    <p className="text-[7px] text-white/50 mt-1">~35 seconds</p>
                  </button>

                  {/* Shop card */}
                  <button
                    onClick={() => handlePathSelect("shop")}
                    className="rounded-xl p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border-2 border-accent"
                    style={{ backgroundColor: "rgba(230, 126, 34, 0.2)" }}
                  >
                    <p className="text-lg mb-1">👨‍🔧</p>
                    <p className="text-[10px] font-bold text-white mb-0.5">WATCH THE SHOP PATH</p>
                    <p className="text-[8px] text-white/80 leading-snug">Get quotes from trusted local shops with financing</p>
                    <p className="text-[7px] text-white/50 mt-1">~35 seconds</p>
                  </button>
                </div>

                <p className="text-[8px] text-white/60 mt-3 text-center">Or watch both — start with either.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion overlay */}
          <AnimatePresence>
            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 py-4 gap-3"
                style={{ backgroundColor: "rgba(30, 58, 95, 0.92)" }}
              >
                <p className="font-heading text-[13px] font-bold text-white text-center">
                  Ready to try it yourself?
                </p>

                <Link
                  to="/vehicle-insights"
                  className="rounded-lg bg-accent px-4 py-2 text-[10px] font-bold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  Get Your Free Diagnosis
                </Link>

                <button
                  onClick={handleWatchOther}
                  className="flex items-center gap-1 text-[9px] text-white/70 hover:text-white transition-colors"
                >
                  <Play className="h-3 w-3" />
                  Watch the {selectedPath === "diy" ? "Shop" : "DIY"} path instead
                </button>

                <button
                  onClick={handleReplay}
                  className="flex items-center gap-1 text-[9px] text-white/50 hover:text-white/80 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Replay from the beginning
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
