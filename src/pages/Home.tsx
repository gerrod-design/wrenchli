import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Car, Wrench, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SectionReveal from "@/components/SectionReveal";
import StatCounter from "@/components/StatCounter";

const userPaths = [
  {
    icon: Car,
    title: "Vehicle Owners",
    subtitle: "Need your car fixed?",
    description:
      "Get free AI diagnosis, shop quotes, and affordable financing — all in one place.",
    href: "/owners",
    tokenBg: "bg-wrenchli-teal/10",
    tokenBorder: "border-wrenchli-teal/20 hover:border-wrenchli-teal/40",
    tokenIcon: "text-wrenchli-teal",
    tokenBtn: "bg-wrenchli-teal hover:bg-wrenchli-teal/90 text-accent-foreground",
  },
  {
    icon: Wrench,
    title: "Repair Shops",
    subtitle: "Want more customers?",
    description:
      "Join our network of trusted shops. Pre-qualified leads, no upfront fees.",
    href: "/shops",
    tokenBg: "bg-wrenchli-trust-blue/10",
    tokenBorder: "border-wrenchli-trust-blue/20 hover:border-wrenchli-trust-blue/40",
    tokenIcon: "text-wrenchli-trust-blue",
    tokenBtn: "bg-wrenchli-trust-blue hover:bg-wrenchli-trust-blue/90 text-accent-foreground",
  },
  {
    icon: TrendingUp,
    title: "Investors",
    subtitle: "Looking for opportunities?",
    description:
      "Learn about our mission, traction, and how to get involved.",
    href: "/investors",
    tokenBg: "bg-wrenchli-green/10",
    tokenBorder: "border-wrenchli-green/20 hover:border-wrenchli-green/40",
    tokenIcon: "text-wrenchli-green",
    tokenBtn: "bg-wrenchli-green hover:bg-wrenchli-green/90 text-accent-foreground",
  },
];

export default function Home() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Wrenchli — Vehicle Repair, Finally Fixed"
        description="Wrenchli connects vehicle owners with trusted repair shops, transparent pricing, and repair financing on the way. Free symptom assessment, no account required."
        path="/home"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h1 className="font-heading text-4xl font-extrabold md:text-6xl lg:text-7xl leading-tight">
              Wrenchli — Vehicle Repair,
              <br />
              <span className="text-accent">Finally Fixed</span>
            </h1>
            <p className="mt-4 font-heading text-xl font-semibold text-primary-foreground/80 md:text-2xl">
              Mobility for All.
            </p>
            <p className="mt-2 text-primary-foreground/60 md:text-lg">
              Now available in Michigan &amp; Ohio.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Choose Your Path */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl font-bold md:text-4xl">
                Choose Your Path
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Whether you're fixing your car, growing your shop, or exploring
                investment opportunities — Wrenchli has you covered.
              </p>
            </div>
          </SectionReveal>

          <div className="grid gap-8 md:grid-cols-3">
            {userPaths.map((path, i) => (
              <SectionReveal key={path.title} delay={i * 120}>
                <Link to={path.href} className="block h-full">
                  <Card
                    className={`h-full border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${path.tokenBorder}`}
                  >
                    <CardContent className="flex flex-col items-center text-center p-8">
                      {/* Icon */}
                      <div
                        className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${path.tokenBg}`}
                      >
                        <path.icon className={`h-8 w-8 ${path.tokenIcon}`} />
                      </div>

                      {/* Content */}
                      <h3 className="font-heading text-xl font-bold">
                        {path.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {path.subtitle}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {path.description}
                      </p>

                      {/* CTA */}
                      <Button
                        className={`mt-6 ${path.tokenBtn}`}
                        size="lg"
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container-wrenchli">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <StatCounter end={5247} label="Repairs Completed" />
            <StatCounter end={1.2} prefix="$" suffix="M" label="Saved by Customers" />
            <StatCounter end={4.8} suffix="★" label="Average Rating" />
          </div>
        </div>
      </section>
    </main>
  );
}
