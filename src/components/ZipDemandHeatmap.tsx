import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { MapPin, TrendingUp, AlertTriangle, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchLog {
  zip_code: string;
  city_resolved: string | null;
  state: string | null;
  service_type: string | null;
  results_count: number;
  searched_at: string;
}

const COLORS = ["hsl(var(--accent))", "#ef4444", "#f59e0b", "#10b981", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"];

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 space-y-1 ${accent ? "ring-2 ring-accent/30" : ""}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-heading text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function ZipDemandHeatmap() {
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - parseInt(timeRange));

      const { data, error } = await supabase
        .from("shop_search_logs")
        .select("zip_code, city_resolved, state, service_type, results_count, searched_at")
        .gte("searched_at", since.toISOString())
        .order("searched_at", { ascending: false })
        .limit(1000);

      if (!error && data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [timeRange]);

  const filtered = useMemo(() => {
    if (stateFilter === "all") return logs;
    return logs.filter((l) => l.state === stateFilter);
  }, [logs, stateFilter]);

  const totalSearches = filtered.length;
  const unservedSearches = filtered.filter((l) => l.results_count === 0);
  const unservedRate = totalSearches > 0 ? Math.round((unservedSearches.length / totalSearches) * 100) : 0;

  // Top unserved ZIPs
  const unservedByZip = useMemo(() => {
    const counts: Record<string, { count: number; state: string | null }> = {};
    unservedSearches.forEach((l) => {
      if (!counts[l.zip_code]) counts[l.zip_code] = { count: 0, state: l.state };
      counts[l.zip_code].count++;
    });
    return Object.entries(counts)
      .map(([zip, { count, state }]) => ({ zip, count, state }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [unservedSearches]);

  // Searches by city (all)
  const searchesByCity = useMemo(() => {
    const counts: Record<string, { total: number; unserved: number }> = {};
    filtered.forEach((l) => {
      const city = l.city_resolved || "Unknown";
      if (!counts[city]) counts[city] = { total: 0, unserved: 0 };
      counts[city].total++;
      if (l.results_count === 0) counts[city].unserved++;
    });
    return Object.entries(counts)
      .map(([city, { total, unserved }]) => ({ city, total, unserved }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [filtered]);

  // Service type demand for unserved
  const serviceTypeDemand = useMemo(() => {
    const counts: Record<string, number> = {};
    unservedSearches.forEach((l) => {
      const svc = l.service_type || "general";
      counts[svc] = (counts[svc] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [unservedSearches]);

  // State breakdown
  const stateBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; unserved: number }> = {};
    filtered.forEach((l) => {
      const st = l.state || "Unknown";
      if (!counts[st]) counts[st] = { total: 0, unserved: 0 };
      counts[st].total++;
      if (l.results_count === 0) counts[st].unserved++;
    });
    return Object.entries(counts).map(([state, data]) => ({ state, ...data }));
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            ZIP Demand Heatmap
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Identify unserved areas with the highest search demand to prioritize expansion.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="MI">Michigan</SelectItem>
              <SelectItem value="OH">Ohio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Search} label="Total Searches" value={totalSearches} sub={`Last ${timeRange} days`} />
        <StatCard icon={AlertTriangle} label="Unserved Searches" value={unservedSearches.length} sub={`${unservedRate}% of total`} accent={unservedRate > 20} />
        <StatCard icon={MapPin} label="Unique Unserved ZIPs" value={new Set(unservedSearches.map((l) => l.zip_code)).size} sub="Need coverage" />
        <StatCard icon={TrendingUp} label="Top Gap ZIP" value={unservedByZip[0]?.zip || "—"} sub={unservedByZip[0] ? `${unservedByZip[0].count} searches (${unservedByZip[0].state || "?"})` : "No gaps"} />
      </div>

      {totalSearches === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No search data yet. Data will appear as users search for shops.</p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Unserved ZIPs bar chart */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Top Unserved ZIP Codes
              </h3>
              {unservedByZip.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={unservedByZip} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="zip" width={60} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} searches`, "Demand"]}
                      labelFormatter={(label) => {
                        const item = unservedByZip.find((z) => z.zip === label);
                        return `ZIP ${label} (${item?.state || "?"})`;
                      }}
                    />
                    <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">All searches returned results!</p>
              )}
            </div>

            {/* Search volume by city */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Search Volume by City
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={searchesByCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unserved" name="Unserved" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Second row: service type demand + state breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Service type demand for unserved */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-heading font-semibold mb-4">Unserved Service Type Demand</h3>
              {serviceTypeDemand.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={serviceTypeDemand}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {serviceTypeDemand.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No unserved demand data</p>
              )}
            </div>

            {/* State breakdown */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-heading font-semibold mb-4">Coverage by State</h3>
              <div className="space-y-4">
                {stateBreakdown.map(({ state, total, unserved }) => {
                  const coverage = total > 0 ? Math.round(((total - unserved) / total) * 100) : 0;
                  return (
                    <div key={state} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{state === "MI" ? "Michigan" : state === "OH" ? "Ohio" : state}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{total} searches</span>
                          <Badge variant={coverage >= 80 ? "default" : coverage >= 50 ? "secondary" : "destructive"}>
                            {coverage}% served
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${coverage}%`,
                            backgroundColor: coverage >= 80 ? "hsl(var(--accent))" : coverage >= 50 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {stateBreakdown.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No state data</p>
                )}
              </div>
            </div>
          </div>

          {/* Unserved ZIPs Table */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-heading font-semibold mb-4">Expansion Priority List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Rank</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">ZIP Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">State</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Search Count</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {unservedByZip.map((row, i) => (
                    <tr key={row.zip} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono">{i + 1}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{row.zip}</td>
                      <td className="px-4 py-3">{row.state || "—"}</td>
                      <td className="px-4 py-3">{row.count}</td>
                      <td className="px-4 py-3">
                        <Badge variant={row.count >= 10 ? "destructive" : row.count >= 5 ? "secondary" : "outline"}>
                          {row.count >= 10 ? "🔥 High" : row.count >= 5 ? "⚠️ Medium" : "Low"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {unservedByZip.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No unserved ZIP codes — great coverage!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
