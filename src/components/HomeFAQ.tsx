import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SectionReveal from "@/components/SectionReveal";
import { FaqJsonLd } from "@/components/JsonLd";

const FAQ_ITEMS = [
  {
    q: "How does Wrenchli work?",
    a: "Tell our AI advisor what's wrong with your vehicle — describe symptoms, enter a diagnostic code, or upload a photo of damage. Wrenchli instantly diagnoses the issue, estimates repair costs, and connects you with vetted local shops or DIY guides.",
  },
  {
    q: "Is the diagnosis really free?",
    a: "Yes, 100% free. You can diagnose unlimited vehicle issues, get cost estimates, and browse DIY tutorials without paying a thing. You only pay if you choose to book a repair through a partner shop.",
  },
  {
    q: "What areas does Wrenchli serve?",
    a: "We're launching in Michigan and Ohio first, with plans to expand nationwide. Join our waitlist to be notified when we go live in your area.",
  },
  {
    q: "How accurate are the repair cost estimates?",
    a: "Our estimates are based on real shop pricing data, labor rates, and OEM/aftermarket parts costs for your specific vehicle. They typically fall within 10–15% of the actual quote you'll receive from a shop.",
  },
  {
    q: "Can I do the repair myself instead of going to a shop?",
    a: "Absolutely. For many common repairs, Wrenchli provides step-by-step video tutorials, parts lists with direct purchase links, and tool recommendations so you can save money by doing it yourself.",
  },
  {
    q: "Does Wrenchli offer financing for repairs?",
    a: "Yes. We partner with financing providers to offer flexible payment plans for vehicle repairs. All credit types are welcome, and you can see your estimated monthly payment before committing.",
  },
  {
    q: "How do I identify my vehicle?",
    a: "You can select your year, make, and model from dropdowns, type your 17-character VIN, or scan it with your phone camera for instant identification.",
  },
  {
    q: "Is my vehicle data private?",
    a: "Yes. We don't sell your data. Vehicle information is used only to provide accurate diagnoses and estimates. Read our Privacy Policy for full details.",
  },
];

export default function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="section-padding bg-background">
      <FaqJsonLd faqs={FAQ_ITEMS} />
      <div className="container-wrenchli max-w-3xl">
        <SectionReveal>
          <h2 className="font-heading text-2xl font-bold md:text-4xl text-center mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Everything you need to know about Wrenchli.
          </p>
        </SectionReveal>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <SectionReveal key={i} delay={i * 60}>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                  aria-expanded={openIndex === i}
                >
                  <span className="font-medium text-sm md:text-base text-foreground">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
