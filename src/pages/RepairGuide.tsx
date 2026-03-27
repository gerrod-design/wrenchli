import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { FaqJsonLd } from "@/components/JsonLd";
import SectionReveal from "@/components/SectionReveal";
import InlineChatWidget from "@/components/InlineChatWidget";
import { ArrowLeft, Wrench, DollarSign, Clock, AlertTriangle, ChevronDown } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface RepairData {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  heroHeading: string;
  heroSub: string;
  costLow: number;
  costHigh: number;
  timeEstimate: string;
  urgency: "low" | "medium" | "high";
  urgencyLabel: string;
  description: string[];
  symptoms: string[];
  causes: string[];
  diyFeasibility: string;
  chatPrompt: string;
  faqs: { q: string; a: string }[];
}

const REPAIRS: Record<string, RepairData> = {
  "check-engine-light": {
    slug: "check-engine-light",
    title: "Check Engine Light Diagnosis",
    seoTitle: "Check Engine Light On? Free Diagnosis & Cost Estimates",
    seoDescription:
      "Find out why your check engine light is on. Get a free AI diagnosis, repair cost estimates ($100–$1,500+), and compare local shop quotes instantly.",
    heroHeading: "Check Engine Light On?",
    heroSub: "Get a free diagnosis in 60 seconds — no mechanic visit needed.",
    costLow: 100,
    costHigh: 1500,
    timeEstimate: "1–4 hours at a shop",
    urgency: "medium",
    urgencyLabel: "Don't ignore — diagnose soon",
    description: [
      "The check engine light (CEL) is your vehicle's way of telling you something needs attention in the engine, emissions, or powertrain system. It can indicate anything from a loose gas cap to a failing catalytic converter.",
      "Ignoring it can lead to reduced fuel efficiency, increased emissions, and potentially expensive damage if the underlying issue worsens over time.",
    ],
    symptoms: [
      "Illuminated check engine light (steady or flashing)",
      "Reduced fuel economy",
      "Rough idling or misfires",
      "Difficulty starting the engine",
      "Unusual exhaust smell or smoke",
    ],
    causes: [
      "Faulty oxygen sensor (P0130–P0167)",
      "Catalytic converter failure (P0420, P0430)",
      "Loose or damaged gas cap",
      "Spark plug or ignition coil issues",
      "Mass airflow sensor malfunction (P0100–P0104)",
      "EGR valve problems",
    ],
    diyFeasibility:
      "Some causes like a loose gas cap are trivial DIY fixes. Others like oxygen sensors are moderate. Catalytic converter replacement typically requires a professional shop.",
    chatPrompt: "My check engine light is on",
    faqs: [
      {
        q: "Is it safe to drive with the check engine light on?",
        a: "A steady check engine light usually means you can drive short distances safely, but should get it diagnosed soon. A flashing check engine light means stop driving immediately — it indicates a severe misfire that can damage your catalytic converter.",
      },
      {
        q: "How much does it cost to diagnose a check engine light?",
        a: "Many auto parts stores offer free OBD2 code reads. A professional diagnosis at a shop typically costs $50–$150. Wrenchli provides a free AI-powered diagnosis instantly.",
      },
      {
        q: "What is the most common check engine light cause?",
        a: "The most common cause is a faulty oxygen (O2) sensor, which costs $150–$350 to replace. A loose gas cap is also very common and costs nothing to fix.",
      },
    ],
  },
  "catalytic-converter-replacement": {
    slug: "catalytic-converter-replacement",
    title: "Catalytic Converter Replacement",
    seoTitle: "Catalytic Converter Replacement Cost — $800–$2,500 Estimates",
    seoDescription:
      "How much does catalytic converter replacement cost? Get instant estimates for your specific vehicle, compare shop prices, and explore financing options.",
    heroHeading: "Catalytic Converter Replacement",
    heroSub: "Compare shop prices for your exact vehicle — free and instant.",
    costLow: 800,
    costHigh: 2500,
    timeEstimate: "2–4 hours at a shop",
    urgency: "high",
    urgencyLabel: "Required for emissions — fix soon",
    description: [
      "The catalytic converter is a critical emissions component that converts toxic exhaust gases into less harmful emissions. When it fails, your vehicle will fail emissions tests and trigger check engine codes like P0420 or P0430.",
      "Replacement costs vary widely depending on your vehicle — some cars use expensive precious metals (platinum, palladium, rhodium) in their converters, driving up parts costs.",
    ],
    symptoms: [
      "Check engine light with P0420 or P0430 codes",
      "Rotten egg smell from exhaust",
      "Failed emissions inspection",
      "Reduced engine performance and acceleration",
      "Rattling noise from under the vehicle",
    ],
    causes: [
      "Age and high mileage degradation",
      "Engine misfires damaging the converter",
      "Oil or coolant leaks entering the exhaust",
      "Use of leaded fuel",
      "Physical damage from road debris",
    ],
    diyFeasibility:
      "Catalytic converter replacement is generally a professional-level repair requiring welding or specialized tools. Not recommended as a DIY job for most vehicle owners.",
    chatPrompt: "I need a catalytic converter replacement",
    faqs: [
      {
        q: "Can I drive without a catalytic converter?",
        a: "Technically yes, but it's illegal in most states, will fail emissions testing, and can result in fines. The engine may also run poorly without proper backpressure.",
      },
      {
        q: "Why are catalytic converters so expensive?",
        a: "They contain precious metals (platinum, palladium, rhodium) that act as catalysts. These metals are more valuable per ounce than gold, which drives up replacement costs.",
      },
      {
        q: "How long does a catalytic converter last?",
        a: "A well-maintained catalytic converter typically lasts 70,000–100,000 miles. However, engine problems like misfires or oil leaks can cause premature failure.",
      },
    ],
  },
  "brake-pad-replacement": {
    slug: "brake-pad-replacement",
    title: "Brake Pad Replacement",
    seoTitle: "Brake Pad Replacement Cost — $150–$400 Per Axle",
    seoDescription:
      "How much does brake pad replacement cost? Get instant estimates, compare shop prices, or follow our DIY guide to save 50%. Free diagnosis.",
    heroHeading: "Brake Pads Worn Down?",
    heroSub: "Get an instant cost estimate and decide: shop or DIY.",
    costLow: 150,
    costHigh: 400,
    timeEstimate: "1–2 hours per axle",
    urgency: "high",
    urgencyLabel: "Safety critical — don't delay",
    description: [
      "Brake pads are wear items that need regular replacement. When the friction material wears thin, braking performance decreases significantly, increasing stopping distances and risking safety.",
      "Most brake pads last 30,000–70,000 miles depending on driving habits, vehicle weight, and pad material. Replacing them promptly prevents damage to more expensive components like rotors and calipers.",
    ],
    symptoms: [
      "Squealing or squeaking noise when braking",
      "Grinding metal-on-metal sound",
      "Longer stopping distances",
      "Brake pedal vibration or pulsation",
      "Vehicle pulling to one side when braking",
      "Brake warning light on dashboard",
    ],
    causes: [
      "Normal wear from regular use",
      "Aggressive driving or frequent hard braking",
      "Heavy vehicle loads",
      "City driving with frequent stops",
      "Low-quality brake pad material",
    ],
    diyFeasibility:
      "Brake pad replacement is one of the most common DIY repairs. With basic tools (jack, lug wrench, C-clamp) and 1–2 hours, most vehicle owners can replace their own pads and save 50% or more.",
    chatPrompt: "I need to replace my brake pads",
    faqs: [
      {
        q: "How do I know when my brake pads need replacing?",
        a: "Listen for squealing (built-in wear indicators), check pad thickness visually through the wheel spokes (should be at least 3mm), or watch for the brake warning light on your dashboard.",
      },
      {
        q: "Should I replace rotors when replacing brake pads?",
        a: "Not always. If rotors are smooth, within thickness specifications, and not warped, you can reuse them. If you feel vibration when braking or see grooves in the rotor surface, they should be replaced or resurfaced.",
      },
      {
        q: "Can I replace just the front or rear brake pads?",
        a: "Yes, you should always replace brake pads per axle (both front or both rear together), but you don't need to replace all four wheels at once unless they all need it.",
      },
    ],
  },
};

const urgencyColors = {
  low: "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
};

export default function RepairGuide() {
  const { slug } = useParams<{ slug: string }>();
  const repair = slug ? REPAIRS[slug] : undefined;

  if (!repair) {
    return (
      <main className="pb-[60px] md:pb-0 section-padding">
        <div className="container-wrenchli text-center">
          <h1 className="font-heading text-3xl font-bold mb-4">Repair Guide Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We don't have a guide for that repair yet.
          </p>
          <Link to="/repairs" className="text-primary underline font-medium">
            Browse all repair guides →
          </Link>
        </div>
      </main>
    );
  }

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: repair.title,
    description: repair.description[0],
    provider: { "@type": "Organization", name: "Wrenchli", url: "https://wrenchli.net" },
    areaServed: [
      { "@type": "State", name: "Michigan" },
      { "@type": "State", name: "Ohio" },
    ],
    offers: {
      "@type": "AggregateOffer",
      lowPrice: repair.costLow,
      highPrice: repair.costHigh,
      priceCurrency: "USD",
    },
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO title={repair.seoTitle} description={repair.seoDescription} path={`/repairs/${repair.slug}`} />
      <FaqJsonLd faqs={repair.faqs} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-secondary section-padding">
        <div className="container-wrenchli max-w-3xl">
          <Link to="/repairs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> All Repair Guides
          </Link>
          <SectionReveal>
            <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
              {repair.heroHeading}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {repair.heroSub}
            </p>
          </SectionReveal>

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { icon: DollarSign, label: "Estimated Cost", value: `$${repair.costLow}–$${repair.costHigh}` },
              { icon: Clock, label: "Time Estimate", value: repair.timeEstimate },
              { icon: Wrench, label: "DIY?", value: repair.diyFeasibility.split(".")[0] },
              { icon: AlertTriangle, label: "Urgency", value: repair.urgencyLabel },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
                <s.icon className="h-5 w-5 mx-auto mb-1.5 text-accent" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="section-padding">
        <div className="container-wrenchli max-w-3xl space-y-10">
          <SectionReveal>
            <h2 className="font-heading text-xl font-bold mb-3">What Is This Repair?</h2>
            {repair.description.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed mb-3">{p}</p>
            ))}
          </SectionReveal>

          <SectionReveal>
            <h2 className="font-heading text-xl font-bold mb-3">Common Symptoms</h2>
            <ul className="space-y-2">
              {repair.symptoms.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </SectionReveal>

          <SectionReveal>
            <h2 className="font-heading text-xl font-bold mb-3">Possible Causes</h2>
            <ul className="space-y-2">
              {repair.causes.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </SectionReveal>

          <SectionReveal>
            <h2 className="font-heading text-xl font-bold mb-3">Can I Do This Myself?</h2>
            <p className="text-muted-foreground leading-relaxed">{repair.diyFeasibility}</p>
          </SectionReveal>
        </div>
      </section>

      {/* Chat CTA */}
      <InlineChatWidget />

      {/* FAQ */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-xl font-bold mb-6 text-center">
              Frequently Asked Questions
            </h2>
          </SectionReveal>
          <div className="space-y-3">
            {repair.faqs.map((faq, i) => (
              <SectionReveal key={i} delay={i * 80}>
                <details className="group rounded-xl border border-border bg-card overflow-hidden">
                  <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-foreground flex items-center justify-between">
                    {faq.q}
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/** Index page listing all repair guides */
export function RepairGuidesIndex() {
  const guides = Object.values(REPAIRS);

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Vehicle Repair Cost Guides — Free Estimates"
        description="Browse common vehicle repair guides with instant cost estimates, DIY tips, and shop comparison. Check engine light, brake pads, catalytic converter, and more."
        path="/repairs"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Wrenchli Repair Guides",
            itemListElement: guides.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: g.title,
              url: `https://wrenchli.net/repairs/${g.slug}`,
            })),
          })}
        </script>
      </Helmet>

      <section className="bg-secondary section-padding">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
              Vehicle Repair Guides
            </h1>
            <p className="text-lg text-muted-foreground">
              Free cost estimates, symptoms, and DIY feasibility for the most common repairs.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wrenchli max-w-3xl space-y-4">
          {guides.map((g, i) => (
            <SectionReveal key={g.slug} delay={i * 80}>
              <Link
                to={`/repairs/${g.slug}`}
                className="block rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold group-hover:text-primary transition-colors">
                      {g.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {g.description[0]}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        ${g.costLow}–${g.costHigh}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {g.timeEstimate}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${urgencyColors[g.urgency]}`}>
                        {g.urgency === "high" ? "Urgent" : g.urgency === "medium" ? "Moderate" : "Low"}
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180 shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </SectionReveal>
          ))}
        </div>
      </section>

      <InlineChatWidget />
    </main>
  );
}
