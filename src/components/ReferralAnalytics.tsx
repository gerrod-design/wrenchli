import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
} from "recharts";
import { Link2, ArrowRight, RefreshCw, Loader2, TrendingUp, MousePointerClick, Eye, FileText } from "lucide-react";

interface ReferralEvent {
  id: string;
  referral_token: string;
  event_type: string;
  source: string;
  created_at: string;
  diagnosis_title: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  zip_code: string | null;
  quote_request_id: string | null;
}

interface TokenMetrics {
  token: string;
  clicks: number;
  visits: number;
  quotes: number;
  clickToVisit: number;
  visitToQuote: number;
  lastActivity: string;
}

const FUNNEL_COLORS = ["hsl(var(--accent))", "#6366f1", "#10b981"];

export default function ReferralAnalytics() {
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
      const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || "{}") : null;
      const accessToken = tokenData?.access_token;
      if (!accessToken) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/referral_events?select=*&order=created_at.desc&limit=1000`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error("Failed to fetch referral events:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  // Aggregate by token
  const tokenMap = events.reduce<Record<string, { clicks: number; visits: number; quotes: number; lastActivity: string }>>((acc, e) => {
    if (!acc[e.referral_token]) acc[e.referral_token] = { clicks: 0, visits: 0, quotes: 0, lastActivity: e.created_at };
    const t = acc[e.referral_token];
    if (e.event_type === "click") t.clicks++;
    else if (e.event_type === "page_visit") t.visits++;
    else if (e.event_type === "quote_submitted") t.quotes++;
    if (e.created_at > t.lastActivity) t.lastActivity = e.created_at;
    return acc;
  }, {});

  const tokenMetrics: TokenMetrics[] = Object.entries(tokenMap)
    .map(([token, m]) => ({
      token,
      ...m,
      clickToVisit: m.clicks > 0 ? Math.round((m.visits / m.clicks) * 100) : 0,
      visitToQuote: m.visits > 0 ? Math.round((m.quotes / m.visits) * 100) : 0,
    }))
    .sort((a, b) => b.quotes - a.quotes || b.clicks - a.clicks);

  // Overall funnel
  const totalClicks = events.filter(e => e.event_type === "click").length;
  const totalVisits = events.filter(e => e.event_type === "page_visit").length;
  const totalQuotes = events.filter(e => e.event_type === "quote_submitted").length;

  const funnelData = [
    { name: "Clicks", value: totalClicks, fill: FUNNEL_COLORS[0] },
    { name: "Page Visits", value: totalVisits, fill: FUNNEL_COLORS[1] },
    { name: "Quote Submissions", value: totalQuotes, fill: FUNNEL_COLORS[2] },
  ];

  // Bar chart: top tokens by quotes
  const topTokens = tokenMetrics.slice(0, 10).map(t => ({
    token: t.token.length > 12 ? t.token.slice(0, 12) + "…" : t.token,
    Clicks: t.clicks,
    Visits: t.visits,
    Quotes: t.quotes,
  }));

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link2 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Unique Tokens</span>
          </div>
          <p className="font-heading text-2xl font-bold">{tokenMetrics.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Clicks</span>
          </div>
          <p className="font-heading text-2xl font-bold">{totalClicks}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Page Visits</span>
          </div>
          <p className="font-heading text-2xl font-bold">{totalVisits}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Quote Submissions</span>
          </div>
          <p className="font-heading text-2xl font-bold">{totalQuotes}</p>
          <p className="text-xs text-muted-foreground">
            {totalClicks > 0 ? `${Math.round((totalQuotes / totalClicks) * 100)}% overall conversion` : "—"}
          </p>
        </div>
      </div>

      {/* Funnel + Top tokens charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion funnel */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" /> Conversion Funnel
          </h3>
          {totalClicks > 0 ? (
            <div className="space-y-3">
              {funnelData.map((step, i) => {
                const pct = totalClicks > 0 ? Math.round((step.value / totalClicks) * 100) : 0;
                return (
                  <div key={step.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{step.name}</span>
                      <span className="text-muted-foreground">{step.value} ({pct}%)</span>
                    </div>
                    <div className="h-8 w-full rounded-lg bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: step.fill }}
                      />
                    </div>
                    {i < funnelData.length - 1 && (
                      <div className="flex justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No referral data yet</p>
          )}
        </div>

        {/* Top tokens bar chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent" /> Top Referral Sources
          </h3>
          {topTokens.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topTokens} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="token" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Clicks" fill={FUNNEL_COLORS[0]} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Visits" fill={FUNNEL_COLORS[1]} stackId="a" />
                <Bar dataKey="Quotes" fill={FUNNEL_COLORS[2]} stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No referral data yet</p>
          )}
        </div>
      </div>

      {/* Token detail table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent" /> Referral Token Breakdown
          </h3>
          <Button variant="ghost" size="sm" onClick={fetchEvents}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {["Token", "Clicks", "Visits", "Quotes", "Click → Visit", "Visit → Quote", "Last Activity"].map(col => (
                  <th key={col} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokenMetrics.map(t => (
                <tr key={t.token} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{t.token}</td>
                  <td className="px-4 py-3">{t.clicks}</td>
                  <td className="px-4 py-3">{t.visits}</td>
                  <td className="px-4 py-3">
                    {t.quotes > 0 ? (
                      <Badge className="bg-accent text-accent-foreground text-xs">{t.quotes}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{t.clickToVisit}%</td>
                  <td className="px-4 py-3">{t.visitToQuote}%</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(t.lastActivity)}</td>
                </tr>
              ))}
              {tokenMetrics.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No referral events yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
