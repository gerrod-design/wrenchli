import { useState } from "react";

import SEO from "@/components/SEO";
import { ShieldCheck, Zap, CreditCard } from "lucide-react";

import SectionReveal from "@/components/SectionReveal";
import InlineChatWidget from "@/components/InlineChatWidget";
import CinematicHero from "@/components/CinematicHero";
import HowItWorksVideo from "@/components/HowItWorksVideo";
import VinRecallCheck from "@/components/VinRecallCheck";

import RecommendShopSection from "@/components/recommend/RecommendShopSection";
import RecommendShopModal from "@/components/recommend/RecommendShopModal";

import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import WaitlistForm from "@/components/WaitlistForm";
import { useLocation } from "@/contexts/LocationContext";
import MILoanBanner from "@/components/MILoanBanner";
import { HomeJsonLd } from "@/components/JsonLd";
import HomeFAQ from "@/components/HomeFAQ";

const valueProps = [
  { icon: ShieldCheck, title: "Transparent Pricing", desc: "See real prices upfront. No surprises, no hidden fees." },
  { icon: Zap, title: "Instant Quotes", desc: "Compare multiple shops in seconds. Book in minutes." },
  { icon: CreditCard, title: "Flexible Financing", desc: "Payment plans that fit your budget. All credit types welcome." },
];


export default function Index() {
  const [recommendOpen, setRecommendOpen] = useState(false);
  const userLocation = useLocation();

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Free Vehicle Symptom Assessment | Wrenchli — Michigan & Ohio"
        description="Describe what's wrong with your car and get a structured report with likely causes, cost ranges, and questions to ask your shop. Free. No account required."
        path="/"
      />
      <HomeJsonLd />
      <MILoanBanner />

      {/* Cinematic Hero */}
      <CinematicHero />

      {/* VIN Recall Check — high-trust, zero-friction entry point */}
      <VinRecallCheck />

      <HowItWorksVideo />

      <InlineChatWidget />

      

      {/* Value Proposition Cards */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli">
          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {valueProps.map((v, i) => (
              <SectionReveal key={v.title} delay={i * 120} className="h-full">
                <div className="flex h-full flex-col items-center rounded-xl border border-border/50 bg-muted/30 p-8 text-center">
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

      <TestimonialsCarousel />

      <HomeFAQ />

      {/* Waitlist Signup */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-2xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Be the First to Know
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Wrenchli is launching in {userLocation.region} soon. Join the early access list and get notified when we go live.
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

      {/* Recommend a Shop — soft ask after trust is built */}
      <RecommendShopSection onOpenModal={() => setRecommendOpen(true)} />

      <RecommendShopModal open={recommendOpen} onClose={() => setRecommendOpen(false)} />
    </main>
  );
}
