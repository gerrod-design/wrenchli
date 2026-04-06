import { MapPin, Target, Eye, Users, Building, Award, Briefcase, Wrench, DollarSign, Hammer } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import SEO from "@/components/SEO";
import heroAbout from "@/assets/hero-about.jpg";

import MechanicAvatar from "@/components/MechanicAvatar";

export default function About() {

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="About Wrenchli"
        description="Meet the team fixing the broken auto repair experience. Based in Michigan, Wrenchli brings transparency, trust, and accessibility to a $288B industry."
        path="/about"
      />
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground section-padding overflow-hidden">
        <img src={heroAbout} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60" />
        <div className="container-wrenchli text-center relative">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl lg:text-6xl">About Wrenchli</h1>
            <p className="mt-3 text-base font-semibold tracking-wide text-primary-foreground/90 md:text-lg">Mobility for All.</p>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              We're fixing the broken auto repair experience — starting in Michigan and Ohio.
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
                Wrenchli was born from a simple observation: <strong className="text-foreground">vehicle repair is broken for everyone.</strong>
              </p>
              <p>
                Vehicle owners overpay because they can't compare prices. They accept unnecessary work because they don't know what's really wrong. And they settle for shops they don't trust because they have no better option.
              </p>
              <p>
                On the other side, independent repair shops — the backbone of the industry — compete for customers in a market where brand recognition and marketing budgets matter as much as quality of work. The best shops in America are running lean, skilled operations. They just don't have the consumer acquisition tools that the big players do.
              </p>
              <p>
                We built the platform that fixes both sides. Transparent pricing and trusted shops for consumers. Pre-qualified customers and zero intake friction for shops. And repair financing on the way — so cost never stands between a vehicle owner and the repair they need.
              </p>
              <p className="text-foreground font-medium">
                Based in Michigan — the heart of America's automotive industry — Wrenchli is where technology meets the trades.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      

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
                  To bring transparency, choice, and accessibility to auto repair — empowering vehicle owners to make informed decisions and independent shops to thrive in a modern marketplace.
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
                  A world where getting your vehicle fixed is as simple, transparent, and stress-free as any other service. Where every vehicle owner has access to fair pricing, honest shops, and flexible payment options.
                </p>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Meet Your AI Advisors */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-4xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Meet Your AI Advisors</h2>
            <p className="mt-3 text-center text-muted-foreground md:text-lg max-w-2xl mx-auto">
              When you chat with Wrenchli, you're guided by a team of specialized AI advisors — each with a distinct expertise to get you the best outcome.
            </p>
          </SectionReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                agent: "mike" as const,
                name: "Mike",
                role: "Lead Advisor",
                color: "bg-primary/10 border-primary/20",
                iconColor: "text-primary",
                icon: Wrench,
                specialties: ["Symptom triage & DTC codes", "Guides you to the right specialist", "Photo & video damage analysis"],
                description: "Your first point of contact. Mike listens to your car issue, asks the right questions, and connects you with the best specialist for your situation.",
              },
              {
                agent: "sam" as const,
                name: "Sam",
                role: "Cost & Value Specialist",
                color: "bg-amber-500/10 border-amber-500/20",
                iconColor: "text-amber-500",
                icon: DollarSign,
                specialties: ["Repair cost estimates", "Vehicle valuations", "Shop recommendations & financing"],
                description: "Sam handles the money side — professional repair costs, your car's market value, local shop options, and payment plans to keep repairs affordable.",
              },
              {
                agent: "jess" as const,
                name: "Jess",
                role: "Parts & DIY Expert",
                color: "bg-emerald-500/10 border-emerald-500/20",
                iconColor: "text-emerald-500",
                icon: Hammer,
                specialties: ["Step-by-step repair walkthroughs", "Parts & tools lists", "YouTube tutorial recommendations"],
                description: "Jess is your hands-on guru. She'll walk you through DIY repairs, tell you exactly what tools and parts you need, and find the best video guides.",
              },
            ].map((advisor, idx) => (
              <SectionReveal key={advisor.agent} delay={idx * 100}>
                <div className={`rounded-2xl border ${advisor.color} bg-card p-6 shadow-sm h-full flex flex-col items-center text-center`}>
                  <MechanicAvatar size={80} agent={advisor.agent} showLogo={false} />
                  <h3 className="mt-4 font-heading text-lg font-bold">{advisor.name}</h3>
                  <div className={`mt-1 inline-flex items-center gap-1.5 text-xs font-semibold ${advisor.iconColor}`}>
                    <advisor.icon className="h-3.5 w-3.5" />
                    {advisor.role}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{advisor.description}</p>
                  <ul className="mt-4 space-y-1.5 text-left w-full">
                    {advisor.specialties.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className={`mt-1 h-1.5 w-1.5 rounded-full ${advisor.iconColor.replace("text-", "bg-")} shrink-0`} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-4xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Leadership</h2>
            <p className="mt-3 text-center text-muted-foreground md:text-lg">30+ years spanning automotive, finance, and technology.</p>
          </SectionReveal>

          <div className="mt-12 max-w-lg mx-auto">
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
                      <span><strong className="text-foreground">10 years in automotive manufacturing</strong> — deep understanding of how vehicles are built</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 shrink-0 mt-0.5 text-wrenchli-trust-blue" />
                      <span><strong className="text-foreground">Auto Finance Leadership</strong> — managed $45B+ portfolios across automotive and consumer lending institutions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Award className="h-4 w-4 shrink-0 mt-0.5 text-wrenchli-trust-blue" />
                      <span><strong className="text-foreground">Managing Director</strong> — led 300+ person organization at a global financial institution</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    MS in Management, Strategy & Leadership — Michigan State University
                  </p>
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
              Detroit isn't just where cars are made — it's where automotive culture <em>lives.</em>
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
