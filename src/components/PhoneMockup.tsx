import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Search, Wrench, Car, ShieldCheck,
  ScanLine, CheckCircle, ArrowRight, RotateCcw,
  Play, Star, Calendar, CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";
import DeviceFrame from "@/components/walkthrough/DeviceFrame";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  desktopSharedScreens,
  desktopDiyScreens,
  desktopShopScreens,
} from "@/components/walkthrough/desktopScreens";

/* ─── Screen definitions ─── */

/** Shared screens (Segment A): 5 screens mapping to steps 1–2 */
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
            <Car className="h-3 w-3" /> Welcome back! Using: My Camry
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
    step: 1,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <img src={wrenchliLogo} alt="Wrenchli" className="h-4 w-4 rounded object-cover" />
          <span className="text-[10px] font-bold text-primary-foreground">Wrenchli</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <div className="w-full rounded-lg border border-border bg-card p-2">
            <p className="text-[9px] text-muted-foreground mb-1.5">Or enter a diagnostic code:</p>
            <div className="flex items-center gap-1 rounded bg-muted px-2 py-1.5">
              <span className="text-[9px] font-mono font-bold text-foreground">P0420</span>
              <span className="ml-auto rounded-full bg-accent/20 px-1.5 py-0.5 text-[7px] font-semibold text-accent">OBD-II Detected</span>
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
    duration: 2500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">Analyzing…</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
          <div className="relative w-full">
            <div className="mx-auto h-20 w-32 rounded-lg bg-wrenchli-trust-blue/10 flex items-center justify-center">
              <Car className="h-10 w-10 text-wrenchli-trust-blue/40" />
            </div>
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-[9px] font-medium text-foreground">Scanning your 2019 Camry…</span>
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
          <div className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-foreground">Worn Brake Pads</span>
              <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[8px] font-semibold text-yellow-700">🟡 Medium</span>
            </div>
            <p className="text-[8px] leading-relaxed text-muted-foreground mb-2">
              Brake pads worn below safe thickness, causing squeaking.
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
          <div className="mt-2 rounded bg-muted px-2 py-1.5">
            <p className="text-[8px] font-semibold text-foreground">Common Causes</p>
            <p className="text-[7px] text-muted-foreground">Worn pads, glazed rotors, debris</p>
            <p className="text-[7px] text-wrenchli-green font-medium mt-0.5">DIY: 🟢 Easy</p>
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
          <span className="text-[10px] font-bold text-primary-foreground">Your Options</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          <p className="text-[9px] font-bold text-foreground text-center mb-1">Your car. Your choice.</p>
          <div className="rounded-lg border-2 border-wrenchli-teal bg-wrenchli-teal/5 p-2.5">
            <p className="text-[9px] font-bold text-wrenchli-teal mb-1">🔧 Fix It Yourself</p>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="rounded bg-wrenchli-teal/10 px-1.5 py-0.5 text-[7px] text-wrenchli-teal">▶ Watch Tutorial</div>
              <div className="rounded bg-wrenchli-teal/10 px-1.5 py-0.5 text-[7px] text-wrenchli-teal">🛒 Order Parts</div>
            </div>
          </div>
          <div className="rounded-lg border-2 border-accent bg-accent/5 p-2.5">
            <p className="text-[9px] font-bold text-accent mb-1">👨‍🔧 Get It Fixed Professionally</p>
            <div className="rounded bg-accent/10 px-1.5 py-0.5 text-[7px] text-accent w-fit">Get Shop Quotes</div>
          </div>
        </div>
      </div>
    ),
  },
];

/** DIY path screens (4 screens, steps 3–5) */
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
          <p className="text-[8px] font-semibold text-muted-foreground">Tutorials for 2019 Toyota Camry:</p>
          {["Brake Pad Replacement — Full Guide", "Front Brake Pad Swap — 15 min", "Camry Brake Job — Beginner"].map((t, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
              <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded bg-muted">
                <Play className="h-3 w-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-foreground">{t}</p>
                <p className="text-[7px] text-wrenchli-teal">YouTube · Matched to your car</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: 4,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">Order Parts</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          {[
            { name: "Ceramic Brake Pads (Front)", price: "$32.99", store: "AutoZone" },
            { name: "Brake Pad Set (Rear)", price: "$28.49", store: "O'Reilly" },
          ].map((part) => (
            <div key={part.name} className="rounded-lg border border-border bg-card p-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-foreground">{part.name}</span>
                <span className="text-[9px] font-bold text-accent">{part.price}</span>
              </div>
              <span className="text-[7px] text-muted-foreground">{part.store}</span>
            </div>
          ))}
          <div className="rounded bg-muted px-2 py-1.5">
            <p className="text-[8px] font-semibold text-foreground">🔧 Tools You'll Need</p>
            <p className="text-[7px] text-muted-foreground">Jack, lug wrench, C-clamp</p>
            <p className="text-[7px] text-wrenchli-teal mt-0.5">💡 Pro Tip: Auto parts stores offer free loaner tools</p>
          </div>
          <div className="rounded bg-accent px-2 py-1.5 text-center text-[8px] font-bold text-accent-foreground">
            🛒 Add to Cart — $61.48
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 5,
    duration: 3500,
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
              <span className="text-[7px] font-medium text-wrenchli-green">Feb 8: Brake Pads — ✅ Fixed (DIY)</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 5,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">Your Savings</span>
        </div>
        <div className="flex-1 px-3 py-3 flex flex-col items-center justify-center gap-3">
          <div className="w-full rounded-lg border border-wrenchli-green bg-wrenchli-green/5 p-3 text-center">
            <p className="text-[8px] text-muted-foreground mb-1">Your cost</p>
            <p className="text-lg font-bold text-wrenchli-green">$45</p>
            <p className="text-[7px] text-muted-foreground">(parts only)</p>
          </div>
          <p className="text-[9px] text-muted-foreground">vs.</p>
          <div className="w-full rounded-lg border border-border bg-muted p-3 text-center">
            <p className="text-[8px] text-muted-foreground mb-1">Shop price</p>
            <p className="text-lg font-bold text-foreground/50 line-through">$250</p>
          </div>
          <div className="rounded-full bg-wrenchli-green/10 px-3 py-1">
            <p className="text-[9px] font-bold text-wrenchli-green">You saved $205! 🎉</p>
          </div>
        </div>
      </div>
    ),
  },
];

/** Shop path screens (4 screens, steps 3–5) */
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
            { name: "Mike's Auto", price: "$175", dist: "1.2 mi", rating: "4.7" },
            { name: "Detroit Auto Care", price: "$210", dist: "2.8 mi", rating: "4.5" },
            { name: "Metro Brake & Tire", price: "$195", dist: "0.5 mi", rating: "4.8" },
          ].map((shop) => (
            <div key={shop.name} className="rounded-lg border border-border bg-card p-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-foreground">{shop.name}</span>
                <span className="text-[9px] font-bold text-accent">{shop.price}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[7px] text-muted-foreground">{shop.dist}</span>
                <span className="text-[7px] text-yellow-600">{shop.rating} ★</span>
              </div>
            </div>
          ))}
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
          <span className="text-[10px] font-bold text-primary-foreground">Mike's Auto</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
              <ShieldCheck className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-foreground">Mike's Auto</p>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-[8px] text-foreground">4.7</span>
                <span className="text-[7px] text-muted-foreground">(124 reviews)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="rounded-full bg-wrenchli-green/10 px-1.5 py-0.5 text-[7px] font-medium text-wrenchli-green">ASE Certified</span>
            <span className="rounded-full bg-wrenchli-trust-blue/10 px-1.5 py-0.5 text-[7px] font-medium text-wrenchli-trust-blue">Verified</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-2">
            <p className="text-[8px] font-bold text-foreground mb-1">Recent Reviews</p>
            <p className="text-[7px] text-muted-foreground italic">"Great brake work, fair price, done same day." ★★★★★</p>
          </div>
          <div className="rounded bg-accent px-2 py-1.5 text-center text-[8px] font-bold text-accent-foreground">
            Finance This Repair
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 4,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">Financing & Booking</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          <div className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-foreground mb-1">Mike's Auto — $195</p>
            <div className="space-y-1">
              <div className="rounded bg-muted px-2 py-1 flex justify-between">
                <span className="text-[8px] text-muted-foreground">Pay in full</span>
                <span className="text-[8px] font-bold text-foreground">$195</span>
              </div>
              <div className="rounded bg-accent/10 px-2 py-1 flex justify-between border border-accent/30">
                <span className="text-[8px] text-accent font-medium">3 × monthly</span>
                <span className="text-[8px] font-bold text-accent">$65/mo</span>
              </div>
            </div>
            <div className="mt-1.5 rounded-full bg-wrenchli-green/10 px-2 py-0.5 text-center">
              <span className="text-[7px] font-bold text-wrenchli-green">✅ Pre-Approved!</span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-2">
            <p className="text-[8px] font-bold text-foreground mb-1">
              <Calendar className="inline h-3 w-3 mr-1" />Pick a time:
            </p>
            <div className="flex gap-1">
              {["Tue 9am", "Wed 2pm", "Thu 10am"].map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[7px] text-foreground">{t}</span>
              ))}
            </div>
          </div>
          <div className="rounded bg-accent px-2 py-1.5 text-center text-[8px] font-bold text-accent-foreground">
            📅 Book Appointment
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 5,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="text-[10px] font-bold text-primary-foreground">My Garage</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-2">
          {/* Status tracking */}
          <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
            <p className="text-[8px] font-bold text-foreground mb-1.5">Repair Status</p>
            {["In Progress", "Inspection Complete", "Repair Started", "Ready for Pickup!"].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5 mb-0.5">
                <CheckCircle className={cn("h-2.5 w-2.5", i <= 3 ? "text-wrenchli-green" : "text-muted-foreground")} />
                <span className={cn("text-[7px]", i <= 3 ? "text-foreground font-medium" : "text-muted-foreground")}>{s}</span>
              </div>
            ))}
          </div>
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
              <span className="text-[7px] font-medium text-wrenchli-green">Feb 12: Brake Pads — 🔧 Fixed at Mike's Auto</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export type WalkthroughPath = "diy" | "shop" | null;

/* ─── Auto-continue hook ─── */

function useAutoContinue(
  active: boolean,
  seconds: number,
  onTimeout: () => void,
) {
  const [countdown, setCountdown] = useState(seconds);
  const [cancelled, setCancelled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!active || cancelled) {
      setCountdown(seconds);
      return;
    }
    setCountdown(seconds);
    setCancelled(false);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active, cancelled, seconds, onTimeout]);

  const cancel = useCallback(() => {
    setCancelled(true);
    clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    setCancelled(false);
    setCountdown(seconds);
  }, [seconds]);

  return { countdown, cancelled, cancel, reset };
}

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

  const isMobile = useIsMobile();

  // Select screen sets based on viewport
  const activeSharedScreens = isMobile ? sharedScreens : desktopSharedScreens;
  const activeDiyScreens = isMobile ? diyScreens : desktopDiyScreens;
  const activeShopScreens = isMobile ? shopScreens : desktopShopScreens;

  const currentScreens =
    phase === "path" || phase === "done"
      ? selectedPath === "diy" ? activeDiyScreens : activeShopScreens
      : activeSharedScreens;
  const currentScreen = currentScreens[screenIndex];

  // Auto-continue: 8s countdown when choosing
  const handleAutoContinue = useCallback(() => {
    onPathSelect("diy");
    setPhase("path");
    setScreenIndex(0);
    onStepChange(activeDiyScreens[0].step);
    onPlayingChange(true);
  }, [onPathSelect, onStepChange, onPlayingChange, activeDiyScreens]);

  const autoContinue = useAutoContinue(phase === "choosing", 8, handleAutoContinue);

  // Auto-advance screens
  useEffect(() => {
    if (!isPlaying || phase === "choosing" || phase === "done" || phase === "idle") return;

    const timer = setTimeout(() => {
      if (phase === "shared") {
        if (screenIndex < activeSharedScreens.length - 1) {
          const next = screenIndex + 1;
          setScreenIndex(next);
          onStepChange(activeSharedScreens[next].step);
        } else {
          setPhase("choosing");
          onPlayingChange(false);
        }
      } else if (phase === "path") {
        const pathScreens = selectedPath === "diy" ? activeDiyScreens : activeShopScreens;
        if (screenIndex < pathScreens.length - 1) {
          const next = screenIndex + 1;
          setScreenIndex(next);
          onStepChange(pathScreens[next].step);
        } else {
          setPhase("done");
          onPlayingChange(false);
          onComplete();
        }
      }
    }, currentScreen?.duration ?? 2000);

    return () => clearTimeout(timer);
  }, [isPlaying, phase, screenIndex, selectedPath, currentScreen, onStepChange, onPlayingChange, onComplete]);

  const handlePathSelect = useCallback((path: "diy" | "shop") => {
    autoContinue.cancel();
    onPathSelect(path);
    setPhase("path");
    setScreenIndex(0);
    const pathScreens = path === "diy" ? activeDiyScreens : activeShopScreens;
    onStepChange(pathScreens[0].step);
    onPlayingChange(true);
  }, [autoContinue, onPathSelect, onStepChange, onPlayingChange, activeDiyScreens, activeShopScreens]);

  const handlePlay = useCallback(() => {
    autoContinue.reset();
    setPhase("shared");
    setScreenIndex(0);
    onStepChange(activeSharedScreens[0].step);
    onPlayingChange(true);
  }, [autoContinue, onStepChange, onPlayingChange, activeSharedScreens]);

  const handleReplay = useCallback(() => {
    autoContinue.reset();
    setPhase("shared");
    setScreenIndex(0);
    onStepChange(activeSharedScreens[0].step);
    onPlayingChange(true);
  }, [autoContinue, onStepChange, onPlayingChange, activeSharedScreens]);

  const handleWatchOther = useCallback(() => {
    const otherPath = selectedPath === "diy" ? "shop" : "diy";
    handlePathSelect(otherPath);
  }, [selectedPath, handlePathSelect]);

  // Sync external step click
  useEffect(() => {
    if (activeStep === null) return;
    if (activeStep <= 2) {
      const idx = activeSharedScreens.findIndex((s) => s.step === activeStep);
      if (idx !== -1) {
        setPhase("shared");
        setScreenIndex(idx);
      }
    } else if (selectedPath) {
      const pathScreens = selectedPath === "diy" ? activeDiyScreens : activeShopScreens;
      const idx = pathScreens.findIndex((s) => s.step === activeStep);
      if (idx !== -1) {
        setPhase("path");
        setScreenIndex(idx);
      }
    }
  }, [activeStep, activeSharedScreens, activeDiyScreens, activeShopScreens, selectedPath]);

  const renderScreen = () => {
    if (phase === "idle" || phase === "shared" || phase === "choosing") {
      return activeSharedScreens[screenIndex]?.render();
    }
    if (phase === "path" || phase === "done") {
      const pathScreens = selectedPath === "diy" ? activeDiyScreens : activeShopScreens;
      return pathScreens[screenIndex]?.render();
    }
    return activeSharedScreens[0]?.render();
  };

  return (
    <div role="region" aria-label="Interactive branching walkthrough showing how to use Wrenchli">
      <DeviceFrame isPlaying={isPlaying || phase !== "idle"}>
        <div className="absolute inset-0">{renderScreen()}</div>

        {/* Play overlay */}
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
              <p className={cn("font-medium text-primary-foreground", isMobile ? "text-[11px]" : "text-sm")}>See the walkthrough</p>
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
              role="dialog"
              aria-label="Choose your path"
            >
              <p id="branch-question" className={cn(
                "font-heading font-bold text-white text-center mb-3 leading-tight",
                isMobile ? "text-[13px]" : "text-lg"
              )}>
                Now, how do you want to fix it?
              </p>

              <div
                className={cn(
                  "gap-3 w-full",
                  isMobile ? "flex flex-col max-w-[220px]" : "grid grid-cols-2 max-w-md"
                )}
                role="group"
                aria-labelledby="branch-question"
              >
                <button
                  onClick={() => handlePathSelect("diy")}
                  className={cn(
                    "rounded-xl text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border-2 border-wrenchli-teal",
                    isMobile ? "p-3" : "p-5"
                  )}
                  style={{ backgroundColor: "rgba(22, 160, 133, 0.2)" }}
                  aria-label="Watch the DIY path"
                >
                  <p className={cn(isMobile ? "text-lg mb-1" : "text-2xl mb-2")}>🔧</p>
                  <p className={cn("font-bold text-white", isMobile ? "text-[10px] mb-0.5" : "text-sm mb-1")}>WATCH THE DIY PATH</p>
                  <p className={cn("text-white/80 leading-snug", isMobile ? "text-[8px]" : "text-xs")}>Fix it yourself with video guides and parts links</p>
                  <p className={cn("text-white/50 mt-1", isMobile ? "text-[7px]" : "text-[10px]")}>~35 seconds</p>
                </button>

                <button
                  onClick={() => handlePathSelect("shop")}
                  className={cn(
                    "rounded-xl text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border-2 border-accent",
                    isMobile ? "p-3" : "p-5"
                  )}
                  style={{ backgroundColor: "rgba(230, 126, 34, 0.2)" }}
                  aria-label="Watch the shop path"
                >
                  <p className={cn(isMobile ? "text-lg mb-1" : "text-2xl mb-2")}>👨‍🔧</p>
                  <p className={cn("font-bold text-white", isMobile ? "text-[10px] mb-0.5" : "text-sm mb-1")}>WATCH THE SHOP PATH</p>
                  <p className={cn("text-white/80 leading-snug", isMobile ? "text-[8px]" : "text-xs")}>Get quotes from trusted local shops with financing</p>
                  <p className={cn("text-white/50 mt-1", isMobile ? "text-[7px]" : "text-[10px]")}>~35 seconds</p>
                </button>
              </div>

              <p className={cn("text-white/60 mt-2 text-center", isMobile ? "text-[8px]" : "text-xs")}>Or watch both — start with either.</p>

              {/* Auto-continue countdown */}
              {!autoContinue.cancelled && (
                <p className={cn("text-white/40 mt-2", isMobile ? "text-[8px]" : "text-xs")}>
                  Auto-playing DIY path in {autoContinue.countdown}…{" "}
                  <button
                    onClick={autoContinue.cancel}
                    className="text-white/70 underline hover:text-white"
                  >
                    Cancel
                  </button>
                </p>
              )}
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
              <p className={cn(
                "font-heading font-bold text-white text-center",
                isMobile ? "text-[13px]" : "text-lg"
              )}>
                Ready to try it yourself?
              </p>

              <Link
                to="/vehicle-insights"
                className={cn(
                  "rounded-lg bg-accent font-bold text-accent-foreground hover:bg-accent/90 transition-colors",
                  isMobile ? "px-4 py-2 text-[10px]" : "px-6 py-3 text-sm"
                )}
              >
                Get Your Free Diagnosis
              </Link>

              <button
                onClick={handleWatchOther}
                className={cn(
                  "flex items-center gap-1 text-white/70 hover:text-white transition-colors",
                  isMobile ? "text-[9px]" : "text-xs"
                )}
              >
                <Play className="h-3 w-3" />
                Watch the {selectedPath === "diy" ? "Shop" : "DIY"} path instead
              </button>

              <button
                onClick={handleReplay}
                className={cn(
                  "flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors",
                  isMobile ? "text-[9px]" : "text-xs"
                )}
              >
                <RotateCcw className="h-3 w-3" />
                Replay from the beginning
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DeviceFrame>
    </div>
  );
}
