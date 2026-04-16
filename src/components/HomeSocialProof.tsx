import { Database, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionReveal from "@/components/SectionReveal";

const foundingPartners = [
  { name: "Curt's Service", location: "Oak Park, MI" },
  { name: "McInerney Auto Center", location: "Troy, MI" },
];

export default function HomeSocialProof() {
  return (
    <section className="section-padding bg-background">
      <div className="container-wrenchli max-w-5xl">
        <SectionReveal>
          <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-3">
            Built with trusted Michigan shops
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Every claim on this page is verifiable. No inflated numbers. No fake reviews.
          </p>
        </SectionReveal>

        {/* Founding Partners */}
        <div className="grid gap-5 md:grid-cols-2 mb-10">
          {foundingPartners.map((shop, i) => (
            <SectionReveal key={shop.name} delay={i * 100}>
              <Card className="h-full border border-border hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <Badge
                    className="text-xs font-semibold px-3 py-1 border bg-accent/10 text-accent border-accent/30 hover:bg-accent/10"
                  >
                    Founding Partner
                  </Badge>
                  <h3 className="font-heading text-lg font-bold text-foreground">{shop.name}</h3>
                  <p className="text-sm text-muted-foreground">{shop.location}</p>
                </CardContent>
              </Card>
            </SectionReveal>
          ))}
        </div>

        {/* Verifiable stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionReveal delay={200}>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
              <Database className="h-6 w-6 shrink-0 text-wrenchli-trust-blue mt-0.5" />
              <div>
                <p className="font-heading text-base font-semibold text-foreground">684 repair shops</p>
                <p className="text-sm text-muted-foreground">In our Michigan &amp; Ohio reference database</p>
              </div>
            </div>
          </SectionReveal>
          <SectionReveal delay={300}>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
              <UserX className="h-6 w-6 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="font-heading text-base font-semibold text-foreground">Free for every driver</p>
                <p className="text-sm text-muted-foreground">No account required to get your assessment</p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
