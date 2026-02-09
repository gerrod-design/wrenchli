import { MapPin, Target, Eye, Heart, Users, Calendar } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";

const values = [
  { icon: Eye, title: "Transparency", desc: "No hidden costs, no surprises. We believe in showing you exactly what you're paying for." },
  { icon: Heart, title: "Trust", desc: "Every shop is vetted. Every review is real. We're building a platform you can rely on." },
  { icon: Users, title: "Accessibility", desc: "Fair pricing and financing options so everyone can keep their car on the road." },
];

const milestones = [
  { date: "Dec 2024", event: "Wrenchli, Inc. incorporated in Delaware" },
  { date: "Q1 2025", event: "Consumer research — 500+ survey respondents, 78% strong interest" },
  { date: "Q2 2025", event: "Prototype built, 30+ warm shop relationships in Detroit" },
  { date: "2025", event: "Launching in Detroit — you're here for the beginning" },
];

const team = [
  { name: "Founder & CEO", title: "Leading vision, strategy & fundraising", initials: "FC" },
  { name: "Co-Founder & CTO", title: "Building the platform & technical architecture", initials: "CT" },
  { name: "Head of Partnerships", title: "Shop relationships & Detroit market", initials: "HP" },
];

export default function About() {
  return (
    <main className="pb-[60px] md:pb-0">
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl">About Wrenchli</h1>
            <p className="mt-4 max-w-2xl mx-auto text-primary-foreground/70 md:text-lg">
              We're fixing the broken auto repair experience — starting right here in Detroit.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <div className="flex items-center gap-2 text-accent mb-4">
              <MapPin className="h-5 w-5" />
              <span className="font-heading font-semibold text-sm uppercase tracking-wider">Detroit, Michigan</span>
            </div>
            <h2 className="font-heading text-2xl font-bold md:text-3xl">Our Mission</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Two out of three car owners don't trust their mechanic, and prices for the same repair can vary by 300% across shops. That's not a minor inconvenience — it's a systemic problem in a $288 billion industry.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Wrenchli exists to bring transparency, trust, and accessibility to auto repair. We connect car owners with vetted local shops through instant price comparison, honest reviews, and built-in financing for those who need it. For shops, we deliver pre-qualified customers and modern tools to run their business.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Our Values</h2>
          </SectionReveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {values.map((v, i) => (
              <SectionReveal key={v.title} delay={i * 150}>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <v.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">The Team</h2>
            <p className="mt-3 text-center text-muted-foreground">Building Wrenchli from the ground up.</p>
          </SectionReveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-3xl mx-auto">
            {team.map((t, i) => (
              <SectionReveal key={t.name} delay={i * 150}>
                <div className="text-center rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-heading font-bold text-lg">
                    {t.initials}
                  </div>
                  <h3 className="font-heading font-semibold">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t.title}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-2xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Our Journey</h2>
          </SectionReveal>
          <div className="mt-10 space-y-6">
            {milestones.map((m, i) => (
              <SectionReveal key={i} delay={i * 100}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <div className="font-heading text-sm font-semibold text-accent">{m.date}</div>
                    <p className="text-sm text-muted-foreground">{m.event}</p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
