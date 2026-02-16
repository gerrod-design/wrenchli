import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  LogOut, CreditCard, FileText, Users, Store, TrendingUp,
  Loader2, RefreshCw, DollarSign, Mail, BarChart3, Activity,
} from "lucide-react";
import { Key } from "lucide-react";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import OptimizationEngine from "@/components/OptimizationEngine";
import ApiKeyManager from "@/components/ApiKeyManager";
import ApiUsageAnalytics from "@/components/ApiUsageAnalytics";

interface FinanceSelection {
  id: string;
  created_at: string;
  provider: string;
  option_type: string;
  apr: number;
  monthly_payment: number;
  term_months: number;
  total_cost: number;
  repair_cost: number;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  zip_code: string | null;
}

interface QuoteRequest {
  id: string;
  created_at: string;
  diagnosis_title: string;
  diagnosis_code: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  zip_code: string;
  estimated_cost_low: number | null;
  estimated_cost_high: number | null;
  customer_email: string | null;
  customer_name: string | null;
  financing_interested: boolean;
  status: string;
}

interface WaitlistSignup {
  id: string;
  created_at: string;
  email: string;
  name: string | null;
}

interface ShopRecommendation {
  id: string;
  created_at: string;
  shop_name: string;
  shop_location: string;
  recommender_name: string | null;
  recommender_email: string | null;
  specializations: string[] | null;
}

interface ContactSubmission {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
}

const COLORS = ["hsl(var(--accent))", "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
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

function DataTable({ columns, rows }: { columns: string[]; rows: any[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                No data yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financeSelections, setFinanceSelections] = useState<FinanceSelection[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistSignup[]>([]);
  const [shopRecs, setShopRecs] = useState<ShopRecommendation[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use native fetch with the stored token to avoid Supabase client auth locks
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || '{}') : null;
      const accessToken = tokenData?.access_token;
      
      if (!accessToken) {
        setError("No active session. Please sign in again.");
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const headers = {
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      const fetchTable = async (table: string) => {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/${table}?select=*&order=created_at.desc&limit=500`,
          { headers }
        );
        if (!res.ok) throw new Error(`${table}: ${res.status} ${res.statusText}`);
        return res.json();
      };

      const [fs, qr, wl, sr, cs] = await Promise.all([
        fetchTable("finance_selections"),
        fetchTable("quote_requests"),
        fetchTable("waitlist_signups"),
        fetchTable("shop_recommendations"),
        fetchTable("contact_submissions"),
      ]);

      setFinanceSelections(fs || []);
      setQuoteRequests(qr || []);
      setWaitlist(wl || []);
      setShopRecs(sr || []);
      setContacts(cs || []);
    } catch (err: any) {
      console.error("Dashboard fetch failed:", err);
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) setError("Loading timed out. The server may be slow or unavailable.");
        return false;
      });
    }, 15000);
    return () => clearTimeout(timeout);
  }, []);

  // Finance analytics
  const providerCounts = financeSelections.reduce<Record<string, number>>((acc, s) => {
    acc[s.provider] = (acc[s.provider] || 0) + 1;
    return acc;
  }, {});
  const providerChartData = Object.entries(providerCounts).map(([name, value]) => ({ name, value }));

  const typeCounts = financeSelections.reduce<Record<string, number>>((acc, s) => {
    const label = s.option_type === "bnpl" ? "Buy Now Pay Later" : s.option_type === "credit_union" ? "Credit Union" : "Bank";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const typeChartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  const avgRepairCost = financeSelections.length
    ? Math.round(financeSelections.reduce((s, f) => s + f.repair_cost, 0) / financeSelections.length)
    : 0;

  const financingInterested = quoteRequests.filter((q) => q.financing_interested).length;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading dashboard data…</p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4 max-w-md">
            <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto">
              <TrendingUp className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="font-heading text-lg font-semibold">Unable to load dashboard</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchAll}>
              <RefreshCw className="h-4 w-4 mr-1" /> Try Again
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-secondary pb-[60px] md:pb-0">
      <SEO title="Admin Dashboard — Wrenchli" description="Admin analytics dashboard" path="/admin" />

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container-wrenchli flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-heading text-lg font-bold text-primary">Wrenchli</Link>
            <Badge variant="outline" className="text-xs">Admin</Badge>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">← Back to Site</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAll}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container-wrenchli py-6 space-y-6">
        {(loading || error) ? renderContent() : (<>
        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={CreditCard} label="Finance Selections" value={financeSelections.length} sub={`Avg repair: $${avgRepairCost.toLocaleString()}`} />
          <StatCard icon={FileText} label="Quote Requests" value={quoteRequests.length} sub={`${financingInterested} interested in financing`} />
          <StatCard icon={Users} label="Waitlist Signups" value={waitlist.length} />
          <StatCard icon={Store} label="Shop Recommendations" value={shopRecs.length} />
          <StatCard icon={Mail} label="Contact Submissions" value={contacts.length} />
        </div>

        <Tabs defaultValue="finance" className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="finance"><CreditCard className="h-4 w-4 mr-1.5 hidden sm:inline" />Finance</TabsTrigger>
            <TabsTrigger value="quotes"><FileText className="h-4 w-4 mr-1.5 hidden sm:inline" />Quotes</TabsTrigger>
            <TabsTrigger value="waitlist"><Users className="h-4 w-4 mr-1.5 hidden sm:inline" />Waitlist</TabsTrigger>
            <TabsTrigger value="shops"><Store className="h-4 w-4 mr-1.5 hidden sm:inline" />Shops</TabsTrigger>
            <TabsTrigger value="contacts"><Mail className="h-4 w-4 mr-1.5 hidden sm:inline" />Contacts</TabsTrigger>
            <TabsTrigger value="api-keys"><Key className="h-4 w-4 mr-1.5 hidden sm:inline" />API Keys</TabsTrigger>
            <TabsTrigger value="api-usage"><Activity className="h-4 w-4 mr-1.5 hidden sm:inline" />API Usage</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1.5 hidden sm:inline" />Analytics</TabsTrigger>
            <TabsTrigger value="optimization"><TrendingUp className="h-4 w-4 mr-1.5 hidden sm:inline" />Optimize</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="mt-6">
            <OptimizationEngine />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="mt-6">
            <ApiKeyManager />
          </TabsContent>

          {/* API Usage Tab */}
          <TabsContent value="api-usage" className="mt-6">
            <ApiUsageAnalytics />
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="mt-6 space-y-6">
            {financeSelections.length > 0 ? (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Provider popularity */}
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-accent" /> Provider Popularity
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={providerChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Type breakdown */}
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" /> Financing Type Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={typeChartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {typeChartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <DataTable
                  columns={["Date", "Provider", "Type", "APR", "Monthly", "Term", "Repair Cost", "Vehicle", "ZIP"]}
                  rows={financeSelections.map((f) => [
                    fmtDate(f.created_at),
                    f.provider,
                    f.option_type,
                    f.apr === 0 ? "0%" : `${f.apr}%`,
                    `$${Math.round(f.monthly_payment)}`,
                    `${f.term_months}mo`,
                    `$${f.repair_cost.toLocaleString()}`,
                    [f.vehicle_year, f.vehicle_make, f.vehicle_model].filter(Boolean).join(" ") || "—",
                    f.zip_code || "—",
                  ])}
                />
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No financing selections recorded yet.
              </div>
            )}
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="mt-6">
            <DataTable
              columns={["Date", "Diagnosis", "Code", "Vehicle", "ZIP", "Estimate", "Contact", "Financing", "Status"]}
              rows={quoteRequests.map((q) => [
                fmtDate(q.created_at),
                q.diagnosis_title,
                q.diagnosis_code || "—",
                [q.vehicle_year, q.vehicle_make, q.vehicle_model].filter(Boolean).join(" ") || "—",
                q.zip_code,
                q.estimated_cost_low && q.estimated_cost_high
                  ? `$${q.estimated_cost_low.toLocaleString()}–$${q.estimated_cost_high.toLocaleString()}`
                  : "—",
                q.customer_email || "—",
                q.financing_interested ? <Badge className="bg-accent text-accent-foreground text-xs">Yes</Badge> : "No",
                <Badge variant="outline" className="text-xs">{q.status}</Badge>,
              ])}
            />
          </TabsContent>

          {/* Waitlist Tab */}
          <TabsContent value="waitlist" className="mt-6">
            <DataTable
              columns={["Date", "Name", "Email"]}
              rows={waitlist.map((w) => [
                fmtDate(w.created_at),
                w.name || "—",
                w.email,
              ])}
            />
          </TabsContent>

          {/* Shops Tab */}
          <TabsContent value="shops" className="mt-6">
            <DataTable
              columns={["Date", "Shop Name", "Location", "Recommender", "Email", "Specializations"]}
              rows={shopRecs.map((s) => [
                fmtDate(s.created_at),
                s.shop_name,
                s.shop_location,
                s.recommender_name || "—",
                s.recommender_email || "—",
                s.specializations?.join(", ") || "—",
              ])}
            />
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="mt-6">
            <DataTable
              columns={["Date", "Name", "Email", "Phone", "Message"]}
              rows={contacts.map((c) => [
                fmtDate(c.created_at),
                c.name || "—",
                c.email || "—",
                c.phone || "—",
                c.message ? (c.message.length > 80 ? c.message.slice(0, 80) + "…" : c.message) : "—",
              ])}
            />
          </TabsContent>
        </Tabs>
        </>)}
      </div>
    </main>
  );
}
