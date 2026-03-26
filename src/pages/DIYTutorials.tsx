import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Clock, DollarSign, ArrowRight } from "lucide-react";

const difficultyConfig: Record<string, { label: string; class: string }> = {
  beginner: { label: "Beginner", class: "bg-wrenchli-green/15 text-wrenchli-green border-wrenchli-green/30" },
  intermediate: { label: "Intermediate", class: "bg-accent/15 text-accent border-accent/30" },
  advanced: { label: "Advanced", class: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function DIYTutorials() {
  const { data: tutorials, isLoading } = useQuery({
    queryKey: ["diy-tutorials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diy_tutorials")
        .select("*")
        .eq("is_published", true)
        .order("difficulty", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const grouped = {
    beginner: tutorials?.filter((t) => t.difficulty === "beginner") ?? [],
    intermediate: tutorials?.filter((t) => t.difficulty === "intermediate") ?? [],
    advanced: tutorials?.filter((t) => t.difficulty === "advanced") ?? [],
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="DIY Repair Guides — Save Money Fixing Your Car | Wrenchli"
        description="Step-by-step video tutorials with parts lists and tools. Save 60-70% on common car repairs by doing it yourself."
        path="/diy"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Wrench className="h-8 w-8 text-wrenchli-teal" />
              <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
                DIY Repair Guides
              </h1>
            </div>
            <p className="mt-2 text-primary-foreground/70 md:text-lg max-w-2xl mx-auto">
              Step-by-step video tutorials with parts lists, tools, and Amazon links.
              Save 60–70% on common repairs.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Tutorial Grid */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : (
            Object.entries(grouped).map(([level, items]) =>
              items.length > 0 ? (
                <div key={level} className="mb-12 last:mb-0">
                  <SectionReveal>
                    <div className="flex items-center gap-3 mb-6">
                      <Badge className={`text-sm px-3 py-1 ${difficultyConfig[level].class}`}>
                        {difficultyConfig[level].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {items.length} tutorial{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </SectionReveal>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((tutorial, i) => (
                      <SectionReveal key={tutorial.id} delay={i * 80}>
                        <Link to={`/diy/${tutorial.slug}`} className="block h-full group">
                          <Card className="h-full border-2 border-border hover:border-wrenchli-teal/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                            <CardContent className="p-6 flex flex-col h-full">
                              <div className="flex items-start justify-between mb-3">
                                <h3 className="font-heading text-lg font-bold leading-tight group-hover:text-wrenchli-teal transition-colors">
                                  {tutorial.title}
                                </h3>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-wrenchli-teal transition-colors shrink-0 ml-2" />
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                                {tutorial.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-wrenchli-teal" />
                                  {tutorial.estimated_time_minutes} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-wrenchli-green" />
                                  Save ${((tutorial.estimated_savings_cents ?? 0) / 100).toFixed(0)}+
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </SectionReveal>
                    ))}
                  </div>
                </div>
              ) : null
            )
          )}
        </div>
      </section>

      {/* FTC Disclosure */}
      <section className="px-4 pb-16 md:px-8">
        <div className="container-wrenchli">
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-muted-foreground" role="note">
            <p>
              <strong className="text-foreground">Affiliate Disclosure:</strong>{" "}
              Wrenchli is a participant in the Amazon Services LLC Associates Program.
              We earn a small commission from qualifying purchases at no additional cost to you.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
