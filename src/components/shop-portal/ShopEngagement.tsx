import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";

const FLAG_MESSAGES: Record<string, string> = {
  LOW_CONFIRMATION_RATE:
    "Confirm more repair outcomes to improve your Verified Score",
  NO_RECENT_OUTCOMES:
    "No outcomes confirmed in the last 14 days — your Verified Score may be affected",
  INACTIVE: "No Wrenchli customers have visited recently",
};

interface Props {
  shopId: string;
}

export default function ShopEngagement({ shopId }: Props) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [shopId]);

  const loadMetrics = async () => {
    // Get most recent week's metrics for this shop
    const { data } = await supabase
      .from("shop_engagement_metrics")
      .select("*")
      .eq("shop_id", shopId)
      .order("week_of", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setMetrics(data[0]);
    }
    setLoading(false);
  };

  if (loading) return null;

  const rate = metrics?.confirmation_rate ?? 0;
  const rateColor =
    rate >= 50
      ? "text-green-500"
      : rate >= 30
        ? "text-amber-500"
        : "text-red-500";
  const rateBg =
    rate >= 50
      ? "bg-green-500/10"
      : rate >= 30
        ? "bg-amber-500/10"
        : "bg-red-500/10";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-accent" />
        Engagement Summary
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {metrics?.sessions_count ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {metrics?.outcomes_count ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Outcomes</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className={`p-4 text-center rounded-lg ${rateBg}`}>
            <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${rateColor}`} />
            <p className={`text-2xl font-bold ${rateColor}`}>{rate}%</p>
            <p className="text-xs text-muted-foreground">Confirmation</p>
          </CardContent>
        </Card>
      </div>

      {metrics?.flagged && metrics?.flag_reason && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm text-foreground">
            <span className="font-medium">Action recommended:</span>{" "}
            {FLAG_MESSAGES[metrics.flag_reason] ?? metrics.flag_reason}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
