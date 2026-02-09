import { Search, AlertTriangle, Calendar, CarFront } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";

const modes = [
  {
    icon: Search,
    title: "DTC Code Lookup",
    desc: "Enter a diagnostic trouble code (like P0300) and get a plain-English explanation — what it means, how serious it is, and what repairs typically cost.",
    badge: "Coming Soon",
  },
  {
    icon: AlertTriangle,
    title: "Symptom Checker",
    desc: "Describe what your car is doing — strange noises, warning lights, pulling to one side — and we'll help narrow down the likely causes.",
    badge: "Coming Soon",
  },
  {
    icon: Calendar,
    title: "Maintenance Schedules",
    desc: "Enter your year, make, and model to see manufacturer-recommended maintenance intervals and estimated costs.",
    badge: "Coming Soon",
  },
];

export default function VehicleInsights() {
  return (
    <main className="pb-[60px] md:pb-0">
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-wrenchli-teal/20 px-4 py-1 text-sm font-medium text-wrenchli-teal">
              <CarFront className="h-4 w-4" /> Vehicle Insights
            </div>
            <h1 className="mt-4 font-heading text-3xl font-extrabold md:text-5xl">
              Understand your car, before you visit the shop.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-primary-foreground/70 md:text-lg">
              AI-powered diagnostics, maintenance schedules, and repair guides — designed for regular car owners, not mechanics.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <div className="grid gap-8 md:grid-cols-3">
            {modes.map((m, i) => (
              <SectionReveal key={m.title} delay={i * 150}>
                <div className="flex flex-col rounded-xl border border-border bg-card p-8 shadow-sm">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-wrenchli-teal/10">
                    <m.icon className="h-7 w-7 text-wrenchli-teal" />
                  </div>
                  <span className="mb-3 w-fit rounded-full bg-wrenchli-teal/10 px-3 py-0.5 text-xs font-semibold text-wrenchli-teal">
                    {m.badge}
                  </span>
                  <h3 className="font-heading text-lg font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">Get early access to Vehicle Insights</h2>
            <p className="mt-3 text-primary-foreground/70">Be the first to try our diagnostic tools when they launch.</p>
            <div className="mx-auto mt-8 max-w-xl">
              <WaitlistForm source="vehicle-insights" />
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
