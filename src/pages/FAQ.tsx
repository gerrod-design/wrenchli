import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";
import { consumerFaqs, shopFaqs } from "@/data/faq";

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
            {/* All items start expanded so every answer is present in the
                prerendered HTML (and matches the FAQPage JSON-LD). Visitors
                can still collapse any item. */}
            <Accordion type="multiple" defaultValue={consumerFaqs.map((_, i) => `consumer-${i}`)} className="w-full">
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
            <Accordion type="multiple" defaultValue={shopFaqs.map((_, i) => `shop-${i}`)} className="w-full">
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
