import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import {
  ShieldCheck, DollarSign, Star, CreditCard, Calendar, Bell,
  Car, Search, BarChart3, CheckCircle, ArrowRight, MessageSquare
} from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const steps = [
  { step: 1, icon: MessageSquare, title: "Tell Us What's Wrong", desc: "Describe your issue in plain English or enter a diagnostic trouble code. No mechanic-speak required — just tell us what's happening with your car." },
  { step: 2, icon: Search, title: "Get Instant Quotes", desc: "Receive full price breakdowns from verified local shops — parts, labor, and fees all itemized. No surprises, no hidden costs." },
  { step: 3, icon: BarChart3, title: "Compare & Choose", desc: "See ratings, reviews, prices, and availability side by side. Choose the shop that fits your needs and budget." },
  { step: 4, icon: Calendar, title: "Book & Pay Your Way", desc: "Schedule your repair online and pay how you want — upfront, or finance it with flexible payment plans for all credit profiles." },
  { step: 5, icon: CheckCircle, title: "Get Back on the Road", desc: "Receive real-time status updates via text and email. Rate your experience and help other car owners make better decisions." },
];

const benefits = [
  { icon: DollarSign, title: "True Price Transparency", desc: "The price you see is the price you pay. Every quote includes parts, labor, and fees — fully itemized." },
  { icon: ShieldCheck, title: "Vetted Local Shops", desc: "Every shop is verified for quality, licensing, insurance, and customer satisfaction before joining Wrenchli." },
  { icon: Star, title: "Real Customer Reviews", desc: "Honest feedback from real customers tied to real repairs. No fake reviews, no gaming the system." },
  { icon: CreditCard, title: "Financing for Everyone", desc: "Multiple lending partners, all credit profiles welcome. Apply at checkout and get approved in minutes." },
  { icon: Calendar, title: "Book Online, Anytime", desc: "Schedule your repair 24/7 — no phone tag, no waiting on hold. Pick the time that works for you." },
  { icon: Bell, title: "Status Updates", desc: "Get text and email notifications as your repair progresses. Know exactly when your car will be ready." },
];

const faqs = [
  { q: "Is Wrenchli really free for car owners?", a: "Yes, 100% free. We charge shops a small transaction fee when you book through the platform — you never pay extra. The price you see from each shop is the price you pay." },
  { q: "How do you verify the shops?", a: "Every shop on Wrenchli must be licensed, insured, and meet our quality standards. We verify credentials, check business history, and continuously monitor customer satisfaction ratings." },
  { q: "How accurate are the quotes?", a: "Quotes are binding once you accept them. Shops provide itemized breakdowns of parts, labor, and fees based on your vehicle and repair description. If additional work is discovered, the shop must get your approval before proceeding." },
  { q: "What financing options are available?", a: "We're partnering with multiple lenders to offer financing for all credit profiles — good, fair, and rebuilding. You'll be able to apply at checkout and see your options in minutes. This feature is launching soon." },
  { q: "What about the DIY diagnostic tool?", a: "Vehicle Insights is our upcoming AI-powered diagnostic feature. Enter a trouble code or describe symptoms to get plain-English explanations, estimated repair costs, and maintenance schedules. It's currently in development." },
  { q: "Do you use affiliate links for parts?", a: "In the future, we may offer links to purchase parts directly. If we do, we'll always disclose any affiliate relationships transparently. Your trust comes first." },
  { q: "What if I'm not happy with the repair?", a: "We're developing a satisfaction guarantee program that will include dispute resolution and quality assurance. Details will be announced before launch." },
  { q: "When is Wrenchli launching?", a: "We're launching in Detroit, Michigan first. Join the waitlist to be notified as soon as we go live in your area. We're onboarding shops now and aiming to launch soon." },
];

export default function ForCarOwners() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="For Car Owners"
        description="Stop overpaying for car repairs. Get instant quotes from vetted local shops, compare prices, and finance if you need to. Free for car owners."
        path="/for-car-owners"
      />
      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-wrenchli-green/20 px-4 py-1 text-sm font-medium text-wrenchli-green">
              <Car className="h-4 w-4" /> For Car Owners
            </div>
            <h1 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Stop Overpaying. Start Trusting.
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Finding an honest mechanic shouldn't feel like a gamble. Wrenchli gives you transparent pricing, vetted shops, and the confidence to say yes to the right repair at the right price.
            </p>
            <Button asChild size="lg" className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
              <Link to="/#quote">
                Get Your Free Quote <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* How It Works — 5 Step Cards */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">How It Works</h2>
            <p className="mt-3 text-center text-muted-foreground md:text-lg">From problem to solution in five simple steps.</p>
          </SectionReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <SectionReveal key={s.step} delay={i * 100} className={i === 4 ? "md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto lg:max-w-none" : ""}>
                <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-heading font-bold">
                      {s.step}
                    </div>
                    <s.icon className="h-5 w-5 text-wrenchli-green" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Why Car Owners Choose Wrenchli</h2>
          </SectionReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <SectionReveal key={b.title} delay={i * 80}>
                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wrenchli-green/10">
                    <b.icon className="h-5 w-5 text-wrenchli-green" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold">{b.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-8">Frequently Asked Questions</h2>
          </SectionReveal>
          <SectionReveal>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem value={`faq-${i}`} key={i}>
                  <AccordionTrigger className="text-left text-sm md:text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-3xl font-bold md:text-5xl">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-primary-foreground/70">
              Get your first quote in under 60 seconds. Free for car owners — always.
            </p>
            <Button asChild size="lg" className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
              <Link to="/#quote">
                Get Your Free Quote <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
