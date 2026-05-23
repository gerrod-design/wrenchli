import { useState } from "react";

import SEO from "@/components/SEO";
import { ShieldCheck, Zap, CreditCard } from "lucide-react";

import SectionReveal from "@/components/SectionReveal";
import QuickActionBar from "@/components/QuickActionBar";
import CinematicHero from "@/components/CinematicHero";
import HowItWorksVideo from "@/components/HowItWorksVideo";

import RecommendShopSection from "@/components/recommend/RecommendShopSection";
import RecommendShopModal from "@/components/recommend/RecommendShopModal";

import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import WaitlistForm from "@/components/WaitlistForm";
import { useLocation } from "@/contexts/LocationContext";


const valueProps = [
  { icon: ShieldCheck, title: "Transparent Pricing", desc: "See real prices upfront. No surprises, no hidden fees." },
  { icon: Zap, title: "Find Trusted Shops", desc: "Find trusted local shops and know exactly what questions to ask before you walk in." },
];

export default function Owners() {
  const [recommendOpen, setRecommendOpen] = useState(false);
  const userLocation = useLocation();

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="For Vehicle Owners — Wrenchli"
        description="Get instant quotes from trusted local shops. Compare prices, book with confidence, and finance if you need to."
        path="/owners"
      />



      <CinematicHero />
      <HowItWorksVideo />
      <QuickActionBar />
      

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
              <WaitlistForm source="owners-waitlist" />
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
