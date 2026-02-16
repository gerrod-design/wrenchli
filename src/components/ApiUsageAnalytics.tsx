import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Activity, Globe, Stethoscope, Clock, Zap, DollarSign, Car } from "lucide-react";

const COLORS = ["hsl(var(--accent))", "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

interface ApiLog {
  id: string;
  created_at: string;
  endpoint: string;
  key_hash: string;
  diagnosis_title: string | null;
  diagnosis_code: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_trim: string | null;
  zip_code: string | null;
  response_status: number | null;
  response_time_ms: number | null;
  cost_low: number | null;
  cost_high: number | null;
  metro_area: string | null;
}

export default function ApiUsageAnalytics() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || '{}') : null;
      const accessToken = tokenData?.access_token;
      if (!accessToken) { setError("No session"); setLoading(false); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/api_request_logs?select=*&order=created_at.desc&limit=1000`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setLogs(await res.json());
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  );

  if (error) return (
    <div className="text-center py-12 space-y-3">
      <p className="text-sm text-muted-foreground">{error}</p>
      <Button variant="outline" size="sm" onClick={fetchLogs}><RefreshCw className="h-4 w-4 mr-1" /> Retry</Button>
    </div>
  );

  if (logs.length === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <Activity className="h-8 w-8 mx-auto mb-3 opacity-40" />
      <p className="font-medium">No API requests logged yet</p>
      <p className="text-xs mt-1">Requests will appear here once the API endpoints are called.</p>
    </div>
  );

  // --- Computed analytics ---

  // Daily volume (last 30 days)
  const dailyMap: Record<string, { diagnose: number; estimate: number; value: number }> = {};
  logs.forEach(l => {
    const day = new Date(l.created_at).toISOString().slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { diagnose: 0, estimate: 0, value: 0 };
    if (l.endpoint === "api-diagnose") dailyMap[day].diagnose++;
    else if (l.endpoint === "api-vehicle-value") dailyMap[day].value++;
    else dailyMap[day].estimate++;
  });
  const dailyVolume = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Diagnose: counts.diagnose,
      Estimate: counts.estimate,
      Valuation: counts.value,
      Total: counts.diagnose + counts.estimate + counts.value,
    }));

  // Vehicle Value endpoint analytics
  const valueLogs = logs.filter(l => l.endpoint === "api-vehicle-value");
  const valueRecCounts: Record<string, number> = {};
  valueLogs.forEach(l => {
    const rec = l.diagnosis_title || "no_repair_cost";
    valueRecCounts[rec] = (valueRecCounts[rec] || 0) + 1;
  });
  const valueRecData = Object.entries(valueRecCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    value,
  }));
  const avgVehicleValue = valueLogs.length
    ? Math.round(valueLogs.filter(l => l.cost_low != null).reduce((s, l) => s + (l.cost_low || 0), 0) / valueLogs.filter(l => l.cost_low != null).length)
    : 0;
  const valueWithRepair = valueLogs.filter(l => l.cost_high != null).length;
  const valueWithoutRepair = valueLogs.length - valueWithRepair;

  // Endpoint split
  const endpointCounts = logs.reduce<Record<string, number>>((a, l) => {
    a[l.endpoint] = (a[l.endpoint] || 0) + 1;
    return a;
  }, {});
  const endpointData = Object.entries(endpointCounts).map(([name, value]) => ({ name: name.replace("api-", ""), value }));

  // Top diagnoses
  const diagCounts: Record<string, number> = {};
  logs.forEach(l => { if (l.diagnosis_title) diagCounts[l.diagnosis_title] = (diagCounts[l.diagnosis_title] || 0) + 1; });
  const topDiagnoses = Object.entries(diagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name: name.length > 30 ? name.slice(0, 30) + "…" : name, value }));

  // Geographic distribution
  const geoCounts: Record<string, number> = {};
  logs.forEach(l => {
    const area = l.metro_area || (l.zip_code ? `ZIP ${l.zip_code}` : null);
    if (area) geoCounts[area] = (geoCounts[area] || 0) + 1;
  });
  const geoData = Object.entries(geoCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Top vehicles
  const vehicleCounts: Record<string, number> = {};
  logs.forEach(l => {
    const v = [l.vehicle_year, l.vehicle_make, l.vehicle_model].filter(Boolean).join(" ");
    if (v) vehicleCounts[v] = (vehicleCounts[v] || 0) + 1;
  });
  const topVehicles = Object.entries(vehicleCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Response time stats
  const responseTimes = logs.filter(l => l.response_time_ms != null).map(l => l.response_time_ms!);
  const avgResponseTime = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
  const p95 = responseTimes.length ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)] : 0;

  // Success rate
  const successCount = logs.filter(l => l.response_status && l.response_status >= 200 && l.response_status < 300).length;
  const successRate = logs.length ? Math.round((successCount / logs.length) * 100) : 0;

  // Avg cost estimate
  const estimateLogs = logs.filter(l => l.cost_low != null && l.cost_high != null);
  const avgEstimate = estimateLogs.length
    ? Math.round(estimateLogs.reduce((s, l) => s + ((l.cost_low! + l.cost_high!) / 2), 0) / estimateLogs.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" /> API Usage Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{logs.length.toLocaleString()} total requests logged</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard icon={Activity} label="Total Requests" value={logs.length.toLocaleString()} />
        <KpiCard icon={Zap} label="Success Rate" value={`${successRate}%`} />
        <KpiCard icon={Clock} label="Avg Response" value={`${avgResponseTime}ms`} sub={`P95: ${p95}ms`} />
        <KpiCard icon={Stethoscope} label="Unique Diagnoses" value={Object.keys(diagCounts).length.toString()} />
        <KpiCard icon={Car} label="Valuations" value={valueLogs.length.toLocaleString()} sub={avgVehicleValue ? `Avg value: $${avgVehicleValue.toLocaleString()}` : undefined} />
        <KpiCard icon={Globe} label="Regions Served" value={Object.keys(geoCounts).length.toString()} sub={avgEstimate ? `Avg est: $${avgEstimate}` : undefined} />
      </div>

      {/* Charts Row 1: Volume + Endpoint */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold mb-4">Daily API Call Volume</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="Diagnose" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
              <Area type="monotone" dataKey="Estimate" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
              <Area type="monotone" dataKey="Valuation" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold mb-4">Endpoint Split</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={endpointData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {endpointData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Diagnoses + Geography */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-accent" /> Top Diagnoses
          </h3>
          {topDiagnoses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDiagnoses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No diagnosis data yet</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-accent" /> Geographic Distribution
          </h3>
          {geoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No geographic data yet</p>}
        </div>
      </div>

      {/* Vehicle Value Insights */}
      {valueLogs.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 space-y-5">
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent" /> Vehicle Value API Insights
            <Badge variant="outline" className="ml-2 text-xs">{valueLogs.length} requests</Badge>
          </h3>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recommendation distribution */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Recommendation Distribution</h4>
              {valueRecData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={valueRecData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {valueRecData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground">No recommendation data yet</p>}
            </div>
            {/* Value usage stats */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Usage Breakdown</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Vehicle Value</p>
                  <p className="font-heading text-xl font-bold">${avgVehicleValue.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground">With Repair Cost</p>
                  <p className="font-heading text-xl font-bold">{valueWithRepair}</p>
                  <p className="text-[11px] text-muted-foreground">{valueLogs.length ? Math.round((valueWithRepair / valueLogs.length) * 100) : 0}% include repair analysis</p>
                </div>
              </div>
              {/* Top valued vehicles */}
              {(() => {
                const valVehicles: Record<string, number> = {};
                valueLogs.forEach(l => {
                  const v = [l.vehicle_year, l.vehicle_make, l.vehicle_model].filter(Boolean).join(" ");
                  if (v) valVehicles[v] = (valVehicles[v] || 0) + 1;
                });
                const topVal = Object.entries(valVehicles).sort(([, a], [, b]) => b - a).slice(0, 5);
                return topVal.length > 0 ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Top Valued Vehicles</p>
                    <div className="space-y-1.5">
                      {topVal.map(([name, count]) => (
                        <div key={name} className="flex justify-between items-center text-sm">
                          <span className="truncate">{name}</span>
                          <Badge variant="secondary" className="text-xs shrink-0 ml-2">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Top Vehicles */}
      {topVehicles.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold mb-4">Top Vehicles Queried</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topVehicles}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Requests Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-heading font-semibold mb-4">Recent API Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {["Time", "Endpoint", "Diagnosis", "Vehicle", "ZIP", "Status", "Latency", "Est. Range"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 25).map(l => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{l.endpoint.replace("api-", "")}</Badge></td>
                  <td className="px-3 py-2 max-w-[200px] truncate">{l.diagnosis_title || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{[l.vehicle_year, l.vehicle_make, l.vehicle_model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-3 py-2">{l.zip_code || "—"}</td>
                  <td className="px-3 py-2">
                    {l.response_status ? (
                      <Badge className={`text-xs ${l.response_status < 300 ? "bg-emerald-500/20 text-emerald-700" : l.response_status < 500 ? "bg-amber-500/20 text-amber-700" : "bg-red-500/20 text-red-700"}`}>
                        {l.response_status}
                      </Badge>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{l.response_time_ms != null ? `${l.response_time_ms}ms` : "—"}</td>
                  <td className="px-3 py-2 text-xs">{l.cost_low != null && l.cost_high != null ? `$${l.cost_low}–$${l.cost_high}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-heading text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
