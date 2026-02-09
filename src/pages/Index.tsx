import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import {
  ShieldCheck, Zap, CreditCard,
  Car, ArrowRight,
  Smartphone, MessageCircle,
} from "lucide-react";

import SectionReveal from "@/components/SectionReveal";
import QuickActionBar from "@/components/QuickActionBar";
import CinematicHero from "@/components/CinematicHero";
import HowItWorksVideo from "@/components/HowItWorksVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [dtcCode, setDtcCode] = useState("");
  const [recommendOpen, setRecommendOpen] = useState(false);

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Wrenchli — Car Repair, Finally Fixed"
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


      {/* How It Works moved above QuickActionBar */}

      {/* For Car Owners */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-2xl mx-auto">
          <SectionReveal>
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10 flex flex-col">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-wrenchli-green/10 px-3 py-1 text-sm font-medium text-wrenchli-green w-fit">
                <Car className="h-4 w-4" /> For Car Owners
              </div>
              <h3 className="font-heading text-2xl font-bold md:text-3xl">
                Stop Overpaying. Start Trusting.
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed flex-1">
                Instant quotes from vetted shops, transparent pricing, and financing for all credit profiles. Never wonder if you're getting a fair deal again.
              </p>
              <Button asChild className="mt-6 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold w-fit px-8">
                <Link to="/#quote">
                  Get Your Free Quote <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* OBD2 Scanner Integration */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <SectionReveal>
                <div className="inline-flex items-center gap-2 rounded-full bg-wrenchli-teal/10 px-3 py-1 text-sm font-medium text-wrenchli-teal mb-4">
                  <Smartphone className="h-4 w-4" /> OBD2 Integration
                </div>
                <h2 className="font-heading text-2xl font-bold md:text-3xl">
                  Already Diagnosed Your Issue?
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Connect your OBD2 scanner results directly to local shop quotes. Enter your diagnostic trouble code and get competitive pricing instantly.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="Enter DTC code (e.g., P0420)"
                    value={dtcCode}
                    onChange={(e) => setDtcCode(e.target.value.toUpperCase())}
                    className="h-12 text-base font-mono uppercase"
                    maxLength={10}
                  />
                  <Button className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-6 whitespace-nowrap">
                    Get Quotes for This Code
                  </Button>
                </div>
              </SectionReveal>
              <SectionReveal delay={200}>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {["FIXD", "BlueDriver", "Innova"].map((brand) => (
                    <div key={brand} className="rounded-lg border border-border bg-muted px-6 py-3 text-sm font-medium text-muted-foreground opacity-50">
                      {brand}
                    </div>
                  ))}
                  <p className="w-full text-center text-xs text-muted-foreground mt-2">
                    Scanner partnerships coming soon
                  </p>
                </div>
              </SectionReveal>
            </div>
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
              Get your first quote in under 60 seconds. No account required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
                <Link to="/#quote">Get Your Free Quote</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold text-lg">
                <Link to="/for-shops#apply">Become a Partner Shop</Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Floating Chat Widget Placeholder */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
          title="Chat — Coming Soon"
          onClick={() => {}}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>

      <RecommendShopModal open={recommendOpen} onClose={() => setRecommendOpen(false)} />
    </main>
  );
}
