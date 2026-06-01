import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AccuracyAuditPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [openAlerts, setOpenAlerts] = useState(0);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Check admin role
    const { data: role } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) { setLoading(false); return; }
    setIsAdmin(true);

    await loadStats();
    setLoading(false);
  };

  const loadStats = async () => {
    // Last computed_at from accuracy_metrics
    const { data: metrics } = await supabase
      .from("accuracy_metrics")
      .select("computed_at")
      .order("computed_at", { ascending: false })
      .limit(1);

    if (metrics && metrics.length > 0) {
      setLastRun(metrics[0].computed_at);
    }

    // Count open alerts
    const { count } = await supabase
      .from("accuracy_alerts")
      .select("id", { count: "exact", head: true })
      .eq("is_resolved", false);

    setOpenAlerts(count ?? 0);
  };

  const runAudit = async () => {
    setRunning(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-audit-accuracy", {
        method: "POST",
        body: {},
      });


      if (error) throw error;
      setLastResult(data);
      toast.success(`Audit complete — ${data.metrics_written} metrics, ${data.alerts_generated} new alerts`);
      await loadStats();
    } catch (e: any) {
      toast.error(e.message || "Audit failed");
    } finally {
      setRunning(false);
    }
  };

  if (loading) return null;
  if (!isAdmin) return null;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Accuracy Auditor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Last run:
          </div>
          <span className="text-foreground font-mono text-xs">
            {lastRun ? new Date(lastRun).toLocaleString() : "Never"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Open alerts:
          </div>
          <Badge variant={openAlerts > 0 ? "destructive" : "secondary"} className="text-xs">
            {openAlerts}
          </Badge>
        </div>

        <Button
          onClick={runAudit}
          disabled={running}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          size="sm"
        >
          {running ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running Audit…</>
          ) : (
            "Run Accuracy Audit"
          )}
        </Button>

        {lastResult && (
          <div className="text-xs font-mono bg-secondary rounded-lg p-3 space-y-1 text-muted-foreground">
            <p>Outcomes analyzed: {lastResult.total_outcomes_analyzed}</p>
            <p>Metrics written: {lastResult.metrics_written}</p>
            <p>Alerts generated: {lastResult.alerts_generated}</p>
            {lastResult.breakdown && (
              <p className="text-foreground/60">
                Categories: {lastResult.breakdown.symptom_categories} symptom, {lastResult.breakdown.vehicle_makes} make, {lastResult.breakdown.urgency_levels} urgency
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
