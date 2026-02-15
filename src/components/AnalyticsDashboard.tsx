import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
  LineChart, Line,
} from "recharts";
import {
  TrendingUp,
  MousePointer,
  DollarSign,
  Target,
  BarChart3,
  Activity,
  Users,
  Smartphone,
  Monitor,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import { supabase } from "@/integrations/supabase/client";

const CHART_COLORS = [
  "hsl(var(--accent))",
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

interface DetailedStats {
  totalSessions: number;
  totalPageViews: number;
  totalImpressions: number;
  totalClicks: number;
  totalRevenue: number;
  topRepairTypes: Array<{
    diagnosis: string;
    count: number;
    avgRepairCost: number;
    clickRate: number;
  }>;
  topGeoLocations: Array<{
    city: string;
    state: string;
    sessions: number;
    revenue: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  abTestResults: Array<{
    testName: string;
    variant: string;
    users: number;
    conversionRate: number;
  }>;
  dailyTimeSeries: Array<{
    date: string;
    pageViews: number;
    clicks: number;
    impressions: number;
    conversions: number;
  }>;
}

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const isoRange = {
    start: `${dateRange.start}T00:00:00Z`,
    end: `${dateRange.end}T23:59:59Z`,
  };

  const { metrics, loading: revenueLoading } = useRevenueAnalytics(isoRange);
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("timestamp", isoRange.start)
        .lte("timestamp", isoRange.end);

      if (error) throw error;
      if (!events || events.length === 0) {
        setStats(null);
        return;
      }

      const sessions = new Set(events.map((e) => e.session_id)).size;
      const pageViews = events.filter((e) => e.event_type === "page_view").length;
      const impressions = events.filter((e) => e.event_type === "ad_impression").length;
      const clicks = events.filter((e) => e.event_type === "ad_click").length;
      const conversions = events.filter((e) => e.event_type === "ad_conversion");
      const totalRevenue = conversions.reduce((s, e) => s + (e.value || 0), 0);

      // Repair types
      const repairMap: Record<string, { count: number; cost: number; clicks: number; impressions: number }> = {};
      events.filter((e) => e.repair_diagnosis).forEach((e) => {
        const d = e.repair_diagnosis!;
        if (!repairMap[d]) repairMap[d] = { count: 0, cost: 0, clicks: 0, impressions: 0 };
        repairMap[d].count += 1;
        repairMap[d].cost += e.repair_cost_estimate || 0;
        if (e.event_type === "ad_click") repairMap[d].clicks += 1;
        if (e.event_type === "ad_impression") repairMap[d].impressions += 1;
      });
      const topRepairTypes = Object.entries(repairMap)
        .map(([diagnosis, s]) => ({
          diagnosis,
          count: s.count,
          avgRepairCost: s.count > 0 ? s.cost / s.count : 0,
          clickRate: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Geography
      const geoMap: Record<string, { city: string; state: string; sessions: Set<string>; revenue: number }> = {};
      events.filter((e) => e.city && e.state).forEach((e) => {
        const key = `${e.city}, ${e.state}`;
        if (!geoMap[key]) geoMap[key] = { city: e.city!, state: e.state!, sessions: new Set(), revenue: 0 };
        geoMap[key].sessions.add(e.session_id);
        if (e.event_type === "ad_conversion") geoMap[key].revenue += e.value || 0;
      });
      const topGeoLocations = Object.values(geoMap)
        .map((g) => ({ city: g.city, state: g.state, sessions: g.sessions.size, revenue: g.revenue }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);

      // Devices
      const deviceMap: Record<string, number> = {};
      events.forEach((e) => {
        const ua = e.user_agent?.toLowerCase() || "";
        const device = ua.includes("mobile") ? "Mobile" : ua.includes("tablet") ? "Tablet" : "Desktop";
        deviceMap[device] = (deviceMap[device] || 0) + 1;
      });
      const total = events.length;
      const deviceBreakdown = Object.entries(deviceMap).map(([device, count]) => ({
        device,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));

      // A/B tests
      const abMap: Record<string, { testName: string; variant: string; users: Set<string>; conversions: number }> = {};
      events.filter((e) => e.action === "ab_test_assignment").forEach((e) => {
        const meta = e.metadata as Record<string, unknown> | null;
        const testName = meta?.test_name as string | undefined;
        const variant = meta?.variant as string | undefined;
        if (!testName || !variant) return;
        const key = `${testName}:${variant}`;
        if (!abMap[key]) abMap[key] = { testName, variant, users: new Set(), conversions: 0 };
        abMap[key].users.add(e.session_id);
      });
      events.filter((e) => e.action === "ab_test_outcome").forEach((e) => {
        const meta = e.metadata as Record<string, unknown> | null;
        const testName = meta?.test_name as string | undefined;
        const variant = meta?.variant as string | undefined;
        const outcome = meta?.outcome as string | undefined;
        if (testName && variant && outcome === "conversion") {
          const key = `${testName}:${variant}`;
          if (abMap[key]) abMap[key].conversions += 1;
        }
      });
      const abTestResults = Object.values(abMap).map((t) => ({
        testName: t.testName,
        variant: t.variant,
        users: t.users.size,
        conversionRate: t.users.size > 0 ? (t.conversions / t.users.size) * 100 : 0,
      }));

      // Daily time series
      const dayMap: Record<string, { pageViews: number; clicks: number; impressions: number; conversions: number }> = {};
      events.forEach((e) => {
        const day = e.timestamp.split("T")[0];
        if (!dayMap[day]) dayMap[day] = { pageViews: 0, clicks: 0, impressions: 0, conversions: 0 };
        if (e.event_type === "page_view") dayMap[day].pageViews += 1;
        if (e.event_type === "ad_click") dayMap[day].clicks += 1;
        if (e.event_type === "ad_impression") dayMap[day].impressions += 1;
        if (e.event_type === "ad_conversion") dayMap[day].conversions += 1;
      });
      const dailyTimeSeries = Object.entries(dayMap)
        .map(([date, d]) => ({ date, ...d }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        totalSessions: sessions,
        totalPageViews: pageViews,
        totalImpressions: impressions,
        totalClicks: clicks,
        totalRevenue,
        topRepairTypes,
        topGeoLocations,
        deviceBreakdown,
        abTestResults,
        dailyTimeSeries,
      });
    } catch (err) {
      console.error("Failed to fetch analytics stats:", err);
    } finally {
      setLoading(false);
    }
  }, [isoRange.start, isoRange.end]);

  useEffect(() => {
    fetchStats();
  }, [dateRange.start, dateRange.end]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const { data, error } = await (supabase
        .from("analytics_events")
        .select("*")
        .gte("timestamp", isoRange.start)
        .lte("timestamp", isoRange.end)
        .csv() as any);
      if (error) throw error;
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wrenchli-analytics-${dateRange.start}-to-${dateRange.end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const isLoading = loading || revenueLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Analytics Dashboard
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
            className="w-40"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Sessions</span>
            </div>
            <p className="font-heading text-2xl font-bold mt-1">{stats?.totalSessions.toLocaleString() ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MousePointer className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Ad Clicks</span>
            </div>
            <p className="font-heading text-2xl font-bold mt-1">{stats?.totalClicks.toLocaleString() ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Revenue</span>
            </div>
            <p className="font-heading text-2xl font-bold mt-1">${(stats?.totalRevenue ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Conversion Rate</span>
            </div>
            <p className="font-heading text-2xl font-bold mt-1">{metrics ? metrics.conversionRate.toFixed(1) : "0.0"}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Time Series */}
      {stats && stats.dailyTimeSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Daily Event Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="pageViews" name="Page Views" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="impressions" name="Impressions" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Funnel: Impression → Click → Conversion */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const funnelData = [
                { name: "Impressions", value: stats.totalImpressions || 0, fill: "hsl(var(--accent))" },
                { name: "Clicks", value: stats.totalClicks || 0, fill: "#6366f1" },
                { name: "Conversions", value: stats.totalRevenue > 0 ? stats.totalPageViews : 0, fill: "#10b981" },
              ];
              // Use actual conversion count instead of revenue-based
              const conversionCount = stats.totalRevenue; // already sum of conversion values
              const actualFunnel = [
                { name: "Impressions", value: stats.totalImpressions || stats.totalPageViews, fill: "hsl(var(--accent))" },
                { name: "Clicks", value: stats.totalClicks, fill: "#6366f1" },
                { name: "Conversions", value: metrics?.conversionRate ? Math.round((stats.totalClicks * (metrics.conversionRate / 100))) : 0, fill: "#10b981" },
              ];
              const maxVal = Math.max(...actualFunnel.map(d => d.value), 1);
              return (
                <div className="space-y-6">
                  {/* Visual bar funnel */}
                  <div className="space-y-3">
                    {actualFunnel.map((step, i) => {
                      const pct = ((step.value / maxVal) * 100);
                      const dropOff = i > 0 && actualFunnel[i - 1].value > 0
                        ? ((1 - step.value / actualFunnel[i - 1].value) * 100).toFixed(1)
                        : null;
                      return (
                        <div key={step.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{step.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{step.value.toLocaleString()}</span>
                              {dropOff && (
                                <Badge variant="secondary" className="text-xs">
                                  −{dropOff}% drop
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="h-8 rounded-md bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-md transition-all duration-700"
                              style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: step.fill }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Summary row */}
                  <div className="flex items-center justify-between pt-2 border-t border-border text-sm text-muted-foreground">
                    <span>Overall conversion: <strong className="text-foreground">{actualFunnel[0].value > 0 ? ((actualFunnel[2].value / actualFunnel[0].value) * 100).toFixed(2) : "0.00"}%</strong></span>
                    <span>Click-through rate: <strong className="text-foreground">{actualFunnel[0].value > 0 ? ((actualFunnel[1].value / actualFunnel[0].value) * 100).toFixed(2) : "0.00"}%</strong></span>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Category performance from revenue hook */}
      {metrics && metrics.topPerformingCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Top Performing Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topPerformingCategories.map((cat, i) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={i === 0 ? "default" : "secondary"}>#{i + 1}</Badge>
                    <span className="font-medium capitalize">{cat.category.replace("_", " ")}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${cat.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{cat.clicks} clicks</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed tabs */}
      <Tabs defaultValue="repairs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="repairs">Repair Types</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
        </TabsList>

        {/* Repairs */}
        <TabsContent value="repairs" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Top Repair Types</CardTitle></CardHeader>
            <CardContent>
              {(!stats?.topRepairTypes.length) ? (
                <p className="text-muted-foreground text-sm">No repair data yet.</p>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.topRepairTypes.map((r) => ({
                      name: r.diagnosis.length > 20 ? r.diagnosis.slice(0, 20) + "…" : r.diagnosis,
                      events: r.count,
                      avgCost: Math.round(r.avgRepairCost),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      />
                      <Bar dataKey="events" name="Events" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgCost" name="Avg Cost ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {stats.topRepairTypes.map((r, i) => (
                      <div key={r.diagnosis} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Badge variant={i === 0 ? "default" : "secondary"}>#{i + 1}</Badge>
                          <div>
                            <h3 className="font-medium">{r.diagnosis}</h3>
                            <p className="text-sm text-muted-foreground">Avg repair: ${r.avgRepairCost.toFixed(0)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{r.count} events</p>
                          <p className="text-sm text-muted-foreground">{r.clickRate.toFixed(1)}% CTR</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography */}
        <TabsContent value="geography" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Geographic Performance</CardTitle></CardHeader>
            <CardContent>
              {(!stats?.topGeoLocations.length) ? (
                <p className="text-muted-foreground text-sm">No geographic data yet.</p>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.topGeoLocations.map((loc) => ({
                      name: `${loc.city}, ${loc.state}`,
                      sessions: loc.sessions,
                      revenue: Number(loc.revenue.toFixed(2)),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      />
                      <Bar dataKey="sessions" name="Sessions" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="revenue" name="Revenue ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {stats.topGeoLocations.map((loc, i) => (
                      <div key={`${loc.city}-${loc.state}`} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Badge variant={i === 0 ? "default" : "secondary"}>#{i + 1}</Badge>
                          <div>
                            <h3 className="font-medium">{loc.city}, {loc.state}</h3>
                            <p className="text-sm text-muted-foreground">{loc.sessions} sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${loc.revenue.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices */}
        <TabsContent value="devices" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Device Breakdown</CardTitle></CardHeader>
            <CardContent>
              {(!stats?.deviceBreakdown.length) ? (
                <p className="text-muted-foreground text-sm">No device data yet.</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={stats.deviceBreakdown.map((d) => ({ name: d.device, value: d.count }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.deviceBreakdown.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {stats.deviceBreakdown.map((d) => {
                        const Icon = d.device === "Mobile" ? Smartphone : Monitor;
                        return (
                          <div key={d.device} className="flex items-center justify-between p-4 rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h3 className="font-medium">{d.device}</h3>
                                <p className="text-sm text-muted-foreground">{d.percentage.toFixed(1)}% of traffic</p>
                              </div>
                            </div>
                            <p className="font-bold">{d.count.toLocaleString()} events</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Tests */}
        <TabsContent value="abtests" className="mt-4">
          <Card>
            <CardHeader><CardTitle>A/B Test Results</CardTitle></CardHeader>
            <CardContent>
              {(!stats?.abTestResults.length) ? (
                <p className="text-muted-foreground text-sm">No A/B test data yet.</p>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.abTestResults.map((t) => ({
                      name: `${t.testName.replace(/_/g, " ").slice(0, 15)}… / ${t.variant}`,
                      users: t.users,
                      conversion: Number(t.conversionRate.toFixed(1)),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      />
                      <Bar dataKey="users" name="Users" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="conversion" name="Conv. Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {Object.entries(
                    stats.abTestResults.reduce<Record<string, typeof stats.abTestResults>>((acc, t) => {
                      if (!acc[t.testName]) acc[t.testName] = [];
                      acc[t.testName].push(t);
                      return acc;
                    }, {})
                  ).map(([testName, variants]) => (
                    <div key={testName} className="space-y-3">
                      <h3 className="font-semibold text-lg capitalize">{testName.replace(/_/g, " ")}</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {variants.map((v) => (
                          <div key={v.variant} className="p-4 rounded-lg border border-border">
                            <div className="flex justify-between items-center mb-2">
                              <Badge variant={v.variant === "control" ? "default" : "secondary"}>{v.variant}</Badge>
                              <div className="text-right">
                                <p className="font-bold">{v.conversionRate.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">conversion rate</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{v.users} users tested</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
