import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";

const consumerFaqs = [
  { q: "How does Wrenchli work?", a: "You describe your repair or enter a diagnostic code. Wrenchli sends your request to vetted local shops who provide real-time, binding quotes. You compare prices, read reviews, and book — all online." },
  { q: "Is Wrenchli free for vehicle owners?", a: "Yes, completely free. We charge shops a small transaction fee — not you. The price you see is the price you pay." },
  { q: "How do you vet the shops?", a: "Every shop on Wrenchli must be licensed, insured, and meet our quality standards. We verify credentials and monitor reviews continuously." },
  { q: "Can I finance my repair?", a: "Yes — we're building in point-of-sale financing through multiple lending partners. You'll be able to apply at checkout and get approved in minutes. This feature is coming soon." },
  { q: "When is Wrenchli launching?", a: "The symptom assessment is live now and free for any U.S. vehicle owner. Shop matching is currently paused while we focus on the assessment — join the waitlist and we'll notify you when it goes live in your area." },
  { q: "What if I'm not happy with the repair?", a: "We're developing a satisfaction guarantee program. Details will be announced before launch." },
];

const shopFaqs = [
  // Shop track paused 2026-09-17: no partner shops, no pilot, no pricing.
  { q: "Can my shop join Wrenchli?", a: "Our shop partner program is currently paused while we focus on the free consumer symptom assessment. We're not onboarding shops right now." },
  { q: "How much does Wrenchli cost for shops?", a: "There is no shop pricing at this time — the shop program is paused." },
  { q: "How do I get customers through Wrenchli?", a: "Shop matching is paused, so we're not sending customers to shops right now." },
  { q: "Will you offer shop software or integrations?", a: "Not at this time. When the shop track reopens, we'll announce what integrations are actually available." },
];

export default function FAQ() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="FAQ"
        description="Frequently asked questions about Wrenchli — how it works, pricing, shop verification, financing options, and launch timeline."
        path="/faq"
      />
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl">Frequently Asked Questions</h1>
            <p className="mt-4 text-primary-foreground/70 md:text-lg">Everything you need to know about Wrenchli.</p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-xl font-bold md:text-2xl mb-6">For Vehicle Owners</h2>
            <Accordion type="single" collapsible className="w-full">
              {consumerFaqs.map((faq, i) => (
                <AccordionItem value={`consumer-${i}`} key={i}>
                  <AccordionTrigger className="text-left text-sm md:text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionReveal>

          <SectionReveal>
            <h2 className="font-heading text-xl font-bold md:text-2xl mb-6 mt-12">For Shop Owners</h2>
            <Accordion type="single" collapsible className="w-full">
              {shopFaqs.map((faq, i) => (
                <AccordionItem value={`shop-${i}`} key={i}>
                  <AccordionTrigger className="text-left text-sm md:text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">Still have questions?</h2>
            <p className="mt-3 text-primary-foreground/70">
              <Link to="/contact" className="text-accent underline hover:no-underline">Contact us</Link> or join the waitlist below.
            </p>
            <div className="mx-auto mt-8 max-w-xl">
              <WaitlistForm source="faq" />
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
