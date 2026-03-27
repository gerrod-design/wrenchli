import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { FaqJsonLd } from "@/components/JsonLd";
import SectionReveal from "@/components/SectionReveal";
import InlineChatWidget from "@/components/InlineChatWidget";
import { ArrowLeft, Wrench, DollarSign, Clock, AlertTriangle, ChevronDown, ExternalLink } from "lucide-react";
import { Helmet } from "react-helmet-async";
import React from "react";

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
  description: React.ReactNode[];
  symptoms: string[];
  causes: string[];
  diyFeasibility: React.ReactNode;
  chatPrompt: string;
  faqs: { q: string; a: string }[];
  relatedLinks: { label: string; to: string }[];
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
      <>The check engine light (CEL) is your vehicle's way of telling you something needs attention in the engine, emissions, or powertrain system. It can indicate anything from a loose gas cap to a failing <Link to="/repairs/catalytic-converter-replacement" className="text-primary underline hover:text-primary/80">catalytic converter</Link>.</>,
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
    diyFeasibility: (
      <>Some causes like a loose gas cap are trivial DIY fixes. Others like oxygen sensors are moderate — check our <Link to="/diy" className="text-primary underline hover:text-primary/80">DIY tutorial library</Link>. Catalytic converter replacement typically requires a <Link to="/find-shops" className="text-primary underline hover:text-primary/80">professional shop</Link>.</>
    ),
    chatPrompt: "My check engine light is on",
    relatedLinks: [
      { label: "Browse DIY tutorials", to: "/diy" },
      { label: "Find a shop near you", to: "/find-shops" },
      { label: "Get a repair quote", to: "/get-quote" },
      { label: "Explore financing options", to: "/financing-options" },
    ],
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
      <>The catalytic converter is a critical emissions component that converts toxic exhaust gases into less harmful emissions. When it fails, your vehicle will fail emissions tests and trigger <Link to="/repairs/check-engine-light" className="text-primary underline hover:text-primary/80">check engine codes</Link> like P0420 or P0430.</>,
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
    diyFeasibility: (
      <>Catalytic converter replacement is generally a professional-level repair requiring welding or specialized tools. <Link to="/find-shops" className="text-primary underline hover:text-primary/80">Find a trusted shop near you</Link> or explore <Link to="/financing-options" className="text-primary underline hover:text-primary/80">financing options</Link> for this higher-cost repair.</>
    ),
    chatPrompt: "I need a catalytic converter replacement",
    relatedLinks: [
      { label: "Find a shop near you", to: "/find-shops" },
      { label: "Explore financing options", to: "/financing-options" },
      { label: "Get a repair quote", to: "/get-quote" },
    ],
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
    diyFeasibility: (
      <>Brake pad replacement is one of the most common DIY repairs. Follow our <Link to="/diy" className="text-primary underline hover:text-primary/80">step-by-step brake pad tutorial</Link> — with basic tools and 1–2 hours, most vehicle owners can save 50% or more.</>
    ),
    chatPrompt: "I need to replace my brake pads",
    relatedLinks: [
      { label: "DIY brake pad tutorial", to: "/diy" },
      { label: "Find a shop near you", to: "/find-shops" },
      { label: "Get a repair quote", to: "/get-quote" },
      { label: "Explore financing options", to: "/financing-options" },
    ],
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
  "oil-change": {
    slug: "oil-change",
    title: "Oil Change",
    seoTitle: "Oil Change Cost — $30–$125 | DIY or Shop Estimates",
    seoDescription:
      "How much does an oil change cost? Get instant estimates for conventional or synthetic oil, compare shop prices, or follow our DIY guide to save.",
    heroHeading: "Time for an Oil Change?",
    heroSub: "Compare shop prices or do it yourself — we'll walk you through both.",
    costLow: 30,
    costHigh: 125,
    timeEstimate: "30–60 minutes",
    urgency: "medium",
    urgencyLabel: "Overdue oil damages your engine",
    description: [
      "Regular oil changes are the single most important maintenance you can do for your engine. Motor oil lubricates moving parts, reduces friction, and carries away heat and contaminants.",
      <>Skipping oil changes leads to sludge buildup, accelerated engine wear, and eventually catastrophic failure. Most vehicles need an oil change every 5,000–7,500 miles for synthetic oil, or 3,000–5,000 miles for conventional. Check our <Link to="/diy" className="text-primary underline hover:text-primary/80">DIY oil change tutorial</Link> to save 50% or more.</>,
    ],
    symptoms: [
      "Oil change reminder light or maintenance minder",
      "Dark, gritty oil on the dipstick",
      "Engine running louder than normal",
      "Decreased fuel economy",
      "Oil smell inside the cabin",
    ],
    causes: [
      "Exceeded mileage or time interval since last change",
      "Severe driving conditions (short trips, dusty roads, towing)",
      "Oil leak causing low oil level",
      "Using incorrect oil weight or quality",
    ],
    diyFeasibility: (
      <>Oil changes are one of the easiest and most rewarding DIY jobs. Follow our <Link to="/diy" className="text-primary underline hover:text-primary/80">step-by-step oil change tutorial</Link> — you'll need a jack, drain pan, wrench, and about 30 minutes.</>
    ),
    chatPrompt: "I need an oil change",
    relatedLinks: [
      { label: "DIY oil change tutorial", to: "/diy" },
      { label: "Find a shop near you", to: "/find-shops" },
      { label: "Get a repair quote", to: "/get-quote" },
    ],
    faqs: [
      {
        q: "How often should I change my oil?",
        a: "For most modern vehicles using synthetic oil, every 7,500–10,000 miles or once a year. Conventional oil should be changed every 3,000–5,000 miles. Always check your owner's manual for the manufacturer's recommendation.",
      },
      {
        q: "Is synthetic oil worth the extra cost?",
        a: "Yes, for most vehicles. Synthetic oil lasts longer between changes, performs better in extreme temperatures, and provides superior engine protection. The higher per-quart cost is offset by longer change intervals.",
      },
      {
        q: "Can I switch between conventional and synthetic oil?",
        a: "Yes, you can switch freely between conventional, synthetic blend, and full synthetic oil. There's no need to flush the engine. Many mechanics recommend upgrading to synthetic for better protection.",
      },
    ],
  },
  "transmission-repair": {
    slug: "transmission-repair",
    title: "Transmission Repair",
    seoTitle: "Transmission Repair Cost — $150–$5,000+ Estimates",
    seoDescription:
      "How much does transmission repair cost? From fluid changes ($150) to full rebuilds ($3,000+). Get instant estimates for your vehicle and compare shop prices.",
    heroHeading: "Transmission Problems?",
    heroSub: "Get an instant cost estimate — from a fluid flush to a full rebuild.",
    costLow: 150,
    costHigh: 5000,
    timeEstimate: "2 hours – 3 days",
    urgency: "high",
    urgencyLabel: "Driving risks further damage",
    description: [
      "The transmission is one of the most complex and expensive components in your vehicle. It transfers power from the engine to the wheels and allows you to shift between gears. When it fails, you may lose the ability to drive altogether.",
      <>Transmission issues range from simple fixes like a fluid change ($150–$300) to major rebuilds ($2,500–$5,000+). Early diagnosis is critical — catching a problem early can save thousands. <Link to="/find-shops" className="text-primary underline hover:text-primary/80">Find a transmission specialist near you</Link> or explore <Link to="/financing-options" className="text-primary underline hover:text-primary/80">financing options</Link> for larger repairs.</>,
    ],
    symptoms: [
      "Slipping gears or delayed engagement",
      "Grinding or shaking when shifting",
      "Transmission warning light on dashboard",
      "Burning smell from transmission fluid",
      "Leaking red or brown fluid under the vehicle",
      "Vehicle won't move in drive or reverse",
    ],
    causes: [
      "Low or degraded transmission fluid",
      "Worn clutch plates or bands",
      "Failed solenoids or valve body issues",
      "Torque converter failure",
      "Overheating from towing or heavy use",
      "Normal wear at high mileage (150,000+ miles)",
    ],
    diyFeasibility: (
      <>Transmission fluid changes are a moderate DIY job — check our <Link to="/diy" className="text-primary underline hover:text-primary/80">DIY tutorials</Link>. Internal transmission repairs require specialized tools and expertise, so <Link to="/find-shops" className="text-primary underline hover:text-primary/80">find a qualified shop</Link> for anything beyond fluid service.</>
    ),
    chatPrompt: "My transmission is having problems",
    relatedLinks: [
      { label: "Find a transmission shop", to: "/find-shops" },
      { label: "Get a repair quote", to: "/get-quote" },
      { label: "Explore financing options", to: "/financing-options" },
      { label: "Browse DIY tutorials", to: "/diy" },
    ],
    faqs: [
      {
        q: "How do I know if my transmission is failing?",
        a: "Common signs include slipping gears (RPMs rise but the car doesn't accelerate), delayed shifting, grinding noises, and leaking red fluid. A check engine light with transmission-related codes (P0700–P0799) is also a strong indicator.",
      },
      {
        q: "Is it better to rebuild or replace a transmission?",
        a: "A rebuild is usually cheaper ($2,500–$4,500) and can last just as long as a replacement. A full replacement ($4,000–$8,000) may be better for high-mileage vehicles where other internal components are also worn.",
      },
      {
        q: "How long does a transmission last?",
        a: "With proper maintenance (regular fluid changes), an automatic transmission can last 200,000+ miles. Manual transmissions often last even longer. Neglecting fluid changes is the #1 cause of premature failure.",
      },
    ],
  },
  "alternator-replacement": {
    slug: "alternator-replacement",
    title: "Alternator Replacement",
    seoTitle: "Alternator Replacement Cost — $350–$900 Estimates",
    seoDescription:
      "How much does alternator replacement cost? Get instant estimates for your specific vehicle, compare shop prices, and learn if it's a DIY-friendly repair.",
    heroHeading: "Alternator Going Out?",
    heroSub: "Get an instant cost estimate and find out if you can DIY it.",
    costLow: 350,
    costHigh: 900,
    timeEstimate: "1–3 hours",
    urgency: "high",
    urgencyLabel: "Battery will die — fix soon",
    description: [
      "The alternator charges your battery and powers electrical systems while the engine is running. When it fails, your battery drains quickly, and you'll eventually be stranded with a vehicle that won't start.",
      <>A failing alternator is often confused with a bad battery. If you've replaced the battery recently and it keeps dying, the alternator is likely the culprit. Get a <Link to="/get-quote" className="text-primary underline hover:text-primary/80">free diagnosis</Link> to confirm before spending money on the wrong fix.</>,
    ],
    symptoms: [
      "Dimming or flickering headlights",
      "Battery warning light on dashboard",
      "Dead battery that keeps recurring",
      "Whining or grinding noise from the engine",
      "Electrical accessories (radio, windows) working intermittently",
      "Burning rubber smell from a slipping belt",
    ],
    causes: [
      "Worn bearings inside the alternator",
      "Failed voltage regulator",
      "Broken or worn serpentine belt",
      "Corroded or loose electrical connections",
      "Age and normal wear (alternators last 80,000–150,000 miles)",
    ],
    diyFeasibility: (
      <>Alternator replacement is a moderate DIY job on most vehicles — accessible from the top of the engine bay with basic hand tools. Check our <Link to="/diy" className="text-primary underline hover:text-primary/80">DIY tutorials</Link> for guidance, or <Link to="/find-shops" className="text-primary underline hover:text-primary/80">find a shop</Link> if your vehicle has a difficult-to-reach alternator.</>
    ),
    chatPrompt: "I think my alternator is failing",
    relatedLinks: [
      { label: "Browse DIY tutorials", to: "/diy" },
      { label: "Find a shop near you", to: "/find-shops" },
      { label: "Get a repair quote", to: "/get-quote" },
      { label: "Explore financing options", to: "/financing-options" },
    ],
    faqs: [
      {
        q: "How do I tell if it's the alternator or the battery?",
        a: "Jump-start your car — if it runs fine but dies again after turning it off, the alternator isn't charging the battery. If it won't hold a jump at all, the battery itself may be the issue. Most auto parts stores will test both for free.",
      },
      {
        q: "Can I drive with a bad alternator?",
        a: "Only for a very short distance. Once the alternator fails, your car runs entirely on battery power, which typically lasts 20–30 minutes. You'll lose power steering, headlights, and eventually the engine will stall.",
      },
      {
        q: "How long does an alternator last?",
        a: "Most alternators last 80,000–150,000 miles (7–12 years). Lifespan depends on driving conditions, electrical load, and the quality of the original part.",
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
              { icon: Wrench, label: "DIY?", value: repair.urgency === "high" ? "Shop recommended" : "Possible" },
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

          {/* Related Links */}
          <SectionReveal>
            <h2 className="font-heading text-xl font-bold mb-3">Helpful Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {repair.relatedLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4 shrink-0 text-accent" />
                  {link.label}
                </Link>
              ))}
            </div>
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
