import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RevenueMetrics {
  totalClicks: number;
  totalRevenue: number;
  averageRevenuePerClick: number;
  conversionRate: number;
  topPerformingCategories: Array<{
    category: string;
    clicks: number;
    revenue: number;
  }>;
}

export const useRevenueAnalytics = (dateRange: { start: string; end: string }) => {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from("analytics_events" as any)
          .select("*")
          .gte("timestamp", dateRange.start)
          .lte("timestamp", dateRange.end)
          .in("event_type", ["ad_click", "ad_conversion"]);

        if (error) throw error;

        const events = (data || []) as any[];
        const clicks = events.filter((e) => e.event_type === "ad_click");
        const conversions = events.filter((e) => e.event_type === "ad_conversion");

        const totalRevenue = conversions.reduce((sum: number, c: any) => sum + (c.value || 0), 0);
        const conversionRate = clicks.length > 0 ? (conversions.length / clicks.length) * 100 : 0;

        const categoryStats = clicks.reduce((acc: Record<string, { clicks: number; revenue: number }>, click: any) => {
          const cat = click.category;
          if (!acc[cat]) acc[cat] = { clicks: 0, revenue: 0 };
          acc[cat].clicks += 1;
          const related = conversions.find((c: any) => c.item_id === click.item_id);
          if (related) acc[cat].revenue += related.value || 0;
          return acc;
        }, {});

        setMetrics({
          totalClicks: clicks.length,
          totalRevenue,
          averageRevenuePerClick: clicks.length > 0 ? totalRevenue / clicks.length : 0,
          conversionRate,
          topPerformingCategories: Object.entries(categoryStats)
            .map(([category, stats]) => ({ category, ...(stats as { clicks: number; revenue: number }) }))
            .sort((a, b) => b.revenue - a.revenue),
        });
      } catch (error) {
        console.error("Failed to fetch revenue analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange.start, dateRange.end]);

  return { metrics, loading };
};
