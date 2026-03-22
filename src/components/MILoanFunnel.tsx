import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
} from "recharts";
import { Loader2, TrendingDown, TrendingUp, ArrowDown } from "lucide-react";

interface FunnelEvent {
  action: string;
  category: string;
  metadata: any;
  timestamp: string;
  zip_code: string | null;
}

const FUNNEL_STAGES = [
  { key: "mi_loan_eligibility_started", label: "Eligibility Started" },
  { key: "mi_loan_eligibility_passed", label: "Eligibility Passed" },
  { key: "mi_loan_application_started", label: "Application Started" },
  { key: "mi_loan_application_completed", label: "Application Submitted" },
  { key: "mi_loan_approved", label: "Approved" },
] as const;

const STAGE_COLORS = [
  "hsl(var(--primary))",
  "hsl(217, 91%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(142, 76%, 36%)",
];

export default function MILoanFunnel() {
  const [events, setEvents] = useState<FunnelEvent[]>([]);
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

        const actions = FUNNEL_STAGES.map(s => s.key).join(',');
        const denied = 'mi_loan_denied';
        const allActions = `${actions},${denied},mi_loan_eligibility_failed,mi_loan_approved_full,mi_loan_approved_partial`;

        const res = await fetch(
          `${supabaseUrl}/rest/v1/analytics_events?select=action,category,metadata,timestamp,zip_code&action=in.(${allActions})&order=timestamp.desc&limit=1000`,
          {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setEvents(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch MI Loan events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Count events per stage
  const countByAction = (action: string) =>
    events.filter(e => e.action === action || e.action.startsWith(action)).length;

  // Combine approved variants
  const approvedCount = events.filter(e =>
    e.action === 'mi_loan_approved' ||
    e.action === 'mi_loan_approved_full' ||
    e.action === 'mi_loan_approved_partial'
  ).length;

  const deniedCount = countByAction('mi_loan_denied');
  const failedEligibility = countByAction('mi_loan_eligibility_failed');

  const stageCounts = FUNNEL_STAGES.map(stage => {
    if (stage.key === 'mi_loan_approved') return { ...stage, count: approvedCount };
    if (stage.key === 'mi_loan_eligibility_passed') {
      return { ...stage, count: countByAction('mi_loan_eligibility_passed') };
    }
    return { ...stage, count: countByAction(stage.key) };
  });

  const funnelData = stageCounts.map((stage, i) => ({
    name: stage.label,
    value: stage.count,
    fill: STAGE_COLORS[i],
  }));

  // Conversion rates between stages
  const conversionRates = stageCounts.slice(1).map((stage, i) => {
    const prev = stageCounts[i].count;
    const rate = prev > 0 ? ((stage.count / prev) * 100).toFixed(1) : "0.0";
    return {
      from: stageCounts[i].label,
      to: stage.label,
      rate: parseFloat(rate),
      dropoff: prev > 0 ? (((prev - stage.count) / prev) * 100).toFixed(1) : "0.0",
    };
  });

  const overallConversion = stageCounts[0].count > 0
    ? ((approvedCount / stageCounts[0].count) * 100).toFixed(1)
    : "0.0";

  // Financing type breakdown
  const fullCount = events.filter(e => e.action === 'mi_loan_approved_full').length;
  const partialCount = events.filter(e => e.action === 'mi_loan_approved_partial').length;

  // Daily trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEvents = events.filter(e => new Date(e.timestamp) >= thirtyDaysAgo);

  const dailyCounts: Record<string, { eligibility: number; approved: number }> = {};
  recentEvents.forEach(e => {
    const day = new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!dailyCounts[day]) dailyCounts[day] = { eligibility: 0, approved: 0 };
    if (e.action.includes('eligibility_started')) dailyCounts[day].eligibility++;
    if (e.action.includes('approved')) dailyCounts[day].approved++;
  });
  const dailyTrend = Object.entries(dailyCounts)
    .map(([date, counts]) => ({ date, ...counts }))
    .reverse();

  const totalEvents = events.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stageCounts.map((stage, i) => (
          <Card key={stage.key}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stage.label}</p>
              <p className="font-heading text-2xl font-bold mt-1">{stage.count}</p>
              {i > 0 && stageCounts[i - 1].count > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {((stage.count / stageCounts[i - 1].count) * 100).toFixed(0)}% from prev step
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overall Conversion</p>
                <p className="font-heading text-3xl font-bold mt-1">{overallConversion}%</p>
                <p className="text-xs text-muted-foreground">Eligibility → Approved</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Denied</p>
                <p className="font-heading text-3xl font-bold mt-1">{deniedCount}</p>
                <p className="text-xs text-muted-foreground">+ {failedEligibility} failed eligibility</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Financing Type</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className="text-xs">Full: {fullCount}</Badge>
                  <Badge variant="outline" className="text-xs">Partial: {partialCount}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{totalEvents} total events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization + Conversion Steps */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              MI Loan Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={STAGE_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No funnel data yet. Events will appear as users go through the MI Loan flow.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step-by-Step Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionRates.map((cr, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cr.from}</span>
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{cr.to}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${Math.min(cr.rate, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-14 text-right">{cr.rate}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{cr.dropoff}% drop-off</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      {dailyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="eligibility" name="Eligibility Checks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approvals" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
