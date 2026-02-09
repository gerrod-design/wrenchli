import {
  Search, Wrench, Car, ShieldCheck,
  ScanLine, CheckCircle, ArrowRight,
  Play, Star, Calendar, CreditCard,
  MapPin, DollarSign, Scale, Clock,
} from "lucide-react";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

/* ─── Desktop Shared Screens (wider 16:10 layout) ─── */

export const desktopSharedScreens = [
  {
    step: 1,
    duration: 3500,
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
    duration: 3500,
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
    duration: 2500,
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
    duration: 3500,
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
    duration: 3500,
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
    duration: 3500,
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
    duration: 3500,
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
    duration: 3500,
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
    duration: 3500,
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
  /* ZIP Code Entry */
  {
    step: 3,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Get Your Repair Estimate</span>
        </div>
        <div className="flex-1 px-8 py-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Enter Your ZIP Code</p>
                  <p className="text-[10px] text-muted-foreground">We'll estimate costs for shops in your area</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted px-4 py-3 text-center">
                <span className="text-lg font-mono font-bold tracking-widest text-foreground">48201</span>
              </div>
              <div className="rounded-lg bg-accent px-4 py-3 text-center text-xs font-bold text-accent-foreground">
                <DollarSign className="inline h-3.5 w-3.5 mr-1" /> Get Cost Estimate
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  /* AI Cost Estimate Results */
  {
    step: 3,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Cost Estimate</span>
        </div>
        <div className="flex-1 px-8 py-4 overflow-hidden">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> Detroit Metro Area
            </div>
            <div className="text-center py-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">Estimated Repair Cost</p>
              <p className="text-3xl font-extrabold text-accent">$350 – $800</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                <p className="text-[9px] text-muted-foreground">Parts</p>
                <p className="text-[10px] font-semibold">$120–$350</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                <p className="text-[9px] text-muted-foreground">Labor</p>
                <p className="text-[10px] font-semibold">$230–$450</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                <p className="text-[9px] text-muted-foreground">Est. Time</p>
                <p className="text-[10px] font-semibold">2–3 hours</p>
              </div>
            </div>
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-2 flex items-start gap-2">
              <CreditCard className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-foreground">☑ I'm interested in financing this repair</p>
                <p className="text-[9px] text-muted-foreground">We'll notify you when financing is available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  /* Repair vs. Replace Comparison */
  {
    step: 4,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Repair vs. Replace</span>
        </div>
        <div className="flex-1 px-8 py-4 overflow-hidden">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Scale className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold text-foreground">Cost of Ownership Comparison</span>
            </div>
            <div className="rounded-lg bg-wrenchli-teal/10 border border-wrenchli-teal/30 p-2 text-center">
              <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1">
                <Wrench className="h-3.5 w-3.5 text-wrenchli-teal" /> Repairing is cheaper
              </p>
              <p className="text-[9px] text-muted-foreground">Save approximately <strong className="text-foreground">$8,200</strong> over 3 years</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-wrenchli-teal/40 bg-wrenchli-teal/5 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-foreground">🔧 Repair & Keep</p>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-wrenchli-teal/15 px-1.5 py-0.5 text-[8px] font-bold text-wrenchli-teal">Better Value</span>
                <div className="space-y-0.5 text-[9px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Upfront</span><span className="font-medium">$575</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Insurance/yr</span><span className="font-medium">$1,200</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Maint. 3yr</span><span className="font-medium">$2,400</span></div>
                  <div className="h-px bg-border my-0.5" />
                  <div className="flex justify-between font-bold text-[10px]"><span>3-Year Total</span><span>$6,575</span></div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-foreground">🚗 Buy 2023 Camry</p>
                <div className="space-y-0.5 text-[9px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Upfront</span><span className="font-medium">$5,600</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly</span><span className="font-medium">$425/mo</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Insurance/yr</span><span className="font-medium">$1,800</span></div>
                  <div className="h-px bg-border my-0.5" />
                  <div className="flex justify-between font-bold text-[10px]"><span>3-Year Total</span><span>$14,775</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  /* Shop Referral Form */
  {
    step: 4,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">Connect with a Shop</span>
        </div>
        <div className="flex-1 px-8 py-5">
          <div className="max-w-sm mx-auto space-y-3">
            <p className="text-sm font-bold text-foreground">Ready to Connect with a Shop?</p>
            <p className="text-[10px] text-muted-foreground">Share your info and we'll connect you with a vetted local shop. They'll see your diagnosis and cost estimate — no surprises.</p>
            <div className="space-y-2">
              <div className="rounded-lg bg-muted px-3 py-2.5 text-xs text-foreground">John Doe</div>
              <div className="rounded-lg bg-muted px-3 py-2.5 text-xs text-foreground">john@email.com</div>
              <div className="rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">(313) 555-1234</div>
            </div>
            <div className="rounded-lg bg-accent px-4 py-3 text-center text-xs font-bold text-accent-foreground">
              <ArrowRight className="inline h-3 w-3 mr-1" /> Request Shop Referral
            </div>
          </div>
        </div>
      </div>
    ),
  },
  /* Confirmation */
  {
    step: 5,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">You're All Set!</span>
        </div>
        <div className="flex-1 px-8 py-5 flex flex-col items-center justify-center">
          <div className="max-w-sm mx-auto text-center space-y-3">
            <CheckCircle className="h-10 w-10 text-wrenchli-green mx-auto" />
            <p className="text-lg font-bold text-foreground">You're All Set!</p>
            <p className="text-xs text-muted-foreground">A trusted shop in the Detroit Metro area will reach out soon with a final quote.</p>
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-left space-y-1.5">
              <p className="text-xs font-semibold text-foreground">What happens next:</p>
              {["A vetted shop will review your diagnosis", "They'll contact you within 24 hours", "No obligation — you decide if the price is right"].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                  <span className="text-[10px] text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  /* Garage with status */
  {
    step: 5,
    duration: 3500,
    render: () => (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 bg-primary px-6 py-3">
          <span className="text-sm font-bold text-primary-foreground">My Garage</span>
        </div>
        <div className="flex-1 px-8 py-5">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <p className="text-xs font-bold text-foreground mb-2">Quote Status</p>
              {["Estimate Generated — $350–$800", "Referral Sent to Local Shop", "Shop Reviewing Your Diagnosis", "Quote Received — $425!"].map((s, i) => (
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
                <span className="text-xs font-medium text-wrenchli-green">Feb 12: Cylinder Misfire — 🔧 Fixed at Mike's Auto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];
