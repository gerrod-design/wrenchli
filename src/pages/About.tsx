import { useState } from "react";
import { MapPin, Target, Eye, Rocket, Users, Building, Award, Briefcase, Play } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import SEO from "@/components/SEO";
import heroAbout from "@/assets/hero-about.jpg";
import BrandVideoModal from "@/components/BrandVideoModal";

export default function About() {
  const [showBrandVideo, setShowBrandVideo] = useState(false);

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="About Wrenchli"
        description="Meet the team fixing the broken auto repair experience. Based in Detroit, Wrenchli brings transparency, trust, and accessibility to a $288B industry."
        path="/about"
      />
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground section-padding overflow-hidden">
        <img src={heroAbout} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60" />
        <div className="container-wrenchli text-center relative">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl lg:text-6xl">About Wrenchli</h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              We're fixing the broken auto repair experience — starting right here in Detroit.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">Our Story</h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Wrenchli was born from a simple observation: <strong className="text-foreground">car repair is broken for everyone.</strong>
              </p>
              <p>
                Car owners overpay because they can't compare prices. They accept unnecessary work because they don't know what's really wrong. And they settle for shops they don't trust because they have no better option.
              </p>
              <p>
                On the other side, independent repair shops — the backbone of the industry — lose customers to dealerships and chains with bigger marketing budgets, even when they do better work at lower prices. They run their businesses on paper tickets and phone calls in an age of instant everything.
              </p>
              <p>
                We're building the platform that fixes both sides. Transparent pricing and vetted shops for consumers. Pre-qualified customers and modern tools for shops. And embedded financing so cost never stands between a car owner and the repair they need.
              </p>
              <p className="text-foreground font-medium">
                Based in Detroit — the heart of America's automotive industry — Wrenchli is where technology meets the trades.
              </p>
              <button
                onClick={() => setShowBrandVideo(true)}
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 hover:underline transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Watch Our 30-Second Story
              </button>
            </div>
          </SectionReveal>
        </div>
      </section>

      <BrandVideoModal isOpen={showBrandVideo} onClose={() => setShowBrandVideo(false)} />

      {/* Mission & Vision */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli">
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-8 h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-heading text-xl font-bold">Our Mission</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  To bring transparency, choice, and accessibility to auto repair — empowering car owners to make informed decisions and independent shops to thrive in a modern marketplace.
                </p>
              </div>
            </SectionReveal>
            <SectionReveal delay={150}>
              <div className="rounded-2xl border border-border bg-card p-8 h-full">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-wrenchli-trust-blue/10">
                  <Eye className="h-6 w-6 text-wrenchli-trust-blue" />
                </div>
                <h3 className="font-heading text-xl font-bold">Our Vision</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  A world where getting your car fixed is as simple, transparent, and stress-free as any other service. Where every car owner has access to fair pricing, honest shops, and flexible payment options.
                </p>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-4xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Leadership</h2>
            <p className="mt-3 text-center text-muted-foreground md:text-lg">Decades of automotive, finance, and technology experience.</p>
          </SectionReveal>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-center font-heading text-xl font-bold">Gerrod Parchmon</h3>
                <p className="text-center text-sm font-semibold text-accent mt-1">Founder & CEO</p>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    30+ years spanning the full automotive value chain — from the factory floor to the C-suite.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Building className="h-4 w-4 shrink-0 mt-0.5 text-wrenchli-trust-blue" />
                      <span><strong className="text-foreground">10 years at Chrysler Manufacturing</strong> — deep understanding of how vehicles are built</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 shrink-0 mt-0.5 text-wrenchli-trust-blue" />
                      <span><strong className="text-foreground">Auto Finance Leadership</strong> — managed $45B+ portfolios at Chrysler Financial, Bank of America, and Huntington</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Award className="h-4 w-4 shrink-0 mt-0.5 text-wrenchli-trust-blue" />
                      <span><strong className="text-foreground">MD at JPMorgan Chase</strong> — led 300+ person organization in financial services</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    MS in Management, Strategy & Leadership — Michigan State University
                  </p>
                </div>
              </div>
            </SectionReveal>

            <SectionReveal delay={150}>
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-center font-heading text-xl font-bold">Jenine Parchmon</h3>
                <p className="text-center text-sm font-semibold text-accent mt-1">CTO</p>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    20+ years leading enterprise technology, digital transformation, and payment systems across automotive and banking.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Building className="h-4 w-4 shrink-0 mt-0.5 text-wrenchli-trust-blue" />
                      <span><strong className="text-foreground">15 years at Comerica Bank</strong> — SVP and Domain CIO driving enterprise technology strategy</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 shrink-0 mt-0.5 text-wrenchli-trust-blue" />
                      <span><strong className="text-foreground">6 years at Volkswagen Group / gedas USA</strong> — automotive technology and systems integration</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Award className="h-4 w-4 shrink-0 mt-0.5 text-wrenchli-trust-blue" />
                      <span><strong className="text-foreground">Expertise:</strong> Enterprise tech, digital transformation, payment systems, and IT governance</span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Why Detroit */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1 text-sm font-medium text-accent mb-6">
              <MapPin className="h-4 w-4" /> Detroit, Michigan
            </div>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">Why Detroit?</h2>
            <p className="mt-5 text-lg text-primary-foreground/70 leading-relaxed">
              Detroit isn't just where cars are made — it's where car culture <em>lives.</em>
            </p>
            <p className="mt-4 text-primary-foreground/60 leading-relaxed">
              This city built the modern automobile. It knows what it means to reinvent an industry. With one of the highest concentrations of independent repair shops in the country and a community that takes pride in keeping vehicles on the road, Detroit is the perfect proving ground for a platform that's rewriting the rules of auto repair.
            </p>
            <p className="mt-4 text-primary-foreground/60 leading-relaxed">
              We're launching here first because this is home — and because if Wrenchli can work in Detroit, it can work anywhere.
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
