import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";

const consumerFaqs = [
  { q: "How does Wrenchli work?", a: "You describe your repair or enter a diagnostic code. Wrenchli sends your request to vetted local shops who provide real-time, binding quotes. You compare prices, read reviews, and book — all online." },
  { q: "Is Wrenchli free for car owners?", a: "Yes, completely free. We charge shops a small transaction fee — not you. The price you see is the price you pay." },
  { q: "How do you vet the shops?", a: "Every shop on Wrenchli must be licensed, insured, and meet our quality standards. We verify credentials and monitor reviews continuously." },
  { q: "Can I finance my repair?", a: "Yes — we're building in point-of-sale financing through multiple lending partners. You'll be able to apply at checkout and get approved in minutes. This feature is coming soon." },
  { q: "When is Wrenchli launching?", a: "We're launching in Detroit, Michigan first. Join the waitlist to be notified as soon as we go live in your area." },
  { q: "What if I'm not happy with the repair?", a: "We're developing a satisfaction guarantee program. Details will be announced before launch." },
];

const shopFaqs = [
  { q: "How much does Wrenchli cost for shops?", a: "$299/month per location for the full platform — marketplace listing, SaaS tools, payment processing, and customer management." },
  { q: "How do I get customers through Wrenchli?", a: "Customers search for repairs on Wrenchli and receive quotes from shops in their area. You set your own prices and respond to requests that match your services." },
  { q: "What SaaS tools are included?", a: "Smart scheduling, digital inspections (photo/video reports), integrated payments, customer CRM, automated reminders, and your own professional shop profile page." },
  { q: "Do I have to change my workflow?", a: "Wrenchli is designed to fit into how you already work. Our onboarding team will help you get set up and trained." },
  { q: "How do I apply?", a: "Visit our For Shop Owners page and fill out the early access application. We're onboarding Detroit shops now." },
];

export default function FAQ() {
  return (
    <main className="pb-[60px] md:pb-0">
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
            <h2 className="font-heading text-xl font-bold md:text-2xl mb-6">For Car Owners</h2>
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
