import { useState, useRef, useEffect } from "react";
import { Shield, Zap, ChevronRight, AlertTriangle, CheckCircle2, Activity, Store, ArrowRight, Users, ClipboardCheck, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import wrenchliLogo from "@/assets/wrenchli-logo-dark.png";
import DiagnosticWizard from "@/components/diagnostic-wizard/DiagnosticWizard";
import Footer from "@/components/Footer";
import heroVideo from "@/assets/hero-video.mp4";
import heroPoster from "@/assets/hero-poster.jpg";

const mockCauses = [
  { name: "Dead Battery", probability: 0.78, costLow: 150, costHigh: 350, difficulty: "easy" },
  { name: "Alternator Failure", probability: 0.15, costLow: 400, costHigh: 800, difficulty: "professional_only" },
  { name: "Starter Motor", probability: 0.04, costLow: 300, costHigh: 600, difficulty: "professional_only" },
];

const difficultyColors: Record<string, string> = {
  easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  moderate: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  professional_only: "text-red-400 bg-red-400/10 border-red-400/30",
};

const difficultyLabels: Record<string, string> = {
  easy: "DIY Friendly",
  moderate: "Intermediate",
  professional_only: "Shop Required",
};

const FONT = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

export default function DesignPreview() {
  // Pipeline is now a static visual — no state needed
  const chatRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.6;
    }
  }, []);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    const original = link?.href;
    if (link) link.href = "/favicon-dark.png";
    return () => {
      if (link && original) link.href = original;
    };
  }, []);

  const scrollToChat = () => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: FONT }}>

      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "#1A1D27", background: "#0F1117" }}>
        <div className="flex flex-col">
          <span className="flex items-center gap-2 text-xl font-bold tracking-tight" style={{ color: "#F5F5F5" }}>
            <img src={wrenchliLogo} alt="Wrenchli logo" className="h-8 w-8 object-contain" />
            Wrenchli
          </span>
          <span className="ml-10 text-xs font-medium tracking-wide" style={{ color: "#6B7280" }}>
            Mobility for All.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#for-shops"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "#9CA3AF", border: "1px solid #2A2D37" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#E07B39";
              e.currentTarget.style.color = "#F5F5F5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2A2D37";
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            <Store className="h-4 w-4" />
            For Shops
          </a>
          <button
            onClick={scrollToChat}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "#E07B39", color: "#0F1117" }}
          >
            Start Free Assessment
          </button>
        </div>
      </nav>

      {/* ── HERO with cinematic video background ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "100vh" }}>
        {/* Video background */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
          poster={heroPoster}
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 z-[1]" style={{ background: "rgba(0,0,0,0.50)" }} />

        {/* Hero content */}
        <div className="relative z-[2] px-6 py-20 max-w-4xl mx-auto text-center flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 120px)" }}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight" style={{ color: "#FFFFFF" }}>
            Vehicle Repair.<br />
            <span style={{ color: "#E07B39" }}>Finally Fixed.</span>
          </h1>
          <p className="mt-6 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            <span className="font-semibold" style={{ color: "#FFFFFF" }}>Free, instant symptom assessment.</span>{" "}
            Describe what's wrong and get a structured report with likelihood scores,
            cost estimates, and exactly what to ask your shop.
          </p>
          <div className="mt-10">
            <button
              onClick={scrollToChat}
              className="px-8 py-3.5 rounded-lg font-semibold text-base flex items-center justify-center gap-2 mx-auto"
              style={{ background: "#E07B39", color: "#0F1117" }}
            >
              Start Free Assessment <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            {["Always free", "No account required", "Results in under 60 seconds"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#E07B39" }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Everything below hero: warm light background ── */}
      <div style={{ background: "#F8F8F6", color: "#1A1D27" }}>

        {/* Pipeline stages — static visual showing the assessment flow */}
        <section className="px-6 pt-12 pb-6 max-w-5xl mx-auto">
          <p className="text-center text-sm mb-5" style={{ color: "#6B7280" }}>
            How it works — 4 simple steps
          </p>
          <div className="flex items-center justify-center gap-0 mb-8 flex-wrap">
            {["Vehicle", "Symptoms", "Diagnosis", "Plan"].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: "#E07B39",
                      color: "#FFFFFF",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ fontFamily: MONO, color: "#1A1D27" }}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <ChevronRight className="h-4 w-4 mx-3 shrink-0" style={{ color: "#D1CFC9" }} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Live Assessment + Sample Report */}
        <section ref={chatRef} className="px-6 pb-20 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: LIVE Assessment Wizard */}
            <div className="md:col-span-3">
              <div className="text-xs mb-4 px-1" style={{ fontFamily: MONO, color: "#E07B39" }}>
                LIVE ASSESSMENT — TRY IT NOW
              </div>
              <DiagnosticWizard />
            </div>

            {/* Right: Sample Repair Likelihood Report */}
            <div className="md:col-span-2 rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs" style={{ fontFamily: MONO, color: "#E07B39" }}>SAMPLE REPAIR LIKELIHOOD REPORT</div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#FEF3E2", border: "1px solid #E07B39", color: "#E07B39" }}>
                  <AlertTriangle className="h-3 w-3" /> SCHEDULE SOON
                </div>
              </div>

              {/* Vehicle card */}
              <div className="rounded-lg p-4 mb-6 flex items-center gap-4" style={{ background: "#F8F8F6", border: "1px solid #E0DDD8" }}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "#E0DDD8" }}>
                  <span className="text-lg">🚗</span>
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: "#1A1D27" }}>2019 Honda Civic LX</div>
                  <div className="text-xs" style={{ color: "#6B7280" }}>67,200 mi · No VIN provided</div>
                </div>
                <div className="ml-auto text-xs px-2 py-1 rounded" style={{ fontFamily: MONO, background: "#DCFCE7", color: "#16A34A" }}>
                  HIGH CONFIDENCE
                </div>
              </div>

              {/* Causes */}
              <div className="space-y-3">
                {mockCauses.map((cause) => (
                  <div key={cause.name} className="rounded-lg p-4" style={{ background: "#F8F8F6", border: "1px solid #E0DDD8" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm" style={{ color: "#1A1D27" }}>{cause.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[cause.difficulty]}`}>
                        {difficultyLabels[cause.difficulty]}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "#E0DDD8" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${cause.probability * 100}%`, background: "#E07B39" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs" style={{ fontFamily: MONO, color: "#6B7280" }}>
                      <span>{Math.round(cause.probability * 100)}% likely</span>
                      <span>${cause.costLow}–${cause.costHigh}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mechanic questions */}
              <div className="mt-6 rounded-lg p-4" style={{ background: "#F8F8F6", border: "1px solid #E0DDD8" }}>
                <div className="text-xs mb-3" style={{ fontFamily: MONO, color: "#E07B39" }}>QUESTIONS FOR YOUR MECHANIC</div>
                <ul className="space-y-2 text-sm" style={{ color: "#4B5563" }}>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#E07B39" }} />
                    "Can you test the battery voltage before and after charging?"
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#E07B39" }} />
                    "Is the alternator output above 13.5V with the engine running?"
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#E07B39" }} />
                    "How old is the current battery, and is it still under warranty?"
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="px-6 py-16" style={{ background: "#F0EFEC" }}>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Transparent Pricing", desc: "See real cost ranges before you visit a shop. No surprises." },
              { icon: Zap, title: "Instant Assessment", desc: "AI-powered symptom analysis in seconds, backed by real outcome data." },
              { icon: Activity, title: "Accuracy Tracked", desc: "We track our symptom-to-repair match rate — and publish the results." },
            ].map((v) => (
              <div key={v.title} className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#FEF3E2" }}>
                  <v.icon className="h-5 w-5" style={{ color: "#E07B39" }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#1A1D27" }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── For Shops Section ── */}
        <section id="for-shops" className="px-6 py-20" style={{ background: "#F8F8F6", borderTop: "1px solid #E0DDD8" }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8", color: "#E07B39" }}>
              <Store className="h-3 w-3" />
              For Repair Shops
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4" style={{ color: "#1A1D27" }}>
              Every customer arrives<br />
              <span style={{ color: "#E07B39" }}>already knowing what's wrong.</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed mb-12" style={{ color: "#6B7280" }}>
              Your customers come pre-assessed, cost-educated, and ready to approve the work.
              No more 20-minute intake calls. No more sticker shock at the counter.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                {
                  icon: Users,
                  title: "Pre-Qualified Leads",
                  desc: "Customers arrive with a structured assessment, vehicle details, and cost expectations. They're not shopping — they're booking.",
                },
                {
                  icon: ClipboardCheck,
                  title: "Zero Intake Friction",
                  desc: "The repair likelihood report is the intake form. VIN, symptoms, confidence scores — all captured before they walk in.",
                },
                {
                  icon: DollarSign,
                  title: "Higher Approval Rates",
                  desc: "Customers who understand the repair approve bigger jobs. Built-in financing means they can afford it, too.",
                },
              ].map((b) => (
                <div key={b.title} className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#FEF3E2" }}>
                    <b.icon className="h-5 w-5" style={{ color: "#E07B39" }} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: "#1A1D27" }}>{b.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{b.desc}</p>
                </div>
              ))}
            </div>

            {/* What a Wrenchli lead looks like */}
            <div className="mt-12 rounded-xl p-6 text-left" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
              <div className="text-xs mb-4" style={{ fontFamily: MONO, color: "#E07B39" }}>WHAT A WRENCHLI LEAD LOOKS LIKE</div>
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { label: "Vehicle", value: "2019 Honda Civic LX" },
                  { label: "Assessment", value: "Dead Battery (78% likely)" },
                  { label: "Cost Range", value: "$150 – $350" },
                  { label: "Customer Status", value: "Pre-approved financing" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg p-3" style={{ background: "#F8F8F6", border: "1px solid #E0DDD8" }}>
                    <div className="text-xs mb-1" style={{ color: "#6B7280" }}>{item.label}</div>
                    <div className="text-sm font-semibold" style={{ color: "#1A1D27" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/design-preview/for-shops"
              className="inline-flex items-center gap-2 mt-10 px-8 py-3.5 rounded-lg font-semibold text-base transition-opacity hover:opacity-90"
              style={{ background: "#E07B39", color: "#FFFFFF" }}
            >
              Learn More for Shops <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
