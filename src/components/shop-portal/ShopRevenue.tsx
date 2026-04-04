import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Loader2, Wrench } from "lucide-react";

interface ShopRevenueProps {
  shopId: string;
}

export default function ShopRevenue({ shopId }: ShopRevenueProps) {
  const [stats, setStats] = useState({ totalJobs: 0, totalRevenue: 0, avgJobValue: 0, byType: [] as any[] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, [shopId]);

  const fetchRevenue = async () => {
    const { data: outcomes } = await supabase
      .from("repair_outcomes")
      .select("shop_actual_cost, diagnosis_record_id, created_at, diagnosis_records(primary_diagnosis)")
      .eq("shop_id", shopId)
      .not("shop_actual_cost", "is", null);

    const items = outcomes || [];
    const totalRevenue = items.reduce((sum: number, o: any) => sum + Number(o.shop_actual_cost || 0), 0);
    const totalJobs = items.length;
    const avgJobValue = totalJobs > 0 ? Math.round(totalRevenue / totalJobs) : 0;

    // Group by diagnosis type
    const typeMap: Record<string, { jobs: number; revenue: number }> = {};
    for (const item of items) {
      const type = item.diagnosis_records?.primary_diagnosis || "Other";
      if (!typeMap[type]) typeMap[type] = { jobs: 0, revenue: 0 };
      typeMap[type].jobs++;
      typeMap[type].revenue += Number(item.shop_actual_cost || 0);
    }
    const byType = Object.entries(typeMap)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    setStats({ totalJobs, totalRevenue: Math.round(totalRevenue), avgJobValue, byType });
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Revenue Tracking</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <DollarSign className="h-5 w-5 text-accent mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <span className="text-xs text-muted-foreground">Total Revenue</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <Wrench className="h-5 w-5 text-accent mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalJobs}</div>
          <span className="text-xs text-muted-foreground">Total Jobs</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <TrendingUp className="h-5 w-5 text-accent mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">
            ${stats.avgJobValue.toLocaleString()}
          </div>
          <span className="text-xs text-muted-foreground">Avg per Job</span>
        </div>
      </div>

      {/* Breakdown */}
      {stats.byType.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4">Revenue by Repair Type</h3>
          <div className="space-y-3">
            {stats.byType.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{item.type}</span>
                  <span className="text-xs text-muted-foreground">{item.jobs} jobs</span>
                </div>
                <span className="font-bold text-foreground">${Math.round(item.revenue).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.totalJobs === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No revenue data yet</p>
          <p className="text-sm mt-1">Revenue tracking begins when jobs are completed through Wrenchli.</p>
        </div>
      )}
    </div>
  );
}
