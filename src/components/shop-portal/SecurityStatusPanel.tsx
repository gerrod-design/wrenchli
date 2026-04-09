import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface SecurityAlert {
  id: string;
  check_name: string;
  severity: string;
  details: string;
  created_at: string;
}

export default function SecurityStatusPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [passed, setPassed] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [failures, setFailures] = useState(0);
  const [openAlerts, setOpenAlerts] = useState<SecurityAlert[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: role } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) { setLoading(false); return; }
    setIsAdmin(true);
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    // Last audit log entry
    const { data: logs } = await supabase
      .from("security_audit_log")
      .select("checked_at, status")
      .order("checked_at", { ascending: false })
      .limit(10);

    if (logs && logs.length > 0) {
      setLastRun(logs[0].checked_at);
      // Count by most recent batch (same checked_at)
      const latest = logs[0].checked_at;
      const batch = logs.filter((l) => l.checked_at === latest);
      setPassed(batch.filter((l) => l.status === "pass").length);
      setWarnings(batch.filter((l) => l.status === "warning").length);
      setFailures(batch.filter((l) => l.status === "fail").length);
    }

    // Open alerts
    const { data: alerts } = await supabase
      .from("security_alerts")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false });

    setOpenAlerts((alerts as any[]) ?? []);
  };

  const runCheck = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("security-monitor", {
        method: "POST",
        body: {},
      });
      if (error) throw error;
      toast.success(`Security check complete — ${data.passed} passed, ${data.warnings} warnings, ${data.failed} failed`);
      await loadData();
    } catch (e: any) {
      toast.error(e.message || "Security check failed");
    } finally {
      setRunning(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      const { error } = await supabase.rpc("resolve_security_alert", { alert_id: alertId });
      if (error) throw error;
      toast.success("Alert resolved");
      setOpenAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (e: any) {
      toast.error(e.message || "Failed to resolve");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading || !isAdmin) return null;

  const severityColor: Record<string, string> = {
    critical: "destructive",
    high: "destructive",
    medium: "secondary",
    low: "secondary",
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          Security Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status summary */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            <span className="text-green-500 font-medium">{passed}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-amber-500 font-medium">{warnings}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-red-500 font-medium">{failures}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Last run:
          </div>
          <span className="text-foreground font-mono text-xs">
            {lastRun ? new Date(lastRun).toLocaleString() : "Never"}
          </span>
        </div>

        <Button
          onClick={runCheck}
          disabled={running}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          size="sm"
        >
          {running ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running Check…</>
          ) : (
            "Run Security Check"
          )}
        </Button>

        {/* Open alerts */}
        {openAlerts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">
              Open Alerts ({openAlerts.length})
            </p>
            {openAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-2 bg-secondary rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {alert.check_name}
                    </span>
                    <Badge
                      variant={severityColor[alert.severity] === "destructive" ? "destructive" : "secondary"}
                      className="text-[10px] px-1.5"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {alert.details}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs shrink-0"
                  disabled={resolvingId === alert.id}
                  onClick={() => resolveAlert(alert.id)}
                >
                  {resolvingId === alert.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Resolve"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
