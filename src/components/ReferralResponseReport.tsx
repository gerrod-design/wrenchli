import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, RefreshCw } from "lucide-react";

interface ShopResponseRow {
  shop_id: string;
  shop_name: string;
  sends: number;
  responses: number;
  median_response_minutes: number | null;
  responded_within_window_share: number | null;
  never_responded_share: number | null;
}

interface OverallResponseRow {
  sends: number;
  responses: number;
  median_response_minutes: number | null;
  responded_within_window_share: number | null;
  never_responded_share: number | null;
}

interface ResponseReport {
  shops: ShopResponseRow[];
  overall: OverallResponseRow;
}

function formatMinutes(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
}

function formatShare(share: number | null): string {
  if (share == null) return "—";
  return `${Math.round(share * 100)}%`;
}

/**
 * Founder response-time report (Referral Lifecycle Phase 1, decision 5).
 * Data comes from referral_response_report(), which is restricted to
 * admins via has_role server-side; non-admins see the restriction
 * message instead of data. Exists so the end-of-next-business-day
 * acceptance window can be re-ruled on pilot data.
 */
export default function ReferralResponseReport() {
  const [report, setReport] = useState<ResponseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "referral_response_report" as any
      );
      if (rpcError) throw rpcError;
      setReport(data as any as ResponseReport);
    } catch (e: any) {
      console.error("Failed to load referral response report:", e);
      setError(
        e?.message?.includes("admin")
          ? "This report is restricted to admins."
          : "Could not load the response-time report."
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" /> Shop Response Times (Pilot)
        </h3>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Per-shop response performance for addressed referrals. The acceptance window is
        currently the end of the next business day after a send; this report is the
        evidence base for re-ruling that window on pilot data.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : error ? (
        <p className="text-center py-6 text-muted-foreground">{error}</p>
      ) : !report || report.overall.sends === 0 ? (
        <p className="text-center py-6 text-muted-foreground">
          No addressed referrals have been sent yet.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sends</p>
              <p className="font-heading text-2xl font-bold">{report.overall.sends}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Median response
              </p>
              <p className="font-heading text-2xl font-bold">
                {formatMinutes(report.overall.median_response_minutes)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Responded in window
              </p>
              <p className="font-heading text-2xl font-bold">
                {formatShare(report.overall.responded_within_window_share)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Never responded
              </p>
              <p className="font-heading text-2xl font-bold">
                {formatShare(report.overall.never_responded_share)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {["Shop", "Sends", "Responses", "Median response", "In window", "Never responded"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {report.shops.map((s) => (
                  <tr key={s.shop_id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.shop_name}</td>
                    <td className="px-4 py-3">{s.sends}</td>
                    <td className="px-4 py-3">{s.responses}</td>
                    <td className="px-4 py-3">{formatMinutes(s.median_response_minutes)}</td>
                    <td className="px-4 py-3">{formatShare(s.responded_within_window_share)}</td>
                    <td className="px-4 py-3">{formatShare(s.never_responded_share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
