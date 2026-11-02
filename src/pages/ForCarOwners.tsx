import { useState, useCallback } from "react";
import type { WalkthroughPath } from "@/components/PhoneMockup";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import heroCarOwners from "@/assets/hero-car-owners.jpg";
import {
  ShieldCheck, DollarSign, Star, CreditCard, Calendar, Bell,
  Car, Search, ClipboardList, GitFork, Wrench, CheckCircle, ArrowRight, MessageSquare, Tv
} from "lucide-react";
import { cn } from "@/lib/utils";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PhoneMockup from "@/components/PhoneMockup";

const steps = [
  { step: 1, icon: MessageSquare, title: "Tell Us What's Wrong", desc: "Describe your issue in plain English or enter an OBD-II code from your scanner. No mechanic-speak required." },
  { step: 2, icon: ClipboardList, title: "Get Your Assessment", desc: "See what's likely wrong, how urgent it is, and what it might cost — with plain-English explanations." },
  { step: 3, icon: GitFork, title: "Explore Your Options", desc: "Choose your path: follow a DIY guide where one is safe for your repair, or share your assessment with a participating shop." },
  { step: 4, icon: Wrench, title: "Fix It Your Way", desc: "Follow a video guide at your own pace, or contact a participating shop directly to arrange your repair." },
  { step: 5, icon: CheckCircle, title: "Get Back on the Road", desc: "Whether you fixed it yourself or used a shop, you're back in control. Rate your experience and help others." },
];

const benefits = [
  { icon: DollarSign, title: "True Price Transparency", desc: "Your assessment shows a fair cost range for the repair, based on typical parts and labor — before you ever talk to a shop." },
  { icon: ShieldCheck, title: "Independent Local Shops", desc: "Independent shops enrolled in our free referral pilot. You see your assessment first, and you decide who to contact." },
  { icon: Star, title: "Outcomes on Record", desc: "Participating shops report the outcome of every referred repair, building a record tied to real work — not advertising." },
  { icon: CreditCard, title: "Financing for Everyone", desc: "Multiple lending partners, all credit profiles welcome. Apply at checkout and get approved in minutes." },
  { icon: Calendar, title: "Assess Online, Anytime", desc: "Run your free assessment anytime. Where a participating shop is available, you can share it and reach out when it suits you." },
  { icon: Bell, title: "Status Updates", desc: "Get text and email notifications as your repair progresses. Know exactly when your vehicle will be ready." },
];

const faqs = [
  { q: "Is Wrenchli really free for vehicle owners?", a: "Yes, 100% free. The assessment is completely free for vehicle owners, and Wrenchli never charges you anything." },
  { q: "How do you verify the shops?", a: "Shops in our referral pilot are independent shops that have enrolled in the program. Wrenchli doesn't certify or guarantee any shop — check the shop's own credentials and reviews before you authorize work. Shops report the outcome of each referred repair back to Wrenchli." },
  { q: "How accurate are the quotes?", a: "Wrenchli doesn't provide shop quotes. Your assessment gives you an informational cost range based on typical parts and labor for your vehicle, so you can have an informed conversation. The shop sets its own price after inspecting your vehicle — always confirm the final price with the shop before authorizing work." },
  { q: "What financing options are available?", a: "Repair financing is on the way. We'll announce payment options as soon as they're available." },
  { q: "What about the DIY assessment tool?", a: "Vehicle Insights is our upcoming AI-powered assessment feature. Enter a trouble code or describe symptoms to get plain-English explanations, estimated repair costs, and maintenance schedules. It's currently in development." },
  { q: "Do you use affiliate links for parts?", a: "In the future, we may offer links to purchase parts directly. If we do, we'll always disclose any affiliate relationships transparently. Your trust comes first." },
  { q: "What if I'm not happy with the repair?", a: "We're developing a satisfaction guarantee program that will include dispute resolution and quality assurance. Details will be announced before launch." },
  { q: "When is Wrenchli launching?", a: "The symptom assessment is live now and free for any U.S. vehicle owner. Our free referral pilot is open to independent shops nationally — free for each shop until it completes its first five referred repairs — and referrals are available wherever participating shops have joined." },
];

/* ─── Tabbed Walkthrough for Car Owners ─── */

function CarOwnersWalkthrough() {
  const [activeTab, setActiveTab] = useState<"diy" | "shop">("diy");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<WalkthroughPath>("diy");

  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step);
  }, []);

  const handleTabSwitch = useCallback((tab: "diy" | "shop") => {
    setActiveTab(tab);
    setSelectedPath(tab);
    setActiveStep(null);
    setIsPlaying(false);
  }, []);

  const handlePathSelect = useCallback((path: "diy" | "shop") => {
    setSelectedPath(path);
    setActiveTab(path);
  }, []);

  return (
    <section className="section-padding bg-secondary" role="region" aria-label="Product walkthrough showing how to use Wrenchli">
      <div className="container-wrenchli">
        <SectionReveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[3px] text-muted-foreground">
            See How It Works
          </p>
          <h2 className="mt-2 text-center font-heading text-2xl font-bold text-foreground md:text-4xl">
            Watch a real assessment from start to finish.
          </h2>
        </SectionReveal>

        {/* Tab toggle */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => handleTabSwitch("diy")}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 border-2",
              activeTab === "diy"
                ? "bg-wrenchli-teal text-white border-wrenchli-teal"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            )}
          >
            🔧 DIY Experience
          </button>
          <button
            onClick={() => handleTabSwitch("shop")}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 border-2",
              activeTab === "shop"
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            )}
          >
            👨‍🔧 Shop Experience
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {activeTab === "diy"
            ? "See the full DIY experience — assess, learn, order parts, and fix it yourself."
            : "See the full shop experience — assess, compare quotes, finance, and book."}
        </p>

        <div className="mt-6 mx-auto max-w-[800px]">
          <SectionReveal>
            <PhoneMockup
              activeStep={activeStep}
              onStepChange={handleStepChange}
              isPlaying={isPlaying}
              onPlayingChange={setIsPlaying}
              onComplete={() => {}}
              selectedPath={selectedPath}
              onPathSelect={handlePathSelect}
            />
          </SectionReveal>
        </div>

        <SectionReveal>
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
              <Link to="/vehicle-insights">
                Get Your Free Assessment <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

export default function ForCarOwners() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="For Vehicle Owners"
        description="Know what's wrong before you pay for it. Get a free symptom assessment and a fair cost range, and share it with a participating shop where one has joined. Free for vehicle owners."
        path="/for-car-owners"
      />
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground section-padding overflow-hidden">
        <img src={heroCarOwners} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60" />
        <div className="container-wrenchli text-center relative">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-wrenchli-green/20 px-4 py-1 text-sm font-medium text-wrenchli-green">
              <Car className="h-4 w-4" /> For Vehicle Owners
            </div>
            <h1 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Stop Overpaying. Start Trusting.
            </h1>
            <p className="mt-3 text-base font-semibold tracking-wide text-primary-foreground/90 md:text-lg">Mobility for All.</p>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Finding an honest mechanic shouldn't feel like a gamble. Wrenchli gives you transparent pricing and the confidence to say yes to the right repair at the right price.
            </p>
            <Button asChild size="lg" className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
              <Link to="/#quote">
                Get Your Free Quote <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* How Wrenchli Works — Tabbed Walkthrough */}
      <CarOwnersWalkthrough />

      {/* How It Works — 5 Step Cards */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">The 5 Steps in Detail</h2>
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
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Why Vehicle Owners Choose Wrenchli</h2>
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
              Get your first quote in under 60 seconds. Free for vehicle owners — always.
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
