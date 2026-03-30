import { useState, useEffect } from "react";
import { Loader2, Store, MapPin, TrendingUp, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ShopInterestEvent {
  id: string;
  created_at: string;
  shop_id: string;
  shop_name: string;
  shop_address: string | null;
  shop_type: string | null;
  zip_code: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  source: string | null;
}

interface ShopAggregate {
  shop_name: string;
  shop_id: string;
  shop_type: string;
  count: number;
  latest: string;
  zip_code: string;
}

export default function ShopInterestAnalytics() {
  const [events, setEvents] = useState<ShopInterestEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || '{}') : null;
        const accessToken = tokenData?.access_token;
        if (!accessToken) return;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const res = await fetch(
          `${supabaseUrl}/rest/v1/shop_interest_events?select=*&order=created_at.desc&limit=1000`,
          {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (res.ok) {
          setEvents(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch shop interest events:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  // Aggregate by shop
  const shopMap = new Map<string, ShopAggregate>();
  for (const e of events) {
    const existing = shopMap.get(e.shop_id);
    if (existing) {
      existing.count++;
      if (e.created_at > existing.latest) existing.latest = e.created_at;
    } else {
      shopMap.set(e.shop_id, {
        shop_name: e.shop_name,
        shop_id: e.shop_id,
        shop_type: e.shop_type || "independent",
        count: 1,
        latest: e.created_at,
        zip_code: e.zip_code || "—",
      });
    }
  }

  const aggregated = Array.from(shopMap.values()).sort((a, b) => b.count - a.count);
  const chartData = aggregated.slice(0, 10).map(s => ({
    name: s.shop_name.length > 20 ? s.shop_name.slice(0, 18) + "…" : s.shop_name,
    interests: s.count,
  }));

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Interest Signals</span>
          </div>
          <p className="font-heading text-2xl font-bold">{events.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Store className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Unique Shops</span>
          </div>
          <p className="font-heading text-2xl font-bold">{aggregated.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Top Shop</span>
          </div>
          <p className="font-heading text-lg font-bold truncate">
            {aggregated[0]?.shop_name || "—"}
          </p>
          {aggregated[0] && (
            <p className="text-xs text-muted-foreground">{aggregated[0].count} interest signals</p>
          )}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" /> Interest by Shop (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="interests" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-heading font-semibold mb-4">Shop Interest Breakdown — Sales Outreach Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use this data when pitching shops: "X users in your area wanted to book with you through Wrenchli last month."
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Shop Name</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Interest Count</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">ZIP</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Last Signal</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((s) => (
                <tr key={s.shop_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.shop_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">{s.shop_type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                      <Heart className="h-3.5 w-3.5" />
                      {s.count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.zip_code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.latest)}</td>
                </tr>
              ))}
              {aggregated.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No interest signals yet. Non-partnered shops will appear here when users click "I'm Interested."
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}