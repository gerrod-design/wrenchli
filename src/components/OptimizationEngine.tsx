import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  BarChart3,
  Lightbulb,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface OptimizationInsight {
  type: "revenue" | "traffic" | "conversion" | "geographic" | "product" | "timing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  potentialRevenue: number;
  actionItems: string[];
  confidence: number;
  implementation: "easy" | "moderate" | "complex";
}

interface PerformanceMetrics {
  clickThroughRate: number;
  conversionRate: number;
  revenuePerClick: number;
  averageOrderValue: number;
  topPerformingCategories: string[];
  underPerformingCategories: string[];
  peakTrafficHours: number[];
  highValueGeographies: string[];
}

const OptimizationEngine = () => {
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzePerformance();
  }, []);

  const analyzePerformance = async () => {
    setLoading(true);
    try {
      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      const analysisResults = performAnalysis(events || []);
      setMetrics(analysisResults.metrics);
      setInsights(analysisResults.insights);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const performAnalysis = (
    events: any[]
  ): { metrics: PerformanceMetrics; insights: OptimizationInsight[] } => {
    const clicks = events.filter((e) => e.event_type === "ad_click");
    const impressions = events.filter((e) => e.event_type === "ad_impression");
    const conversions = events.filter((e) => e.event_type === "ad_conversion");

    const clickThroughRate =
      impressions.length > 0 ? (clicks.length / impressions.length) * 100 : 0;
    const conversionRate =
      clicks.length > 0 ? (conversions.length / clicks.length) * 100 : 0;
    const totalRevenue = conversions.reduce((sum: number, e: any) => sum + (e.value || 0), 0);
    const revenuePerClick = clicks.length > 0 ? totalRevenue / clicks.length : 0;
    const averageOrderValue =
      conversions.length > 0 ? totalRevenue / conversions.length : 0;

    // Category performance
    const categoryStats = clicks.reduce((acc: Record<string, any>, click: any) => {
      const category = click.item_category || "unknown";
      if (!acc[category]) acc[category] = { clicks: 0, conversions: 0, revenue: 0 };
      acc[category].clicks += 1;
      const relatedConversion = conversions.find(
        (c: any) => c.session_id === click.session_id
      );
      if (relatedConversion) {
        acc[category].conversions += 1;
        acc[category].revenue += relatedConversion.value || 0;
      }
      return acc;
    }, {});

    const categoryPerformance = Object.entries(categoryStats)
      .map(([category, stats]: [string, any]) => ({
        category,
        conversionRate:
          stats.clicks > 0 ? (stats.conversions / stats.clicks) * 100 : 0,
        revenuePerClick: stats.clicks > 0 ? stats.revenue / stats.clicks : 0,
      }))
      .sort((a, b) => b.revenuePerClick - a.revenuePerClick);

    const topPerformingCategories = categoryPerformance
      .slice(0, 3)
      .map((c) => c.category);
    const underPerformingCategories = categoryPerformance
      .slice(-2)
      .map((c) => c.category);

    // Time-based
    const hourlyStats: Record<number, number> = events.reduce((acc: Record<number, number>, event: any) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakTrafficHours = Object.entries(hourlyStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Geographic
    const geoStats = events
      .filter((e: any) => e.city && e.state)
      .reduce((acc: Record<string, any>, e: any) => {
        const key = `${e.city}, ${e.state}`;
        if (!acc[key]) acc[key] = { events: 0, revenue: 0 };
        acc[key].events += 1;
        if (e.event_type === "ad_conversion") acc[key].revenue += e.value || 0;
        return acc;
      }, {});

    const highValueGeographies = Object.entries(geoStats)
      .sort(([, a]: any, [, b]: any) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([location]) => location);

    const metrics: PerformanceMetrics = {
      clickThroughRate,
      conversionRate,
      revenuePerClick,
      averageOrderValue,
      topPerformingCategories,
      underPerformingCategories,
      peakTrafficHours,
      highValueGeographies,
    };

    // Generate insights
    const insights: OptimizationInsight[] = [];

    if (clickThroughRate < 80) {
      insights.push({
        type: "traffic",
        priority: "high",
        title: "Click-Through Rate Below Target",
        description: `Your current CTR is ${clickThroughRate.toFixed(1)}%. Improving ad relevance and placement can significantly increase engagement.`,
        currentValue: clickThroughRate,
        targetValue: 85,
        potentialRevenue: clicks.length * 0.6 * revenuePerClick,
        actionItems: [
          "A/B test different product images and descriptions",
          "Improve ad placement and visibility on diagnosis pages",
          "Add urgency indicators (limited time, low stock)",
          "Optimize for mobile users if they represent >50% of traffic",
        ],
        confidence: 85,
        implementation: "easy",
      });
    }

    if (conversionRate < 60) {
      insights.push({
        type: "conversion",
        priority: "high",
        title: "Conversion Rate Optimization Opportunity",
        description: `Your conversion rate is ${conversionRate.toFixed(1)}%. Reducing friction in the purchase journey can boost revenue.`,
        currentValue: conversionRate,
        targetValue: 65,
        potentialRevenue: clicks.length * 0.05 * averageOrderValue,
        actionItems: [
          "Streamline affiliate checkout redirect flow",
          "Add trust signals (reviews, security badges)",
          "Implement retargeting for users who clicked but didn't convert",
          "Optimize mobile purchase experience",
        ],
        confidence: 80,
        implementation: "moderate",
      });
    }

    if (underPerformingCategories.length > 0) {
      insights.push({
        type: "product",
        priority: "medium",
        title: "Underperforming Product Categories",
        description: `Categories like ${underPerformingCategories.join(", ")} are generating low revenue per click. Consider optimizing or replacing these recommendations.`,
        currentValue:
          categoryPerformance.find((c) =>
            underPerformingCategories.includes(c.category)
          )?.revenuePerClick || 0,
        targetValue: revenuePerClick,
        potentialRevenue: clicks.length * 0.2 * (revenuePerClick * 0.5),
        actionItems: [
          "Replace low-performing products with higher-rated alternatives",
          "Improve product descriptions and images",
          "Negotiate better commission rates with suppliers",
          "Add customer reviews and social proof",
        ],
        confidence: 75,
        implementation: "easy",
      });
    }

    if (highValueGeographies.length > 0) {
      insights.push({
        type: "geographic",
        priority: "medium",
        title: "Geographic Expansion Opportunity",
        description: `High-value locations like ${highValueGeographies.slice(0, 2).join(", ")} are performing well. Consider targeted marketing in similar demographics.`,
        currentValue: (geoStats[highValueGeographies[0]] as any)?.revenue || 0,
        targetValue: ((geoStats[highValueGeographies[0]] as any)?.revenue || 0) * 2,
        potentialRevenue: totalRevenue * 0.3,
        actionItems: [
          "Launch geo-targeted advertising campaigns",
          "Partner with local auto repair shops in high-value areas",
          "Create location-specific landing pages",
          "Analyze successful market characteristics for replication",
        ],
        confidence: 70,
        implementation: "moderate",
      });
    }

    if (peakTrafficHours.length > 0) {
      insights.push({
        type: "timing",
        priority: "low",
        title: "Traffic Timing Optimization",
        description: `Peak traffic occurs at ${peakTrafficHours.map((h) => `${h}:00`).join(", ")}. Optimize ad delivery and promotions for these windows.`,
        currentValue: Math.max(...Object.values(hourlyStats)),
        targetValue: Math.max(...Object.values(hourlyStats)) * 1.5,
        potentialRevenue: totalRevenue * 0.15,
        actionItems: [
          "Schedule promotional emails for peak hours",
          "Increase ad budgets during high-traffic periods",
          "Launch time-sensitive offers during peak times",
          "Optimize server performance for peak hour loads",
        ],
        confidence: 65,
        implementation: "easy",
      });
    }

    if (revenuePerClick < 5) {
      insights.push({
        type: "revenue",
        priority: "high",
        title: "Low Revenue Per Click",
        description: `Revenue per click is $${revenuePerClick.toFixed(2)}. Promoting higher-value products or improving conversion can significantly boost income.`,
        currentValue: revenuePerClick,
        targetValue: 6.0,
        potentialRevenue: clicks.length * 1.5,
        actionItems: [
          "Promote higher-commission products prominently",
          "Bundle complementary products together",
          "Implement dynamic pricing based on user behavior",
          "Add premium product recommendations",
        ],
        confidence: 88,
        implementation: "easy",
      });
    }

    return {
      metrics,
      insights: insights.sort((a, b) => {
        const w = { high: 3, medium: 2, low: 1 };
        if (w[a.priority] !== w[b.priority]) return w[b.priority] - w[a.priority];
        return b.potentialRevenue - a.potentialRevenue;
      }),
    };
  };

  const getPriorityVariant = (p: OptimizationInsight["priority"]) => {
    switch (p) {
      case "high": return "destructive" as const;
      case "medium": return "default" as const;
      case "low": return "secondary" as const;
    }
  };

  const getPriorityIcon = (p: OptimizationInsight["priority"]) => {
    switch (p) {
      case "high": return AlertTriangle;
      case "medium": return Target;
      case "low": return Lightbulb;
    }
  };

  const getImplColor = (impl: OptimizationInsight["implementation"]) => {
    switch (impl) {
      case "easy": return "text-emerald-600";
      case "moderate": return "text-amber-600";
      case "complex": return "text-red-600";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Analyzing Performance…
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPotentialRevenue = insights.reduce((s, i) => s + i.potentialRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Performance Optimization Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{metrics?.clickThroughRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Click-Through Rate</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{metrics?.conversionRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">${metrics?.revenuePerClick.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Revenue Per Click</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-emerald-600">+${totalPotentialRevenue.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Potential Revenue</div>
            </div>
          </div>

          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Based on 30-day performance data, we've identified{" "}
              <strong>{insights.length} optimization opportunities</strong> that could increase monthly
              revenue by <strong>${totalPotentialRevenue.toFixed(0)}</strong>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Optimization Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Optimization Recommendations</h2>

        {insights.map((insight, index) => {
          const PriorityIcon = getPriorityIcon(insight.priority);

          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <PriorityIcon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">{insight.title}</h3>
                      <p className="text-muted-foreground text-sm">{insight.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getPriorityVariant(insight.priority)}>
                      {insight.priority} priority
                    </Badge>
                    <Badge variant="outline" className={getImplColor(insight.implementation)}>
                      {insight.implementation}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{insight.currentValue.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Current</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-emerald-600">
                      {insight.targetValue.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Target</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-emerald-600">
                      +${insight.potentialRevenue.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Potential Revenue</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Action Items:</p>
                  <ul className="space-y-1">
                    {insight.actionItems.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Confidence: {insight.confidence}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Wins */}
      {insights.filter((i) => i.implementation === "easy" && i.potentialRevenue > 10).length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Quick Wins (Implement Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights
                .filter((i) => i.implementation === "easy" && i.potentialRevenue > 10)
                .slice(0, 3)
                .map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.actionItems[0]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-600">
                        +${insight.potentialRevenue.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">potential</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={analyzePerformance}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh Analysis
        </Button>
      </div>
    </div>
  );
};

export default OptimizationEngine;
