import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";

const consumerFaqs = [
  { q: "How does Wrenchli work?", a: "You describe your symptoms in plain English. Wrenchli gives you a free assessment — likely causes, how urgent it is, and typical cost ranges — so you walk into any shop prepared. The assessment and Garage are live now and always free; shop referrals are in pilot." },
  { q: "Is Wrenchli free for vehicle owners?", a: "Yes, completely free. Wrenchli never charges vehicle owners — the assessment and the Garage are always free." },
  { q: "How do you vet the shops?", a: "We don't claim to vet shops — no website can guarantee a shop's work. Our Detroit Spotlight shops are hand-reviewed listings, and shops in our referral pilot file a 2-minute outcome report on every referral. Those confirmed outcomes power each shop's Verified Score." },
  { q: "Can I finance my repair?", a: "Not yet — it's on the way, starting with Michigan's upcoming Affordable Loan program and 0% installment plans. See every way to pay and join the notify list on our financing page. Our rule: we'll never show a loan above 24% APR." },
  { q: "When is Wrenchli launching?", a: "The symptom assessment is live now and free for any U.S. vehicle owner. We're enrolling shops in Detroit and Columbus, Ohio in a free 90-day referral pilot — join the waitlist and we'll notify you as referrals go live in your area." },
  { q: "What if I'm not happy with the repair?", a: "Tell us — outcome reports are how Wrenchli learns. After a shop visit, file a 2-minute outcome report: what was found, what was done, what it cost. Those reports power shop Verified Scores and make every future assessment smarter." },
];

const shopFaqs = [
  // Shop track: free 90-day referral pilot now enrolling (replaces 2026-09-17 pause).
  { q: "Can my shop join Wrenchli?", a: "Yes — we're enrolling independent shops in Detroit and Columbus, Ohio in a free 90-day referral pilot: pre-assessed customers, no exclusivity, no auto-billing. See /for-shops for details." },
  { q: "How much does Wrenchli cost for shops?", a: "The 90-day referral pilot is free. After the pilot we'll review your results together — pilot shops get founding terms on paid tiers before public pricing." },
  { q: "How do I get customers through Wrenchli?", a: "Join the free referral pilot and we'll send you customers with their symptoms, likely causes, and a fair cost range already assessed. The price of admission: a 2-minute outcome report on each referral." },
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
