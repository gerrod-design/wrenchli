import { Link } from "react-router-dom";
import { Wrench, Store, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";

const journeys = [
  {
    icon: Wrench,
    title: "Vehicle Owner",
    subtitle: "Need your car fixed?",
    description:
      "Get instant AI diagnostics, compare shop quotes, and access financing—all in one place.",
    features: [
      "Free AI diagnosis in 60 seconds",
      "Compare quotes from trusted shops",
      "Flexible financing options",
      "DIY guides & tutorials",
    ],
    primaryCta: { label: "Get Your Free Diagnosis", to: "/#quote" },
    secondaryCta: { label: "How It Works", to: "/for-car-owners" },
    gradient: "from-accent/8 via-transparent to-accent/4",
    iconBg: "bg-accent",
    checkClass: "bg-accent/15 text-accent",
    borderHover: "group-hover:border-accent/40",
    barClass: "bg-accent",
    btnClass: "bg-accent text-accent-foreground hover:bg-accent/90",
    glowClass: "bg-accent/10",
  },
  {
    icon: Store,
    title: "Repair Shop",
    subtitle: "Want more customers?",
    description:
      "Join our network of trusted shops. Get qualified leads, manage bookings, and grow your business.",
    features: [
      "Pre-qualified customer leads",
      "Free shop management tools",
      "No upfront fees",
      "Grow your reputation",
    ],
    primaryCta: { label: "Apply to Partner", to: "/for-shops#apply" },
    secondaryCta: { label: "Learn More", to: "/for-shops" },
    gradient: "from-primary/8 via-transparent to-primary/4",
    iconBg: "bg-primary",
    checkClass: "bg-primary/15 text-primary",
    borderHover: "group-hover:border-primary/40",
    barClass: "bg-primary",
    btnClass: "bg-primary text-primary-foreground hover:bg-primary/90",
    glowClass: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Investor",
    subtitle: "Interested in Wrenchli?",
    description:
      "We're building the future of vehicle repair. Learn about our vision, traction, and investment opportunity.",
    features: [
      "Market opportunity overview",
      "Business model & traction",
      "Team & technology",
      "Investment details",
    ],
    primaryCta: { label: "View Investment Info", to: "/investors" },
    secondaryCta: { label: "Contact Us", to: "/contact" },
    gradient: "from-emerald-600/8 via-transparent to-emerald-600/4",
    iconBg: "bg-emerald-600",
    checkClass: "bg-emerald-600/15 text-emerald-600",
    borderHover: "group-hover:border-emerald-600/40",
    barClass: "bg-emerald-600",
    btnClass: "bg-emerald-600 text-white hover:bg-emerald-600/90",
    glowClass: "bg-emerald-600/10",
  },
];

export default function UserJourneySelector() {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-wrenchli">
        <SectionReveal>
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Choose Your Path
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
              Whether you're fixing your car, growing your shop, or exploring
              investment opportunities—Wrenchli has you covered.
            </p>
          </div>
        </SectionReveal>

        <div className="grid gap-8 md:grid-cols-3">
          {journeys.map((j, i) => (
            <SectionReveal key={j.title} delay={i * 150}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`group relative flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-colors duration-200 ${j.borderHover}`}
              >
                {/* Subtle gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${j.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                {/* Large faded background icon */}
                <div className="absolute -right-6 -top-6 pointer-events-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
                  <j.icon className="h-36 w-36" strokeWidth={1} />
                </div>

                {/* Content */}
                <div className="relative flex flex-col flex-1 p-7">
                  {/* Icon + Title */}
                  <div className="flex items-center gap-3 mb-1">
                    <div className="relative">
                      <div
                        className={`absolute inset-0 rounded-lg ${j.glowClass} scale-150 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      />
                      <div
                        className={`relative flex h-11 w-11 items-center justify-center rounded-lg ${j.iconBg} text-white shadow-sm`}
                      >
                        <j.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold leading-tight">
                        {j.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {j.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {j.description}
                  </p>

                  {/* Features */}
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {j.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${j.checkClass}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTAs */}
                  <div className="mt-6 flex flex-col gap-2">
                    <Button
                      asChild
                      className={`${j.btnClass} transition-opacity shadow-sm`}
                    >
                      <Link to={j.primaryCta.to}>
                        {j.primaryCta.label}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={j.secondaryCta.to}>
                        {j.secondaryCta.label}
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Accent bar */}
                <div
                  className={`h-1 ${j.barClass} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
                />
              </motion.div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}