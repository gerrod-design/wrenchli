import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { Loader2, ShoppingCart, Eye, Youtube, AlertTriangle, TrendingUp, MousePointerClick } from "lucide-react";

interface MetricSummary {
  buyAllClicks: number;
  savingsImpressions: number;
  youtubeClicks: number;
  commonIssueBadgeViews: number;
  totalDiagnoses: number;
  buyAllCTR: number;
  youtubeCTR: number;
  dailyTrend: { date: string; clicks: number; impressions: number }[];
  topVehicles: { vehicle: string; clicks: number }[];
}

export default function ConversionMetrics() {
  const [data, setData] = useState<MetricSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || '{}') : null;
      const accessToken = tokenData?.access_token;
      if (!accessToken) { setError("No session"); setLoading(false); return; }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const headers = { 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` };

      // Fetch all diy_product category events
      const res = await fetch(
        `${supabaseUrl}/rest/v1/analytics_events?select=action,timestamp,vehicle_year,vehicle_make,vehicle_model,metadata&category=eq.diy_product&order=timestamp.desc&limit=1000`,
        { headers }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const events: any[] = await res.json();

      // Also get total diagnosis count (action=diagnosis_complete or category=diagnosis)
      const diagRes = await fetch(
        `${supabaseUrl}/rest/v1/analytics_events?select=id&action=eq.diagnosis_complete&limit=1000`,
        { headers }
      );
      const diagEvents = diagRes.ok ? await diagRes.json() : [];

      // Compute metrics
      const buyAllClicks = events.filter(e => e.action === 'buy_all_parts_click').length;
      const savingsImpressions = events.filter(e => e.action === 'savings_callout_impression').length;
      const youtubeClicks = events.filter(e => e.action === 'youtube_tutorial_click').length;
      const commonIssueBadgeViews = events.filter(e => e.action === 'common_issue_badge_impression').length;
      const totalDiagnoses = Math.max(diagEvents.length, savingsImpressions, 1);

      const buyAllCTR = totalDiagnoses > 0 ? (buyAllClicks / totalDiagnoses) * 100 : 0;
      const youtubeCTR = totalDiagnoses > 0 ? (youtubeClicks / totalDiagnoses) * 100 : 0;

      // Daily trend (last 30 days)
      const dailyMap: Record<string, { clicks: number; impressions: number }> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dailyMap[key] = { clicks: 0, impressions: 0 };
      }
      events.forEach(e => {
        const day = e.timestamp?.slice(0, 10);
        if (!dailyMap[day]) return;
        if (e.action === 'buy_all_parts_click' || e.action === 'youtube_tutorial_click') {
          dailyMap[day].clicks++;
        }
        if (e.action === 'savings_callout_impression' || e.action === 'common_issue_badge_impression') {
          dailyMap[day].impressions++;
        }
      });
      const dailyTrend = Object.entries(dailyMap).map(([date, v]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...v,
      }));

      // Top vehicles by buy-all clicks
      const vehicleMap: Record<string, number> = {};
      events.filter(e => e.action === 'buy_all_parts_click').forEach(e => {
        const v = [e.vehicle_year, e.vehicle_make, e.vehicle_model].filter(Boolean).join(" ");
        if (v) vehicleMap[v] = (vehicleMap[v] || 0) + 1;
      });
      const topVehicles = Object.entries(vehicleMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([vehicle, clicks]) => ({ vehicle, clicks }));

      setData({ buyAllClicks, savingsImpressions, youtubeClicks, commonIssueBadgeViews, totalDiagnoses, buyAllCTR, youtubeCTR, dailyTrend, topVehicles });
    } catch (err: any) {
      setError(err?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-center py-12 text-muted-foreground">{error || "No data"}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h2 className="font-heading text-xl font-bold">DIY Conversion Metrics</h2>
        <Badge variant="outline" className="text-xs">Last 30 days</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShoppingCart className="h-4 w-4" /> Buy All Parts Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.buyAllClicks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              CTR: <span className="font-semibold text-accent">{data.buyAllCTR.toFixed(1)}%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" /> Savings Callout Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.savingsImpressions}</p>
            <p className="text-xs text-muted-foreground mt-1">Impression count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Youtube className="h-4 w-4" /> YouTube Tutorial Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.youtubeClicks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              CTR: <span className="font-semibold text-accent">{data.youtubeCTR.toFixed(1)}%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" /> Common Issue Badge Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.commonIssueBadgeViews}</p>
            <p className="text-xs text-muted-foreground mt-1">Impression count</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClick className="h-4 w-4 text-accent" /> Daily Clicks vs Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Clicks" />
                <Line type="monotone" dataKey="impressions" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} name="Impressions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-accent" /> Top Vehicles — Buy All Parts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topVehicles.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.topVehicles} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="vehicle" type="category" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-muted-foreground text-sm">No vehicle-specific data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
