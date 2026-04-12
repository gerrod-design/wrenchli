import { useState } from "react";

interface Cause {
  name: string;
  probability: number;
  costRange: string;
  description: string;
}

interface ExplainerData {
  symptom: string;
  symptomIcon: string;
  urgency: "immediate" | "soon" | "schedule" | "monitor";
  urgencyLabel: string;
  causes: Cause[];
}

const EXPLAINER_DATA: Record<string, ExplainerData> = {
  "car-grinding-noise-when-braking": {
    symptom: "Grinding Noise When Braking",
    symptomIcon: "🔊",
    urgency: "soon",
    urgencyLabel: "Address within 1–2 weeks",
    causes: [
      { name: "Worn Brake Pads", probability: 65, costRange: "$150–$350", description: "Friction material is gone — metal backing plate is grinding against the rotor." },
      { name: "Damaged or Warped Rotors", probability: 25, costRange: "$250–$500", description: "Grooves, scoring, or heat warping from extended pad wear." },
      { name: "Stuck Caliper or Debris", probability: 10, costRange: "$150–$900", description: "Caliper seized or road debris lodged between pad and rotor." },
    ],
  },
  "car-shakes-vibrates-while-driving": {
    symptom: "Shaking or Vibration While Driving",
    symptomIcon: "📳",
    urgency: "schedule",
    urgencyLabel: "Plan a shop visit",
    causes: [
      { name: "Unbalanced or Worn Tires", probability: 50, costRange: "$20–$150", description: "Lost wheel weight, uneven tread wear, or tire defect causing high-speed wobble." },
      { name: "Warped Brake Rotors", probability: 30, costRange: "$250–$500", description: "Pulsation felt in steering wheel or pedal when braking at speed." },
      { name: "Worn Suspension Components", probability: 20, costRange: "$200–$1,500", description: "Ball joints, tie rods, or control arm bushings past service life." },
    ],
  },
  "car-wont-start-clicking-noise": {
    symptom: "Won't Start — Clicking Noise",
    symptomIcon: "🔋",
    urgency: "immediate",
    urgencyLabel: "Needs attention now",
    causes: [
      { name: "Weak or Dead Battery", probability: 70, costRange: "$100–$300", description: "Not enough amperage to engage the starter — rapid clicking is the giveaway." },
      { name: "Failed Starter Motor", probability: 20, costRange: "$300–$700", description: "Single loud click then silence — solenoid fires but motor won't turn." },
      { name: "Corroded Battery Connections", probability: 10, costRange: "$0–$50", description: "Buildup on terminals blocking current flow — often a free fix." },
    ],
  },
};

const URGENCY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  immediate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  soon: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  schedule: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  monitor: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

export default function SymptomExplainer({ slug }: { slug: string }) {
  const data = EXPLAINER_DATA[slug];
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!data) return null;

  const urgencyStyle = URGENCY_STYLES[data.urgency];

  return (
    <div className="not-prose my-8 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 sm:px-6" style={{ background: "#0F1117" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{data.symptomIcon}</span>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "#E07B39" }}>
              Symptom Assessment Overview
            </p>
            <h3 className="text-lg font-bold text-white leading-tight">
              {data.symptom}
            </h3>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Urgency Badge */}
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold border ${urgencyStyle.bg} ${urgencyStyle.text} ${urgencyStyle.border}`}>
          <span className="relative flex h-2 w-2">
            {data.urgency === "immediate" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              data.urgency === "immediate" ? "bg-red-500" :
              data.urgency === "soon" ? "bg-amber-500" :
              data.urgency === "schedule" ? "bg-blue-500" : "bg-green-500"
            }`} />
          </span>
          Urgency: {data.urgency.charAt(0).toUpperCase() + data.urgency.slice(1)} — {data.urgencyLabel}
        </div>

        {/* Causes */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Top Likely Causes
          </p>
          <div className="space-y-3">
            {data.causes.map((cause, i) => (
              <button
                key={cause.name}
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full text-left rounded-xl border border-border hover:border-[#E07B39]/40 transition-colors p-4 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: "#E07B39" }}
                    >
                      {cause.probability}%
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{cause.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{cause.costRange}</p>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Probability bar */}
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cause.probability}%`, background: "#E07B39" }}
                  />
                </div>

                {/* Expanded description */}
                {expanded === i && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {cause.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground italic border-t border-border pt-4">
          Probabilities based on common symptom-to-repair data. Your specific vehicle may vary.{" "}
          <a href="https://wrenchli.net" className="text-[#E07B39] hover:underline font-medium">
            Run a free assessment →
          </a>
        </p>
      </div>
    </div>
  );
}
