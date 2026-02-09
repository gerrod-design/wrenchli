import {
  Search, Wrench, Car, ShieldCheck,
  ScanLine, CheckCircle, ArrowRight,
  Play, Star, Calendar, CreditCard,
} from "lucide-react";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

/* ─── Desktop Shared Screens (wider 16:10 layout) ─── */

export const desktopSharedScreens = [
  {
    step: 1,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <img src={wrenchliLogo} alt="Wrenchli" className="h-6 w-6 rounded object-cover" />
          <span className="text-sm font-bold text-primary-foreground">Wrenchli</span>
          <div className="ml-auto flex items-center gap-6 text-xs text-primary-foreground/70">
            <span>For Car Owners</span>
            <span>For Shops</span>
            <span>Vehicle Insights</span>
            <span>My Garage</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-12">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs text-muted-foreground">
            <Car className="h-4 w-4" /> Welcome back! Using: My Camry
          </div>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-2">What's wrong with your car?</p>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground animate-pulse">my brakes are squeaking…</span>
            </div>
          </div>
          <div className="w-full max-w-md rounded-lg bg-accent px-6 py-3 text-center text-sm font-bold text-accent-foreground">
            Get Your Diagnosis
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 1,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <img src={wrenchliLogo} alt="Wrenchli" className="h-6 w-6 rounded object-cover" />
          <span className="text-sm font-bold text-primary-foreground">Wrenchli</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-12">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-2">Or enter a diagnostic code:</p>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
              <span className="text-sm font-mono font-bold text-foreground">P0420</span>
              <span className="ml-auto rounded-full bg-accent/20 px-3 py-1 text-[10px] font-semibold text-accent">OBD-II Detected</span>
            </div>
          </div>
          <div className="w-full max-w-md rounded-lg bg-accent px-6 py-3 text-center text-sm font-bold text-accent-foreground">
            Get Your Diagnosis
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    duration: 1500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Analyzing…</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-12">
          <div className="relative w-full max-w-sm">
            <div className="mx-auto h-28 w-48 rounded-xl bg-wrenchli-trust-blue/10 flex items-center justify-center">
              <Car className="h-14 w-14 text-wrenchli-trust-blue/40" />
            </div>
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-accent animate-pulse" />
            <span className="text-sm font-medium text-foreground">Scanning your 2019 Camry…</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Diagnosis</span>
        </div>
        <div className="flex-1 overflow-hidden px-8 py-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold text-foreground">Worn Brake Pads</span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">🟡 Medium</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground mb-3">
              Brake pads worn below safe thickness, causing squeaking.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted px-4 py-2">
                <p className="text-[10px] text-muted-foreground">DIY</p>
                <p className="text-sm font-bold text-foreground">$25–$60</p>
              </div>
              <div className="rounded-lg bg-muted px-4 py-2">
                <p className="text-[10px] text-muted-foreground">Professional</p>
                <p className="text-sm font-bold text-foreground">$150–$350</p>
              </div>
            </div>
          </div>
          <div className="mt-3 max-w-lg mx-auto rounded-lg bg-muted px-4 py-2">
            <p className="text-xs font-semibold text-foreground">Common Causes</p>
            <p className="text-[10px] text-muted-foreground">Worn pads, glazed rotors, debris</p>
            <p className="text-[10px] text-wrenchli-green font-medium mt-0.5">DIY: 🟢 Easy</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Your Options</span>
        </div>
        <div className="flex-1 px-8 py-5 flex flex-col items-center justify-center">
          <p className="text-sm font-bold text-foreground text-center mb-4">Your car. Your choice.</p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
            <div className="rounded-xl border-2 border-wrenchli-teal bg-wrenchli-teal/5 p-4">
              <p className="text-sm font-bold text-wrenchli-teal mb-2">🔧 Fix It Yourself</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded bg-wrenchli-teal/10 px-2 py-1 text-[10px] text-wrenchli-teal">▶ Watch Tutorial</span>
                <span className="rounded bg-wrenchli-teal/10 px-2 py-1 text-[10px] text-wrenchli-teal">🛒 Order Parts</span>
              </div>
            </div>
            <div className="rounded-xl border-2 border-accent bg-accent/5 p-4">
              <p className="text-sm font-bold text-accent mb-2">👨‍🔧 Get It Fixed Professionally</p>
              <span className="rounded bg-accent/10 px-2 py-1 text-[10px] text-accent">Get Shop Quotes</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

/* ─── Desktop DIY Screens ─── */

export const desktopDiyScreens = [
  {
    step: 3,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">DIY Tutorial</span>
        </div>
        <div className="flex-1 px-8 py-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">Tutorials for 2019 Toyota Camry:</p>
          {["Brake Pad Replacement — Full Guide", "Front Brake Pad Swap — 15 min", "Camry Brake Job — Beginner"].map((t, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Play className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{t}</p>
                <p className="text-[10px] text-wrenchli-teal">YouTube · Matched to your car</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: 4,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Order Parts</span>
        </div>
        <div className="flex-1 px-8 py-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { name: "Ceramic Brake Pads (Front)", price: "$32.99", store: "AutoZone" },
              { name: "Brake Pad Set (Rear)", price: "$28.49", store: "O'Reilly" },
            ].map((part) => (
              <div key={part.name} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{part.name}</span>
                  <span className="text-xs font-bold text-accent">{part.price}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{part.store}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-muted px-4 py-3 mb-3">
            <p className="text-xs font-semibold text-foreground">🔧 Tools You'll Need</p>
            <p className="text-[10px] text-muted-foreground">Jack, lug wrench, C-clamp</p>
            <p className="text-[10px] text-wrenchli-teal mt-0.5">💡 Pro Tip: Auto parts stores offer free loaner tools</p>
          </div>
          <div className="rounded-lg bg-accent px-4 py-3 text-center text-xs font-bold text-accent-foreground">
            🛒 Add to Cart — $61.48
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 5,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">My Garage</span>
        </div>
        <div className="flex-1 px-8 py-5">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wrenchli-teal/10">
                <Wrench className="h-5 w-5 text-wrenchli-teal" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">2019 Toyota Camry</p>
                <p className="text-[10px] text-muted-foreground">Blue · My Camry</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-wrenchli-green/10 px-3 py-2">
              <CheckCircle className="h-4 w-4 text-wrenchli-green" />
              <span className="text-xs font-medium text-wrenchli-green">Feb 8: Brake Pads — ✅ Fixed (DIY)</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 5,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Your Savings</span>
        </div>
        <div className="flex-1 px-8 py-5 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4 items-center max-w-lg w-full">
            <div className="rounded-xl border border-wrenchli-green bg-wrenchli-green/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Your cost</p>
              <p className="text-2xl font-bold text-wrenchli-green">$45</p>
              <p className="text-[10px] text-muted-foreground">(parts only)</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">vs.</p>
            <div className="rounded-xl border border-border bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Shop price</p>
              <p className="text-2xl font-bold text-foreground/50 line-through">$250</p>
            </div>
          </div>
        </div>
        <div className="text-center pb-4">
          <span className="rounded-full bg-wrenchli-green/10 px-4 py-1.5 text-sm font-bold text-wrenchli-green">You saved $205! 🎉</span>
        </div>
      </div>
    ),
  },
];

/* ─── Desktop Shop Screens ─── */

export const desktopShopScreens = [
  {
    step: 3,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Shop Quotes</span>
        </div>
        <div className="flex-1 px-8 py-5 space-y-3">
          {[
            { name: "Mike's Auto", price: "$175", dist: "1.2 mi", rating: "4.7" },
            { name: "Detroit Auto Care", price: "$210", dist: "2.8 mi", rating: "4.5" },
            { name: "Metro Brake & Tire", price: "$195", dist: "0.5 mi", rating: "4.8" },
          ].map((shop) => (
            <div key={shop.name} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm">
              <div>
                <span className="text-xs font-bold text-foreground">{shop.name}</span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{shop.dist}</span>
                  <span className="text-[10px] text-yellow-600">{shop.rating} ★</span>
                </div>
              </div>
              <span className="text-sm font-bold text-accent">{shop.price}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: 3,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Mike's Auto</span>
        </div>
        <div className="flex-1 px-8 py-5">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <ShieldCheck className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Mike's Auto</p>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs text-foreground">4.7</span>
                  <span className="text-[10px] text-muted-foreground">(124 reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-wrenchli-green/10 px-3 py-1 text-[10px] font-medium text-wrenchli-green">ASE Certified</span>
              <span className="rounded-full bg-wrenchli-trust-blue/10 px-3 py-1 text-[10px] font-medium text-wrenchli-trust-blue">Verified</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-bold text-foreground mb-1">Recent Reviews</p>
              <p className="text-[10px] text-muted-foreground italic">"Great brake work, fair price, done same day." ★★★★★</p>
            </div>
            <div className="rounded-lg bg-accent px-4 py-2 text-center text-xs font-bold text-accent-foreground">
              Finance This Repair
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 4,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Financing & Booking</span>
        </div>
        <div className="flex-1 px-8 py-5">
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-bold text-foreground mb-2">Mike's Auto — $195</p>
              <div className="space-y-2">
                <div className="rounded-lg bg-muted px-3 py-2 flex justify-between">
                  <span className="text-[10px] text-muted-foreground">Pay in full</span>
                  <span className="text-xs font-bold text-foreground">$195</span>
                </div>
                <div className="rounded-lg bg-accent/10 px-3 py-2 flex justify-between border border-accent/30">
                  <span className="text-[10px] text-accent font-medium">3 × monthly</span>
                  <span className="text-xs font-bold text-accent">$65/mo</span>
                </div>
              </div>
              <div className="mt-2 rounded-full bg-wrenchli-green/10 px-3 py-1 text-center">
                <span className="text-[10px] font-bold text-wrenchli-green">✅ Pre-Approved!</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />Pick a time:
              </p>
              <div className="flex flex-wrap gap-2">
                {["Tue 9am", "Wed 2pm", "Thu 10am"].map((t) => (
                  <span key={t} className="rounded-lg bg-muted px-3 py-1.5 text-[10px] text-foreground">{t}</span>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-accent px-3 py-2 text-center text-xs font-bold text-accent-foreground">
                📅 Book Appointment
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 5,
    duration: 2000,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">My Garage</span>
        </div>
        <div className="flex-1 px-8 py-5">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <p className="text-xs font-bold text-foreground mb-2">Repair Status</p>
              {["In Progress", "Inspection Complete", "Repair Started", "Ready for Pickup!"].map((s, i) => (
                <div key={s} className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-3 w-3 text-wrenchli-green" />
                  <span className="text-[10px] text-foreground font-medium">{s}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wrenchli-trust-blue/10">
                  <Car className="h-5 w-5 text-wrenchli-trust-blue" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">2019 Toyota Camry</p>
                  <p className="text-[10px] text-muted-foreground">Blue · My Camry</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-wrenchli-green/10 px-3 py-2">
                <CheckCircle className="h-4 w-4 text-wrenchli-green" />
                <span className="text-xs font-medium text-wrenchli-green">Feb 12: Brake Pads — 🔧 Fixed at Mike's Auto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];
