import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, AlertCircle, Info, CheckCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShopQualityAlertsProps {
  shopId: string;
}

const severityConfig: Record<string, { icon: any; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  high: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/5" },
  medium: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  low: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
};

export default function ShopQualityAlerts({ shopId }: ShopQualityAlertsProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [shopId]);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from("quality_alerts")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    setAlerts(data || []);
    setIsLoading(false);
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from("quality_alerts")
      .update({ status: "acknowledged", action_taken: "Acknowledged by shop owner" })
      .eq("id", alertId);

    if (error) {
      toast.error("Failed to acknowledge alert");
    } else {
      toast.success("Alert acknowledged");
      fetchAlerts();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openAlerts = alerts.filter(a => a.status === "open");
  const resolvedAlerts = alerts.filter(a => a.status !== "open");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Quality Alerts</h2>
        {openAlerts.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold">
            {openAlerts.length} active
          </span>
        )}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-16">
          <Shield className="h-12 w-12 text-accent mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground mb-1">All Clear!</h3>
          <p className="text-sm text-muted-foreground">
            No quality alerts. Your shop is performing well.
          </p>
        </div>
      )}

      {/* Open alerts */}
      {openAlerts.length > 0 && (
        <div className="space-y-3">
          {openAlerts.map((alert) => {
            const sev = severityConfig[alert.severity] || severityConfig.medium;
            const Icon = sev.icon;
            return (
              <div key={alert.id} className={cn("rounded-xl border p-5", sev.bg, "border-border")}>
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", sev.color)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-bold uppercase", sev.color)}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {alert.alert_type?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved alerts */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Resolved</h3>
          <div className="space-y-2">
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="bg-card rounded-lg border border-border p-3 flex items-center gap-3 opacity-60">
                <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{alert.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">{alert.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
