import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import heroVehicleInsights from "@/assets/hero-vehicle-insights.jpg";
import {
  CarFront, Search, Cpu, ArrowRight, Video, ShoppingCart, Wrench,
  Volume2, Wind, AlertTriangle, Gauge, CheckCircle, Settings,
  Smartphone, ChevronDown, ChevronUp
} from "lucide-react";
import { getDtcEntry, isValidDtcPattern } from "@/data/dtcCodes";
import SectionReveal from "@/components/SectionReveal";
import DiagnosisResult from "@/components/DiagnosisResult";
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
  const [searchParams] = useSearchParams();
  const hasUrlCode = Boolean(searchParams.get("code"));
  const hasUrlSymptom = Boolean(searchParams.get("symptom"));
  const [symptom, setSymptom] = useState(() => searchParams.get("symptom") || "");
  const [dtcInput, setDtcInput] = useState(() => searchParams.get("code") || "");
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get("year") || "");
  const [selectedMake, setSelectedMake] = useState(() => searchParams.get("make") || "");
  const [selectedModel, setSelectedModel] = useState(() => searchParams.get("model") || "");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(hasUrlCode ? "dtc" : "symptom");
  const [diagnosisKey, setDiagnosisKey] = useState(0);
  const [diagCodes, setDiagCodes] = useState<string | undefined>(hasUrlCode ? searchParams.get("code") || undefined : undefined);
  const [diagSymptom, setDiagSymptom] = useState<string | undefined>(hasUrlSymptom ? searchParams.get("symptom") || undefined : undefined);
  const placeholder = CyclingPlaceholder();

  const dtcCodes = dtcInput.toUpperCase().split(",").map((c) => c.trim()).filter(Boolean);
  const dtcDescriptions = dtcCodes.map((code) => {
    const entry = getDtcEntry(code);
    return { code, entry, isValid: isValidDtcPattern(code) };
  });

  const handleDiagnose = () => {
    if (activeTab === "dtc" && dtcInput.trim()) {
      setDiagCodes(dtcInput.trim());
      setDiagSymptom(undefined);
    } else if (activeTab === "symptom" && symptom.trim()) {
      setDiagSymptom(symptom.trim());
      setDiagCodes(undefined);
    }
    setDiagnosisKey((k) => k + 1);
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Vehicle Insights — DIY Diagnostics"
        description="Understand your car before visiting the shop. AI-powered diagnostics, OBD2 code lookup, symptom checker, and maintenance schedules."
        path="/vehicle-insights"
      />
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground section-padding overflow-hidden">
        <img src={heroVehicleInsights} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60" />
        <div className="container-wrenchli text-center relative">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-wrenchli-teal/20 px-4 py-1 text-sm font-medium text-wrenchli-teal">
              <CarFront className="h-4 w-4" /> Vehicle Insights
            </div>
            <h1 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Know What's Wrong. Fix It <span className="text-wrenchli-teal">Your Way.</span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Not every car problem needs a trip to the shop. Wrenchli Vehicle Insights helps you understand what might be wrong with your car and gives you real choices — watch a step-by-step video tutorial and order the parts to fix it yourself, or get quotes from trusted local shops if you'd rather leave it to a professional. Either way, you're in control.
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-10">
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
                      <div key={d.code} className="rounded-lg border border-border bg-card p-3 text-sm">
                        {d.entry ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-wrenchli-teal shrink-0">{d.code}</span>
                              <span className="font-semibold">{d.entry.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{d.entry.description}</p>
                          </div>
                        ) : d.isValid ? (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-bold text-wrenchli-teal shrink-0">{d.code}</span>
                              <span className="text-muted-foreground">
                                Code {d.code} recognized as a valid OBD2 diagnostic code, but detailed information is not yet in our database. We recommend getting a professional diagnosis to understand this code.
                              </span>
                            </div>
                            <Button
                              size="sm"
                              className="text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                              asChild
                            >
                              <Link to={`/get-quote?code=${d.code}&vehicle=${encodeURIComponent([selectedYear, selectedMake, selectedModel].filter(Boolean).join(" "))}`}>
                                Get Shop Quotes for This Code <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <span className="font-mono font-bold text-destructive shrink-0">{d.code}</span>
                            <span className="text-muted-foreground">Invalid code format</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Vehicle selector + submit */}
              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="flex h-12 rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={selectedMake}
                  onChange={(e) => { setSelectedMake(e.target.value); setSelectedModel(""); }}
                  className="flex h-12 rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Make</option>
                  {["Ford", "Chevrolet", "Toyota", "Honda", "Chrysler", "Jeep", "GMC", "Hyundai", "Kia", "Nissan", "BMW", "Mercedes", "Other"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="flex h-12 rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Model</option>
                </select>
                <Button onClick={handleDiagnose} className="h-12 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-semibold px-6 whitespace-nowrap">
                  Get Your Diagnosis
                </Button>
              </div>
            </Tabs>
          </SectionReveal>
        </div>
      </section>

      {/* AI Diagnosis Result */}
      <DiagnosisResult
        key={diagnosisKey}
        codes={diagCodes}
        symptom={diagSymptom}
        year={selectedYear}
        make={selectedMake}
        model={selectedModel}
        onSwitchToDtc={() => {
          setActiveTab("dtc");
          document.getElementById("diagnosis-input")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

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

      {/* DIY Success Stories */}
      <section className="section-padding bg-wrenchli-teal/5">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">
              Thousands of Car Owners Fix It Themselves Every Day
            </h2>
            <p className="mt-3 text-center text-muted-foreground md:text-lg max-w-2xl mx-auto">
              These common repairs are done at home by regular people — no mechanic certification required.
            </p>
          </SectionReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { emoji: "🔧", title: "Brake Pad Replacement", difficulty: "Easy", saves: "$100–$250", time: "1–2 hours" },
              { emoji: "💡", title: "Headlight Bulb Replacement", difficulty: "Easy", saves: "$50–$150", time: "15–30 min" },
              { emoji: "🔋", title: "Battery Replacement", difficulty: "Easy", saves: "$50–$100", time: "20–30 min" },
            ].map((card, i) => (
              <SectionReveal key={card.title} delay={i * 120}>
                <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <span className="text-4xl">{card.emoji}</span>
                  <h3 className="mt-3 font-heading text-base font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Difficulty: <span className="font-semibold text-wrenchli-green">{card.difficulty}</span> • Saves: <span className="font-semibold">{card.saves}</span> vs. shop • Time: <span className="font-semibold">{card.time}</span>
                  </p>
                </div>
              </SectionReveal>
            ))}
          </div>

          <SectionReveal>
            <p className="mt-8 text-center text-muted-foreground max-w-xl mx-auto">
              Not every repair needs a professional. We'll help you figure out which ones you can tackle — and which ones are better left to the pros.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* DIY Safety Disclaimer */}
      <section className="bg-amber-500/5 border-t border-amber-500/20">
        <div className="container-wrenchli py-6">
          <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs text-foreground leading-relaxed">
              <span className="font-bold">DIY Safety Disclaimer:</span> Automotive repair involves inherent risks including personal injury and vehicle damage. Always follow proper safety procedures: use jack stands (never work under a vehicle supported only by a jack), wear appropriate protective equipment, and work in a well-ventilated area. If at any point you feel uncomfortable or unsure, stop and consult a qualified technician. Wrenchli provides informational resources only and is not responsible for any injury, damage, or loss resulting from DIY repair attempts.
            </div>
          </div>
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
