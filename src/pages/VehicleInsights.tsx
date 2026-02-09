import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CarFront, Search, Cpu, ArrowRight, Video, ShoppingCart, Wrench,
  Volume2, Wind, AlertTriangle, Gauge, CheckCircle, Settings,
  Smartphone, ChevronDown, ChevronUp
} from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const placeholders = [
  "My brakes are squeaking",
  "There's a burning smell from the engine",
  "Check engine light is on",
  "Car shakes when braking",
  "AC is blowing warm air",
];

const dtcLookup: Record<string, string> = {
  P0300: "Random/Multiple Cylinder Misfire Detected",
  P0420: "Catalyst System Efficiency Below Threshold (Bank 1)",
  P0171: "System Too Lean (Bank 1)",
  P0442: "Evaporative Emission System Leak Detected (Small Leak)",
  P0301: "Cylinder 1 Misfire Detected",
  P0455: "Evaporative Emission System Leak Detected (Large Leak)",
  P0128: "Coolant Thermostat — Coolant Temperature Below Thermostat Regulating Temperature",
  P0016: "Crankshaft/Camshaft Position Correlation — Bank 1 Sensor A",
};

const symptomCategories = [
  {
    icon: Volume2, label: "Sounds & Noises", emoji: "🔊",
    items: ["Squealing when braking", "Grinding noise while turning", "Knocking from engine", "Humming at highway speeds", "Clicking when starting"],
  },
  {
    icon: Wind, label: "Smells & Odors", emoji: "👃",
    items: ["Burning rubber smell", "Sweet coolant smell", "Rotten egg / sulfur", "Gas smell in cabin", "Burning oil smell"],
  },
  {
    icon: AlertTriangle, label: "Warning Lights", emoji: "⚠️",
    items: ["Check engine light", "ABS warning light", "Oil pressure warning", "Battery / charging light", "TPMS (tire pressure)"],
  },
  {
    icon: Gauge, label: "Performance Issues", emoji: "🚗",
    items: ["Car won't start", "Rough idle / vibration", "Loss of power / acceleration", "Overheating", "Poor fuel economy"],
  },
];

const diyItems = ["Cabin air filter", "Wiper blades", "Headlight bulbs", "Battery replacement", "Fluid top-offs", "Tire pressure"];
const shopItems = ["Brake pads & rotors", "Timing belt", "Transmission repair", "Steering & suspension", "Electrical diagnosis", "AC system"];

const partsPartners = ["AutoZone", "O'Reilly", "Advance Auto Parts", "RockAuto", "Amazon Automotive"];

function CyclingPlaceholder() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % placeholders.length), 3000);
    return () => clearInterval(t);
  }, []);
  return placeholders[idx];
}

export default function VehicleInsights() {
  const [symptom, setSymptom] = useState("");
  const [dtcInput, setDtcInput] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const placeholder = CyclingPlaceholder();

  const dtcCodes = dtcInput.toUpperCase().split(",").map((c) => c.trim()).filter(Boolean);
  const dtcDescriptions = dtcCodes.map((code) => ({ code, desc: dtcLookup[code] || null }));

  return (
    <main className="pb-[60px] md:pb-0">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-wrenchli-teal/20 px-4 py-1 text-sm font-medium text-wrenchli-teal">
              <CarFront className="h-4 w-4" /> Vehicle Insights
            </div>
            <h1 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Know What's Wrong. Fix It <span className="text-wrenchli-teal">Your Way.</span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Self-service diagnostics, DIY tutorials, and parts ordering — all in one place. Understand your car before you visit the shop, or fix it yourself.
            </p>
            <Button
              size="lg"
              className="mt-8 h-14 px-10 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-bold text-lg transition-transform hover:scale-[1.02]"
              onClick={() => document.getElementById("diagnosis-input")?.scrollIntoView({ behavior: "smooth" })}
            >
              Start Free Diagnosis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* Diagnostic Input Interface */}
      <section id="diagnosis-input" className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">What's going on with your car?</h2>
            <p className="mt-3 text-center text-muted-foreground">Describe symptoms or enter a diagnostic code to get started.</p>
          </SectionReveal>

          <SectionReveal>
            <Tabs defaultValue="symptom" className="mt-10">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="symptom" className="text-sm font-semibold h-10">
                  <Search className="mr-2 h-4 w-4" /> Describe Symptoms
                </TabsTrigger>
                <TabsTrigger value="dtc" className="text-sm font-semibold h-10">
                  <Cpu className="mr-2 h-4 w-4" /> Enter OBD2 Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="symptom" className="mt-6 space-y-4">
                <textarea
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  placeholder={placeholder}
                  rows={4}
                  maxLength={500}
                  className="flex w-full rounded-lg border border-input bg-card px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wrenchli-teal resize-none"
                />
              </TabsContent>

              <TabsContent value="dtc" className="mt-6 space-y-4">
                <Input
                  placeholder="Enter code (e.g., P0420) — separate multiple with commas"
                  value={dtcInput}
                  onChange={(e) => setDtcInput(e.target.value.toUpperCase())}
                  className="h-12 text-base font-mono uppercase"
                  maxLength={60}
                />
                {dtcDescriptions.length > 0 && dtcDescriptions[0].code && (
                  <div className="space-y-2">
                    {dtcDescriptions.map((d) => (
                      <div key={d.code} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                        <span className="font-mono font-bold text-wrenchli-teal shrink-0">{d.code}</span>
                        <span className="text-muted-foreground">{d.desc || "Code not found — we'll look it up for you"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Vehicle selector + submit */}
              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <select className="flex h-12 rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Year</option>
                  {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select className="flex h-12 rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Make</option>
                  {["Ford", "Chevrolet", "Toyota", "Honda", "Chrysler", "Jeep", "GMC", "Hyundai", "Kia", "Nissan", "BMW", "Mercedes", "Other"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select className="flex h-12 rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Model</option>
                </select>
                <Button className="h-12 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-semibold px-6 whitespace-nowrap">
                  Get Your Diagnosis
                </Button>
              </div>
            </Tabs>
          </SectionReveal>
        </div>
      </section>

      {/* Sample Diagnosis Result */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Sample Diagnosis Result</h2>
            <p className="mt-3 text-center text-muted-foreground">Here's what a diagnosis looks like. Try it yourself above!</p>
          </SectionReveal>

          <SectionReveal>
            <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono text-wrenchli-teal mb-4">
                <Cpu className="h-4 w-4" /> P0420
              </div>
              <h3 className="font-heading text-lg font-bold">Most Likely Cause: Catalytic Converter Efficiency</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What's Happening</span>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Your catalytic converter isn't cleaning exhaust gases as efficiently as it should. This is often caused by a worn converter, but can also be triggered by faulty O2 sensors or engine misfires.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Urgency:</span>
                    <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DIY Difficulty:</span>
                    <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-700">Advanced</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 mt-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DIY Cost (Parts Only)</span>
                    <p className="font-stats text-xl font-bold text-wrenchli-teal">$150–$400</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shop Cost (Parts + Labor)</span>
                    <p className="font-stats text-xl font-bold text-accent">$400–$1,200</p>
                  </div>
                </div>
              </div>

              {/* 3 Action Cards */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-background p-4 text-center">
                  <Video className="mx-auto h-6 w-6 text-wrenchli-teal mb-2" />
                  <h4 className="font-heading text-sm font-semibold">Watch & Learn</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Tutorials for your specific vehicle</p>
                  <Button size="sm" variant="outline" className="mt-3 text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
                    Watch How-To Video
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-background p-4 text-center">
                  <ShoppingCart className="mx-auto h-6 w-6 text-wrenchli-teal mb-2" />
                  <h4 className="font-heading text-sm font-semibold">Order Parts</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Right part, ship or local pickup</p>
                  <Button size="sm" variant="outline" className="mt-3 text-xs border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
                    Shop Parts
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-background p-4 text-center">
                  <Wrench className="mx-auto h-6 w-6 text-accent mb-2" />
                  <h4 className="font-heading text-sm font-semibold">Get It Fixed</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Quotes from vetted local shops</p>
                  <Button size="sm" className="mt-3 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
                    Get Shop Quotes
                  </Button>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Common Symptoms Browser */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Common Symptoms</h2>
            <p className="mt-3 text-center text-muted-foreground">Not sure what's wrong? Browse by category.</p>
          </SectionReveal>

          <div className="mt-10 space-y-3">
            {symptomCategories.map((cat) => (
              <SectionReveal key={cat.label}>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedCat(expandedCat === cat.label ? null : cat.label)}
                    className="flex w-full items-center justify-between p-4 md:p-5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="font-heading text-base font-semibold">{cat.label}</span>
                    </div>
                    {expandedCat === cat.label ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedCat === cat.label && (
                    <div className="border-t border-border px-4 py-3 md:px-5">
                      <ul className="space-y-2">
                        {cat.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Search className="h-3.5 w-3.5 text-wrenchli-teal shrink-0" />
                            <button className="text-left hover:text-wrenchli-teal transition-colors">{item}</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* DIY vs Shop Guide */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">DIY vs. Shop Guide</h2>
            <p className="mt-3 text-center text-muted-foreground">Know when to grab your tools — and when to call a pro.</p>
          </SectionReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <SectionReveal>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-heading text-base font-semibold flex items-center gap-2 text-wrenchli-green">
                  <CheckCircle className="h-5 w-5" /> Good for DIY
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {diyItems.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-wrenchli-green shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>
            <SectionReveal delay={150}>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-heading text-base font-semibold flex items-center gap-2 text-wrenchli-trust-blue">
                  <Settings className="h-5 w-5" /> Best for a Shop
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {shopItems.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5 text-wrenchli-trust-blue shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Parts Partners */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">Parts Partners</h2>
            <p className="mt-3 text-muted-foreground">Order the right parts from trusted retailers.</p>
          </SectionReveal>
          <SectionReveal>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {partsPartners.map((p) => (
                <div key={p} className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-muted-foreground opacity-60">
                  {p}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground italic">
              When you purchase parts through our partner links, Wrenchli may receive a small referral fee at no additional cost to you.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* OBD2 Scanner CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli">
          <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <SectionReveal>
                <div className="inline-flex items-center gap-2 rounded-full bg-wrenchli-teal/20 px-3 py-1 text-sm font-medium text-wrenchli-teal mb-4">
                  <Smartphone className="h-4 w-4" /> OBD2 Scanners
                </div>
                <h2 className="font-heading text-2xl font-bold md:text-3xl">Using an OBD2 Scanner?</h2>
                <p className="mt-3 text-primary-foreground/70 leading-relaxed">
                  Wrenchli works with popular OBD2 scanners. Read your codes, enter them above, and get instant diagnostics with shop quotes.
                </p>
                <Button variant="outline" className="mt-6 border-wrenchli-teal text-wrenchli-teal hover:bg-wrenchli-teal/10">
                  How to Read Your Codes →
                </Button>
              </SectionReveal>
              <SectionReveal delay={150}>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {["FIXD", "BlueDriver", "Innova"].map((brand) => (
                    <div key={brand} className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 px-6 py-4 text-sm font-semibold text-primary-foreground/60">
                      {brand}
                    </div>
                  ))}
                </div>
              </SectionReveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
