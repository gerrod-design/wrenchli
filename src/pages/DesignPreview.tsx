import { useState, useRef, useEffect } from "react";
import { Shield, Zap, ChevronRight, AlertTriangle, CheckCircle2, Activity, ArrowLeft, Store, ArrowRight, Users, ClipboardCheck, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import wrenchliLogo from "@/assets/wrenchli-logo-dark.png";
import DiagnosticWizard from "@/components/diagnostic-wizard/DiagnosticWizard";

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
  professional_only: "Pro Only",
};

export default function DesignPreview() {
  const [activeStage, setActiveStage] = useState(2);
  const chatRef = useRef<HTMLDivElement>(null);

  // Swap favicon to dark variant on this page only
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
    <div className="min-h-screen" style={{ background: "#0F1117", color: "#E0E0E0", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Back link */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#1A1D27", border: "1px solid #2A2D37", color: "#9CA3AF" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to current site
        </Link>
      </div>

      {/* Banner */}
      <div className="text-center py-3 text-sm font-medium" style={{ background: "#E07B39", color: "#0F1117" }}>
        ⚡ DESIGN PREVIEW — Fully functional diagnosis with the new aesthetic
      </div>

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
            Start Free Diagnosis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight" style={{ color: "#F5F5F5" }}>
          Vehicle Repair.<br />
          <span style={{ color: "#E07B39" }}>Finally Fixed.</span>
        </h1>
        <p className="mt-6 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#9CA3AF" }}>
          <span className="font-semibold" style={{ color: "#F5F5F5" }}>Free, instant AI diagnosis.</span>{" "}
          Describe what's wrong and get a structured report with confidence scores,
          cost estimates, and exactly what to tell your mechanic.
        </p>
        <div className="mt-10">
          <button
            onClick={scrollToChat}
            className="px-8 py-3.5 rounded-lg font-semibold text-base flex items-center justify-center gap-2 mx-auto"
            style={{ background: "#E07B39", color: "#0F1117" }}
          >
            Start Free Diagnosis <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm" style={{ color: "#6B7280" }}>
          {["Always free", "No account required", "Results in under 60 seconds"].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#E07B39" }} />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Pipeline stages */}
      <section className="px-6 pb-6 max-w-5xl mx-auto">
        <div className="flex gap-2 mb-8 justify-center flex-wrap">
          {["Vehicle ID", "Symptom Intake", "Diagnosis", "Recommendation"].map((label, i) => (
            <button
              key={label}
              onClick={() => setActiveStage(i)}
              className="px-4 py-2 rounded-lg text-xs font-mono transition-all"
              style={{
                background: activeStage === i ? "#E07B39" : "#1A1D27",
                color: activeStage === i ? "#0F1117" : "#6B7280",
                border: `1px solid ${activeStage === i ? "#E07B39" : "#2A2D37"}`,
              }}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
      </section>

      {/* Live Diagnosis + Sample Readout */}
      <section ref={chatRef} className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left: LIVE Chat Widget */}
          <div className="md:col-span-2 design-preview-chat-wrapper">
            <div className="text-xs font-mono mb-4 px-1" style={{ color: "#E07B39" }}>
              LIVE DIAGNOSIS — TRY IT NOW
            </div>
            <InlineChatWidget />
          </div>

          {/* Right: Sample Readout (static example of output) */}
          <div className="md:col-span-3 rounded-xl p-6" style={{ background: "#1A1D27", border: "1px solid #2A2D37" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs font-mono" style={{ color: "#E07B39" }}>SAMPLE DIAGNOSTIC READOUT</div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#E07B3915", border: "1px solid #E07B39", color: "#E07B39" }}>
                <AlertTriangle className="h-3 w-3" /> SCHEDULE SOON
              </div>
            </div>

            {/* Vehicle card */}
            <div className="rounded-lg p-4 mb-6 flex items-center gap-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "#2A2D37" }}>
                <span className="text-lg">🚗</span>
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: "#F5F5F5" }}>2019 Honda Civic LX</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>67,200 mi · No VIN provided</div>
              </div>
              <div className="ml-auto text-xs font-mono px-2 py-1 rounded" style={{ background: "#22C55E20", color: "#22C55E" }}>
                HIGH CONFIDENCE
              </div>
            </div>

            {/* Causes */}
            <div className="space-y-3">
              {mockCauses.map((cause) => (
                <div key={cause.name} className="rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm" style={{ color: "#F5F5F5" }}>{cause.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[cause.difficulty]}`}>
                      {difficultyLabels[cause.difficulty]}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "#2A2D37" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${cause.probability * 100}%`, background: "#E07B39" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "#6B7280" }}>
                    <span>{Math.round(cause.probability * 100)}% likely</span>
                    <span>${cause.costLow}–${cause.costHigh}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mechanic questions */}
            <div className="mt-6 rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
              <div className="text-xs font-mono mb-3" style={{ color: "#E07B39" }}>QUESTIONS FOR YOUR MECHANIC</div>
              <ul className="space-y-2 text-sm" style={{ color: "#9CA3AF" }}>
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
      <section className="px-6 py-16" style={{ background: "#141720" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Transparent Pricing", desc: "See real cost ranges before you visit a shop. No surprises." },
            { icon: Zap, title: "Instant Diagnosis", desc: "AI-powered analysis in seconds, backed by real outcome data." },
            { icon: Activity, title: "Accuracy Tracked", desc: "We track whether our diagnoses were right — and publish the results." },
          ].map((v) => (
            <div key={v.title} className="rounded-xl p-6" style={{ background: "#1A1D27", border: "1px solid #2A2D37" }}>
              <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#E07B3915" }}>
                <v.icon className="h-5 w-5" style={{ color: "#E07B39" }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "#F5F5F5" }}>{v.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For Shops Section ── */}
      <section id="for-shops" className="px-6 py-20" style={{ background: "#0F1117", borderTop: "1px solid #1A1D27" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: "#1A1D27", border: "1px solid #2A2D37", color: "#E07B39" }}>
            <Store className="h-3 w-3" />
            For Repair Shops
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4" style={{ color: "#F5F5F5" }}>
            Every customer arrives<br />
            <span style={{ color: "#E07B39" }}>already knowing what's wrong.</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed mb-12" style={{ color: "#9CA3AF" }}>
            Your customers come pre-diagnosed, cost-educated, and ready to approve the work.
            No more 20-minute intake calls. No more sticker shock at the counter.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: Users,
                title: "Pre-Qualified Leads",
                desc: "Customers arrive with a structured diagnosis, vehicle details, and cost expectations. They're not shopping — they're booking.",
              },
              {
                icon: ClipboardCheck,
                title: "Zero Intake Friction",
                desc: "The diagnostic report is the intake form. VIN, symptoms, confidence scores — all captured before they walk in.",
              },
              {
                icon: DollarSign,
                title: "Higher Approval Rates",
                desc: "Customers who understand the repair approve bigger jobs. Built-in financing means they can afford it, too.",
              },
            ].map((b) => (
              <div key={b.title} className="rounded-xl p-6" style={{ background: "#1A1D27", border: "1px solid #2A2D37" }}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#E07B3915" }}>
                  <b.icon className="h-5 w-5" style={{ color: "#E07B39" }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#F5F5F5" }}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{b.desc}</p>
              </div>
            ))}
          </div>

          {/* What a Wrenchli lead looks like */}
          <div className="mt-12 rounded-xl p-6 text-left" style={{ background: "#1A1D27", border: "1px solid #2A2D37" }}>
            <div className="text-xs font-mono mb-4" style={{ color: "#E07B39" }}>WHAT A WRENCHLI LEAD LOOKS LIKE</div>
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { label: "Vehicle", value: "2019 Honda Civic LX" },
                { label: "Diagnosis", value: "Dead Battery (78% confidence)" },
                { label: "Cost Range", value: "$150 – $350" },
                { label: "Customer Status", value: "Pre-approved financing" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg p-3" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
                  <div className="text-xs mb-1" style={{ color: "#6B7280" }}>{item.label}</div>
                  <div className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/for-shops"
            className="inline-flex items-center gap-2 mt-10 px-8 py-3.5 rounded-lg font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: "#E07B39", color: "#0F1117" }}
          >
            Learn More for Shops <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer note */}
      <div className="text-center py-10 text-xs" style={{ color: "#4B5563", borderTop: "1px solid #1A1D27" }}>
        This is a design concept preview. Your current site is unchanged.
      </div>
    </div>
  );
}
