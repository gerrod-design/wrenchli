import { useState } from "react";

import SEO from "@/components/SEO";
import { Eye, MessageCircleQuestion, UserX, Check } from "lucide-react";

import SectionReveal from "@/components/SectionReveal";
import InlineChatWidget from "@/components/InlineChatWidget";
import CinematicHero from "@/components/CinematicHero";
import HowItWorksVideo from "@/components/HowItWorksVideo";
import VinRecallCheck from "@/components/VinRecallCheck";

import RecommendShopSection from "@/components/recommend/RecommendShopSection";
import RecommendShopModal from "@/components/recommend/RecommendShopModal";

import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import HomeSocialProof from "@/components/HomeSocialProof";
import WaitlistForm from "@/components/WaitlistForm";
import { useLocation } from "@/contexts/LocationContext";
import MILoanBanner from "@/components/MILoanBanner";
import { HomeJsonLd } from "@/components/JsonLd";
import HomeFAQ from "@/components/HomeFAQ";

const valueProps = [
  { icon: Eye, title: "Know Before You Go", desc: "Understand likely causes and fair cost ranges before you talk to a shop." },
  { icon: MessageCircleQuestion, title: "Ask Better Questions", desc: "Walk in with the exact questions that get honest answers." },
  { icon: UserX, title: "No Account Required", desc: "Get your full assessment free, instantly, with no sign-up." },
];


export default function Index() {
  const [recommendOpen, setRecommendOpen] = useState(false);
  const userLocation = useLocation();

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Free Vehicle Symptom Assessment | Wrenchli — Michigan & Ohio"
        description="Describe your car symptom in plain English — get a free instant assessment of likely causes and repair costs. Serving Michigan and Ohio drivers."
        path="/"
      />
      <HomeJsonLd />
      <MILoanBanner />

      {/* Cinematic Hero */}
      <CinematicHero />

      <HowItWorksVideo />

      {/* VIN Recall Check — secondary feature, below the fold */}
      <VinRecallCheck />

      {/* Pricing Clarity */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-4xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-10">
              What's free. What's Pro.
            </h2>
          </SectionReveal>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Free column */}
            <SectionReveal delay={0}>
              <div className="h-full rounded-xl border border-border bg-muted/30 p-6 md:p-8">
                <span className="inline-block text-sm font-bold text-accent mb-4">Assessment always free</span>
                <h3 className="font-heading text-xl font-bold mb-1">Free</h3>
                <p className="text-xs text-muted-foreground mb-6">No credit card required</p>
                <ul className="space-y-3">
                  {[
                    "Unlimited symptom assessments",
                    "Likely causes with probability scores",
                    "Fair cost ranges",
                    "Questions to ask your mechanic",
                    "2 saved vehicles in your garage",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>
            {/* Pro column */}
            <SectionReveal delay={120}>
              <div className="h-full rounded-xl border-2 border-accent/40 bg-muted/30 p-6 md:p-8">
                <span className="inline-block text-sm font-bold text-foreground mb-4">$2.99/month</span>
                <h3 className="font-heading text-xl font-bold mb-1">Pro</h3>
                <p className="text-xs text-muted-foreground mb-6">Cancel anytime</p>
                <ul className="space-y-3">
                  {[
                    "Unlimited saved vehicles",
                    "Safety recall alerts for every vehicle",
                    "Full assessment history",
                    "PDF report export",
                    "Cancel anytime",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

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

      <HomeSocialProof />

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
