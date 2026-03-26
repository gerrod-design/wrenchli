import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Clock,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Wrench,
  Package,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Json } from "@/integrations/supabase/types";

interface PartItem {
  name: string;
  description: string;
  amazon_asin: string;
  amazon_url: string;
  price_cents: number;
  quantity: number;
  required: boolean;
}

interface ToolItem {
  name: string;
  description: string;
  amazon_asin: string;
  amazon_url: string;
  price_cents: number;
  quantity: number;
  required: boolean;
  reusable: boolean;
}

interface InstructionStep {
  step: number;
  title: string;
  description: string;
}

const difficultyConfig: Record<string, { label: string; class: string; icon: string }> = {
  beginner: { label: "Beginner", class: "bg-wrenchli-green/15 text-wrenchli-green border-wrenchli-green/30", icon: "🟢" },
  intermediate: { label: "Intermediate", class: "bg-accent/15 text-accent border-accent/30", icon: "🟡" },
  advanced: { label: "Advanced", class: "bg-destructive/15 text-destructive border-destructive/30", icon: "🔴" },
};

function parseJsonArray<T>(json: Json | null): T[] {
  if (!json) return [];
  if (Array.isArray(json)) return json as unknown as T[];
  return [];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getYouTubeEmbedUrl(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function AmazonButton({ url, label, size = "sm" }: { url: string; label: string; size?: "sm" | "default" }) {
  const handleClick = () => {
    import("@/lib/analytics").then(({ trackEvent }) => {
      trackEvent({ action: "amazon_click", category: "diy_product", label, event_type: "ad_click" });
    });
  };
  return (
    <Button
      size={size}
      className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        <ShoppingCart className="h-4 w-4 mr-1" aria-hidden="true" />
        {label}
      </a>
    </Button>
  );
}

export default function DIYTutorialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Load progress from localStorage
  useEffect(() => {
    if (!slug) return;
    const saved = localStorage.getItem(`diy-progress-${slug}`);
    if (saved) setCompletedSteps(JSON.parse(saved));
  }, [slug]);

  const toggleStep = (step: number) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step];
      localStorage.setItem(`diy-progress-${slug}`, JSON.stringify(next));
      return next;
    });
  };

  const { data: tutorial, isLoading, error } = useQuery({
    queryKey: ["diy-tutorial", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diy_tutorials")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <main className="pb-[60px] md:pb-0 section-padding">
        <div className="container-wrenchli max-w-4xl">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[400px] rounded-xl mb-8" />
          <Skeleton className="h-48 mb-4" />
          <Skeleton className="h-48" />
        </div>
      </main>
    );
  }

  if (!tutorial || error) {
    return (
      <main className="pb-[60px] md:pb-0 section-padding">
        <div className="container-wrenchli text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Tutorial Not Found</h1>
          <Button asChild>
            <Link to="/diy">Browse All Guides</Link>
          </Button>
        </div>
      </main>
    );
  }

  const parts = parseJsonArray<PartItem>(tutorial.parts_needed);
  const tools = parseJsonArray<ToolItem>(tutorial.tools_needed);
  const instructions = parseJsonArray<InstructionStep>(tutorial.instructions);
  const warnings = (tutorial.safety_warnings as string[]) ?? [];
  const diff = difficultyConfig[tutorial.difficulty] ?? difficultyConfig.beginner;
  const embedUrl = tutorial.video_url ? getYouTubeEmbedUrl(tutorial.video_url) : null;

  const totalPartsCents = parts.reduce((sum, p) => sum + p.price_cents * p.quantity, 0);
  const totalToolsCents = tools.reduce((sum, t) => sum + t.price_cents * t.quantity, 0);

  // Build "Buy All" cart URL (Amazon doesn't have a true multi-ASIN cart link for affiliates,
  // so we link to a search as a practical alternative)
  const buyAllUrl = `https://www.amazon.com/s?k=${encodeURIComponent(tutorial.title + " parts")}&tag=wrenchli-20`;

  // HowTo schema
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tutorial.title,
    description: tutorial.description,
    totalTime: `PT${tutorial.estimated_time_minutes}M`,
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: (totalPartsCents / 100).toFixed(2),
    },
    step: instructions.map((s) => ({
      "@type": "HowToStep",
      position: s.step,
      name: s.title,
      text: s.description,
    })),
  };

  return (
    <main className="pb-[80px] md:pb-0">
      <SEO
        title={`${tutorial.title} — DIY Guide | Wrenchli`}
        description={tutorial.description}
        path={`/diy/${tutorial.slug}`}
      />
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* Back link & header */}
      <section className="bg-primary text-primary-foreground py-8 px-4 md:px-8">
        <div className="container-wrenchli max-w-4xl">
          <Link
            to="/diy"
            className="inline-flex items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> All DIY Guides
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold mb-3">
            {tutorial.title}
          </h1>
          <p className="text-primary-foreground/70 md:text-lg mb-4">
            {tutorial.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge className={diff.class}>
              {diff.icon} {diff.label}
            </Badge>
            <span className="flex items-center gap-1 text-primary-foreground/60">
              <Clock className="h-4 w-4" /> {tutorial.estimated_time_minutes} min
            </span>
            <span className="flex items-center gap-1 text-primary-foreground/60">
              <DollarSign className="h-4 w-4" /> Save $
              {((tutorial.estimated_savings_cents ?? 0) / 100).toFixed(0)}+
            </span>
          </div>
        </div>
      </section>

      <div className="container-wrenchli max-w-4xl px-4 md:px-8 py-8 space-y-8">
        {/* Video */}
        {embedUrl && (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
            <iframe
              src={embedUrl}
              title={tutorial.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        )}

        {/* Safety Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Safety Warnings
            </h2>
            <ul className="space-y-2">
              {warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-destructive mt-0.5">⚠️</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Parts Needed */}
        {parts.length > 0 && (
          <Accordion type="single" collapsible defaultValue="parts">
            <AccordionItem value="parts" className="border rounded-xl px-5">
              <AccordionTrigger className="font-heading text-lg font-bold py-4">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-wrenchli-teal" />
                  Parts Needed ({parts.length})
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ~{formatPrice(totalPartsCents)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {parts.map((part) => (
                    <Card key={part.amazon_asin} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm">{part.name}</h4>
                          {part.required && (
                            <Badge variant="outline" className="text-xs shrink-0">Required</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{part.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{formatPrice(part.price_cents)}</span>
                          <AmazonButton url={part.amazon_url} label="Buy on Amazon" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <AmazonButton url={buyAllUrl} label="Buy All Parts on Amazon" size="default" />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Tools Needed */}
        {tools.length > 0 && (
          <Accordion type="single" collapsible defaultValue="tools">
            <AccordionItem value="tools" className="border rounded-xl px-5">
              <AccordionTrigger className="font-heading text-lg font-bold py-4">
                <span className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-wrenchli-teal" />
                  Tools Needed ({tools.length})
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ~{formatPrice(totalToolsCents)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {tools.map((tool) => (
                    <Card key={tool.amazon_asin} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm">{tool.name}</h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {tool.reusable && (
                              <Badge variant="secondary" className="text-xs">♻️ Reusable</Badge>
                            )}
                            {tool.required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{formatPrice(tool.price_cents)}</span>
                          <AmazonButton url={tool.amazon_url} label="Buy on Amazon" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Step-by-Step Instructions */}
        {instructions.length > 0 && (
          <div>
            <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
              📋 Step-by-Step Instructions
            </h2>
            <div className="space-y-3">
              {instructions.map((step) => {
                const done = completedSteps.includes(step.step);
                return (
                  <button
                    key={step.step}
                    onClick={() => toggleStep(step.step)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                      done
                        ? "border-wrenchli-green/40 bg-wrenchli-green/5"
                        : "border-border hover:border-wrenchli-teal/30"
                    }`}
                    aria-label={`Step ${step.step}: ${step.title}. ${done ? "Completed" : "Not completed"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                          done
                            ? "bg-wrenchli-green text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" /> : step.step}
                      </div>
                      <div>
                        <h3 className={`font-medium text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {completedSteps.length === instructions.length && instructions.length > 0 && (
              <div className="mt-4 rounded-xl border-2 border-wrenchli-green/40 bg-wrenchli-green/10 p-4 text-center">
                <p className="font-heading font-bold text-wrenchli-green">
                  🎉 All steps completed! Great job!
                </p>
              </div>
            )}
          </div>
        )}

        {/* FTC Disclosure */}
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-muted-foreground" role="note">
          <p>
            <strong className="text-foreground">Affiliate Disclosure:</strong>{" "}
            Wrenchli is a participant in the Amazon Services LLC Associates Program.
            We earn a small commission from qualifying purchases at no additional cost to you.
          </p>
        </div>
      </div>

      {/* Sticky Buy All bar (mobile) */}
      {parts.length > 0 && (
        <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border p-3 md:hidden">
          <a
            href={buyAllUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 text-base hover:bg-accent/90 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            Buy All Parts — ~{formatPrice(totalPartsCents)}
          </a>
        </div>
      )}
    </main>
  );
}
