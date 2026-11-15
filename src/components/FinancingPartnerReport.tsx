/**
 * Financing Partner Outcomes (Repair Financing surface, 2026-11-14).
 *
 * Data comes from financing_outcome_report(), restricted to admins
 * via has_role server-side. Counts outcomes by partner and kind, in
 * the same spirit as the referral response report. Mock (simulation)
 * partners are ALWAYS shown in their own section, never blended
 * with live partners.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HandCoins, RefreshCw, FlaskConical } from "lucide-react";
import {
  fetchFinancingOutcomeReport,
  PARTNER_TYPE_LABELS,
  type FinancingOutcomeReportRow,
} from "@/lib/financing";

function ReportTable({ rows }: { rows: FinancingOutcomeReportRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No partners in this section yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2 pr-3 font-medium">Partner</th>
            <th className="py-2 pr-3 font-medium">Type</th>
            <th className="py-2 pr-3 font-medium text-right">Referrals</th>
            <th className="py-2 pr-3 font-medium text-right">Applied</th>
            <th className="py-2 pr-3 font-medium text-right">Approved</th>
            <th className="py-2 pr-3 font-medium text-right">Declined</th>
            <th className="py-2 pr-3 font-medium text-right">Funded</th>
            <th className="py-2 font-medium text-right">Repair completed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.partner_id} className="border-b border-border/60">
              <td className="py-2 pr-3 font-medium">{row.partner_name}</td>
              <td className="py-2 pr-3">{PARTNER_TYPE_LABELS[row.partner_type]}</td>
              <td className="py-2 pr-3 text-right">{row.referrals_sent}</td>
              <td className="py-2 pr-3 text-right">{row.applied}</td>
              <td className="py-2 pr-3 text-right">{row.approved}</td>
              <td className="py-2 pr-3 text-right">{row.declined}</td>
              <td className="py-2 pr-3 text-right">{row.funded}</td>
              <td className="py-2 text-right">{row.repair_completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FinancingPartnerReport() {
  const [rows, setRows] = useState<FinancingOutcomeReportRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchFinancingOutcomeReport());
    } catch (e: any) {
      console.error("Failed to load financing outcome report:", e);
      setError(
        e?.message?.includes("admin")
          ? "This report is restricted to admins."
          : "Could not load the financing outcome report.",
      );
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const live = (rows ?? []).filter((r) => !r.is_mock);
  const mocks = (rows ?? []).filter((r) => r.is_mock);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <HandCoins className="h-4 w-4 text-accent" /> Financing Partner Outcomes
        </h3>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Outcome counts by financing partner, reported back against anonymous referral
        tokens. Partners pay for outcomes; outcomes never change an assessment or a
        partner's position. Mock partners from the simulation harness are counted
        separately below and are never blended with live partners.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Live partners</h4>
            <ReportTable rows={live} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              Simulation (mock) partners
              <Badge variant="outline" className="gap-1">
                <FlaskConical className="h-3 w-3" /> SIMULATION
              </Badge>
            </h4>
            <ReportTable rows={mocks} />
          </div>
        </>
      )}
    </div>
  );
}
