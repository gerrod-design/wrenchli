import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  TrendingUp,
  Wrench,
  DollarSign,
  Shield,
  Clock,
  X,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { InsightsEngine, type ProactiveInsight } from "@/services/InsightsEngine";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  current_mileage?: number;
  driving_style?: string;
  usage_type?: string;
}

const ICON_MAP: Record<ProactiveInsight["type"], typeof Wrench> = {
  maintenance: Wrench,
  market_timing: TrendingUp,
  problem_prevention: Shield,
  financial_planning: DollarSign,
  recall: AlertTriangle,
};

const PRIORITY_STYLES: Record<ProactiveInsight["priority"], string> = {
  urgent: "border-destructive/40 bg-destructive/5",
  high: "border-wrenchli-amber/40 bg-wrenchli-amber/5",
  medium: "border-accent/30 bg-accent/5",
  low: "border-border bg-card",
};

const PRIORITY_BADGE: Record<ProactiveInsight["priority"], "destructive" | "default" | "secondary"> = {
  urgent: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
};

function InsightCard({
  insight,
  onDismiss,
}: {
  insight: ProactiveInsight;
  onDismiss: (id: string) => void;
}) {
  const Icon = ICON_MAP[insight.type];

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3", PRIORITY_STYLES[insight.priority])}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h4 className="text-sm font-semibold truncate">{insight.title}</h4>
          <Badge variant={PRIORITY_BADGE[insight.priority]} className="text-[10px] shrink-0">
            {insight.priority}
          </Badge>
          {insight.urgency_timeframe && (
            <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              {insight.urgency_timeframe}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDismiss(insight.id)}
          className="h-6 w-6 p-0 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>

      {/* Financial impact */}
      {(insight.cost_to_ignore || insight.potential_savings) && (
        <div className="flex items-center gap-4 text-[11px] p-2 rounded-lg bg-muted/30">
          {insight.cost_to_ignore && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span>
                Cost if ignored: <strong>${insight.cost_to_ignore.toLocaleString()}</strong>
              </span>
            </div>
          )}
          {insight.potential_savings && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-wrenchli-teal" />
              <span>
                Savings: <strong>${insight.potential_savings.toLocaleString()}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Market data */}
      {insight.market_data && (
        <div className="text-[11px] text-muted-foreground p-2 rounded-lg bg-muted/20 flex items-center gap-4">
          {insight.market_data.similar_vehicles_affected && (
            <span>{insight.market_data.similar_vehicles_affected} similar vehicles affected</span>
          )}
          {insight.market_data.success_rate_if_preventive && (
            <span>{insight.market_data.success_rate_if_preventive}% success with preventive action</span>
          )}
        </div>
      )}

      {/* Action items */}
      {insight.action_items.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">Recommended Actions:</p>
          <div className="flex flex-wrap gap-1.5">
            {insight.action_items.map((action, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-muted/50 text-muted-foreground"
              >
                <CheckCircle className="h-2.5 w-2.5" />
                {action}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/50">
        Generated {new Date(insight.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}

export default function ProactiveInsights({ vehicle }: { vehicle: Vehicle }) {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [vehicle.id]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const existing = await InsightsEngine.getInsightsForVehicle(vehicle.id);
      if (existing.length === 0) {
        await generateFreshInsights();
      } else {
        setInsights(existing);
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateFreshInsights = async () => {
    setGenerating(true);
    try {
      const newInsights = await InsightsEngine.generateInsights(vehicle);
      await InsightsEngine.saveInsights(newInsights);
      setInsights(newInsights);
      toast.success("Fresh insights generated!");
    } catch (error) {
      console.error("Error generating insights:", error);
      // Still show generated insights locally even if save fails
      const localInsights = await InsightsEngine.generateInsights(vehicle);
      setInsights(localInsights);
    } finally {
      setGenerating(false);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      await supabase
        .from("proactive_insights" as any)
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq("id", insightId);

      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      toast.success("Insight dismissed");
    } catch (error) {
      console.error("Error dismissing insight:", error);
    }
  };

  const highPriority = insights.filter((i) => i.priority === "urgent" || i.priority === "high");
  const otherInsights = insights.filter((i) => i.priority !== "urgent" && i.priority !== "high");

  const grouped = insights.reduce(
    (acc, i) => {
      if (!acc[i.type]) acc[i.type] = [];
      acc[i.type].push(i);
      return acc;
    },
    {} as Record<string, ProactiveInsight[]>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-10">
        <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-semibold text-sm mb-1">No Active Insights</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Generate personalized insights for your {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <Button
          onClick={generateFreshInsights}
          disabled={generating}
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {generating ? (
            <>
              <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Generate Insights
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold">Proactive Insights</h3>
          <p className="text-[11px] text-muted-foreground">
            {insights.length} recommendation{insights.length !== 1 ? "s" : ""} for your{" "}
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={generateFreshInsights}
          disabled={generating}
        >
          {generating ? <Clock className="h-3 w-3 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {/* High priority */}
      {highPriority.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            High Priority Actions
          </h4>
          {highPriority.map((insight) => (
            <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
          ))}
        </div>
      )}

      {/* Tabbed insights */}
      {otherInsights.length > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full h-auto flex-wrap justify-start">
            <TabsTrigger value="all" className="text-xs">
              All ({otherInsights.length})
            </TabsTrigger>
            {grouped.maintenance && (
              <TabsTrigger value="maintenance" className="text-xs">
                Maintenance ({grouped.maintenance.length})
              </TabsTrigger>
            )}
            {grouped.market_timing && (
              <TabsTrigger value="market_timing" className="text-xs">
                Market ({grouped.market_timing.length})
              </TabsTrigger>
            )}
            {grouped.problem_prevention && (
              <TabsTrigger value="problem_prevention" className="text-xs">
                Prevention ({grouped.problem_prevention.length})
              </TabsTrigger>
            )}
            {grouped.financial_planning && (
              <TabsTrigger value="financial_planning" className="text-xs">
                Financial ({grouped.financial_planning.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {otherInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
            ))}
          </TabsContent>

          {Object.entries(grouped).map(([type, typeInsights]) => (
            <TabsContent key={type} value={type} className="space-y-3 mt-4">
              {typeInsights
                .filter((i) => i.priority !== "urgent" && i.priority !== "high")
                .map((insight) => (
                  <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
                ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
