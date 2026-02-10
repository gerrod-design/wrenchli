import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { ShieldCheck, Zap, CreditCard } from "lucide-react";

import SectionReveal from "@/components/SectionReveal";
import QuickActionBar from "@/components/QuickActionBar";
import CinematicHero from "@/components/CinematicHero";
import HowItWorksVideo from "@/components/HowItWorksVideo";
import { Button } from "@/components/ui/button";
import RecommendShopSection from "@/components/recommend/RecommendShopSection";
import RecommendShopModal from "@/components/recommend/RecommendShopModal";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import WaitlistForm from "@/components/WaitlistForm";

const valueProps = [
  { icon: ShieldCheck, title: "Transparent Pricing", desc: "See real prices upfront. No surprises, no hidden fees." },
  { icon: Zap, title: "Instant Quotes", desc: "Compare multiple shops in seconds. Book in minutes." },
  { icon: CreditCard, title: "Flexible Financing", desc: "Payment plans that fit your budget. All credit types welcome." },
];


export default function Index() {
  const [recommendOpen, setRecommendOpen] = useState(false);

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Wrenchli — Vehicle Repair, Finally Fixed"
        description="Get instant quotes from trusted local shops. Compare prices, book with confidence, and finance if you need to. Launching in Detroit."
        path="/"
      />
      {/* Cinematic Hero */}
      <CinematicHero />

      <HowItWorksVideo />

      <QuickActionBar />

      {/* Value Proposition Cards */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <div className="grid gap-6 md:grid-cols-3">
            {valueProps.map((v, i) => (
              <SectionReveal key={v.title} delay={i * 120}>
                <div className="group flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <v.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Recommend a Shop */}
      <RecommendShopSection onOpenModal={() => setRecommendOpen(true)} />

      <TestimonialsCarousel />

      {/* Waitlist Signup */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-2xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Be the First to Know
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Wrenchli is launching in Detroit soon. Join the early access list and get notified when we go live.
            </p>
            <div className="mt-8">
              <WaitlistForm source="home-waitlist" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No spam, ever. Unsubscribe anytime.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-3xl font-bold md:text-5xl">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-primary-foreground/70">
              Get your first diagnosis in under 60 seconds. No account required.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
                <Link to="/#quote">Get Your Free Diagnosis</Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      <RecommendShopModal open={recommendOpen} onClose={() => setRecommendOpen(false)} />
    </main>
  );
}
