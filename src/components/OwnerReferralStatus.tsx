import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ban, CheckCircle, Flag, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface OwnerReferralRow {
  id: string;
  package_id: string;
  shop_id: string;
  chain_id: string;
  preference_order: number;
  escalated_from: string | null;
  status: string;
  sent_at: string;
  responded_at: string | null;
  window_expires_at: string | null;
  outcome_found: string | null;
  outcome_did: string | null;
  outcome_cost: number | null;
  outcome_reported_at: string | null;
  completion_confirmed_by: string | null;
  completion_confirmed_at: string | null;
  founder_flagged: boolean;
  disputed_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  sent: "Sent — awaiting response",
  viewed: "Viewed by shop",
  accepted: "Accepted by shop",
  declined: "Shop passed",
  expired: "No response in time",
  outcome_reported: "Outcome reported — awaiting your confirmation",
  completed: "Completed",
  not_completed: "Not completed",
  cancelled: "You stopped this referral chain",
};

/** Plain-words outcome for one hop of a chain, for the hop history. */
function hopOutcome(row: OwnerReferralRow): string {
  switch (row.status) {
    case "sent":
      return "Sent — awaiting the shop's response";
    case "viewed":
      return "Viewed by the shop — awaiting its response";
    case "accepted":
      return "Accepted by the shop";
    case "declined":
      return "Shop passed — moved to the next shop on your list";
    case "expired":
      return "No response in time — moved to the next shop on your list";
    case "cancelled":
      return "You stopped the chain here";
    case "outcome_reported":
      return "Shop reported the outcome — awaiting your confirmation";
    case "completed":
      return "Repair completed";
    case "not_completed":
      return "Not completed";
    default:
      return row.status;
  }
}

/** When the hop reached its current state (best available timestamp). */
function hopOutcomeTime(row: OwnerReferralRow): string {
  const t = row.responded_at || row.outcome_reported_at || row.updated_at || row.sent_at;
  return new Date(t).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface OwnerReferralStatusProps {
  /** When set, only referrals for this package are listed. */
  packageId?: string;
  className?: string;
}

/**
 * Owner-side view of shop_referrals (Referral Lifecycle Phase 1).
 * The owner's confirmation is the trigger that counts a completion;
 * the shop's outcome report alone is evidence. Disputing within
 * 30 days of the outcome report un-counts a completion.
 *
 * Hop notification (Decision 3): Phase 1 has no push/email surface,
 * and referral_events is admin-only, so THIS component is the Phase 1
 * notification surface: referrals are grouped by chain and every hop
 * is listed in order (shop, outcome, time), and the owner can stop
 * an active chain at any time via stop_referral_chain.
 */
export default function OwnerReferralStatus({ packageId, className }: OwnerReferralStatusProps) {
  const [rows, setRows] = useState<OwnerReferralRow[] | null>(null);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSignedIn(false);
      setRows([]);
      return;
    }
    setSignedIn(true);

    // Run the escalation / fallback processor on access so expiry,
    // the 7-day founder flag, and the 14-day owner-unconfirmed
    // fallback are current before we render.
    await supabase.rpc("process_referral_escalations");

    let query = supabase
      .from("shop_referrals" as any)
      .select(
        "id, package_id, shop_id, chain_id, preference_order, escalated_from, status, sent_at, responded_at, window_expires_at, outcome_found, outcome_did, outcome_cost, outcome_reported_at, completion_confirmed_by, completion_confirmed_at, founder_flagged, disputed_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false });
    if (packageId) query = query.eq("package_id", packageId);

    const { data, error } = await query;
    if (error) {
      console.error("Failed to load shop referrals:", error);
      setRows([]);
      return;
    }
    const referrals = (data as any as OwnerReferralRow[]) ?? [];
    setRows(referrals);

    const shopIds = Array.from(new Set(referrals.map((r) => r.shop_id)));
    if (shopIds.length > 0) {
      const { data: shops } = await supabase
        .from("service_providers")
        .select("id, name")
        .in("id", shopIds);
      if (shops) {
        setShopNames(
          Object.fromEntries((shops as { id: string; name: string }[]).map((s) => [s.id, s.name]))
        );
      }
    }
  }, [packageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (referralId: string, action: "confirm" | "dispute") => {
    setBusyId(referralId);
    try {
      const rpcName =
        action === "confirm" ? "confirm_referral_completion" : "dispute_referral_completion";
      const { data, error } = await supabase.rpc(rpcName as any, {
        p_referral_id: referralId,
      } as any);
      if (error) throw error;
      const result = data as any;
      if (result && result.ok === false) {
        toast.error(`Could not ${action} this referral (${result.reason || "unknown error"}).`);
      } else {
        toast.success(
          action === "confirm"
            ? "Completion confirmed. Thank you!"
            : "Dispute recorded. This completion will not be counted."
        );
      }
      await load();
    } catch (e) {
      console.error(`Referral ${action} failed:`, e);
      toast.error(`Failed to ${action} this referral.`);
    } finally {
      setBusyId(null);
    }
  };

  const stopChain = async (referral: OwnerReferralRow) => {
    const shop = shopNames[referral.shop_id] || "the current shop";
    const confirmed = window.confirm(
      `Stop this referral chain? The package will not stay with ${shop} and will not be sent to any other shops on your list.`
    );
    if (!confirmed) return;
    setBusyId(referral.id);
    try {
      const { data, error } = await supabase.rpc("stop_referral_chain" as any, {
        p_referral_id: referral.id,
      } as any);
      if (error) throw error;
      const result = data as any;
      if (result && result.ok === false) {
        toast.error(`Could not stop this chain (${result.reason || "unknown error"}).`);
      } else {
        toast.success("Referral chain stopped.");
      }
      await load();
    } catch (e) {
      console.error("Stop referral chain failed:", e);
      toast.error("Failed to stop this referral chain.");
    } finally {
      setBusyId(null);
    }
  };

  if (signedIn === false) return null;

  // Group hops into chains (Decision 3 notification surface): chains
  // keep the newest-first order of the loaded rows; hops inside a
  // chain are shown in the owner's preference order.
  const chains: { chainId: string; hops: OwnerReferralRow[] }[] = [];
  if (rows) {
    const byChain = new Map<string, OwnerReferralRow[]>();
    for (const row of rows) {
      const list = byChain.get(row.chain_id) ?? [];
      list.push(row);
      byChain.set(row.chain_id, list);
    }
    for (const [chainId, hops] of byChain) {
      hops.sort((a, b) => a.preference_order - b.preference_order);
      chains.push({ chainId, hops });
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Shop referrals</CardTitle>
        <CardDescription>
          Packages you have sent to shops, and what happened next. Your package goes to
          one shop at a time; every hop through your list is shown below, and you can
          stop a chain at any time. A repair counts as completed when you confirm it —
          the shop's report on its own is not the final word.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading referrals…
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shop referrals yet.</p>
        ) : (
          <ul className="space-y-4">
            {chains.map((chain) => {
              const activeHop = chain.hops.find(
                (h) => h.status === "sent" || h.status === "viewed"
              );
              return (
              <li key={chain.chainId} className="rounded-lg border border-border p-3 space-y-3">
                {chain.hops.length > 1 && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Referral chain — {chain.hops.length} hops so far
                    </p>
                    <ol className="space-y-0.5 text-sm text-muted-foreground">
                      {chain.hops.map((h, i) => (
                        <li key={h.id}>
                          Hop {i + 1}: {shopNames[h.shop_id] || "Repair shop"} —{" "}
                          {hopOutcome(h)} · {hopOutcomeTime(h)}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {chain.hops.map((r) => (
              <div key={r.id} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">
                    {shopNames[r.shop_id] || "Repair shop"}
                  </span>
                  {chain.hops.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      Hop {r.preference_order}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {STATUS_LABELS[r.status] || r.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Sent {new Date(r.sent_at).toLocaleDateString("en-US")}
                  </span>
                </div>

                {r.outcome_reported_at && (
                  <div className="text-sm space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Shop's outcome report
                    </p>
                    {r.outcome_found && <p>Found: {r.outcome_found}</p>}
                    {r.outcome_did && <p>Did: {r.outcome_did}</p>}
                    {r.outcome_cost != null && (
                      <p>Cost: ${Number(r.outcome_cost).toLocaleString()}</p>
                    )}
                  </div>
                )}

                {r.status === "completed" && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    {r.completion_confirmed_by === "owner"
                      ? "You confirmed this repair was completed."
                      : "Counted from the shop's report because no confirmation or dispute arrived within 14 days."}
                  </p>
                )}

                {r.founder_flagged && r.status === "outcome_reported" && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Flag className="h-4 w-4" />
                    Our team will follow up to confirm whether this repair was completed.
                  </p>
                )}

                {r.status === "cancelled" && (
                  <p className="text-sm text-muted-foreground">
                    You stopped this referral chain. The package was not sent to any
                    other shops on your list.
                  </p>
                )}

                {r.disputed_at && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    You disputed this outcome on{" "}
                    {new Date(r.disputed_at).toLocaleDateString("en-US")}. It is not counted
                    as a completed repair.
                  </p>
                )}

                {r.status === "outcome_reported" && !r.disputed_at && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void act(r.id, "confirm")}
                      disabled={busyId === r.id}
                    >
                      {busyId === r.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Confirm completion
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void act(r.id, "dispute")}
                      disabled={busyId === r.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Dispute
                    </Button>
                  </div>
                )}

                {r.status === "completed" && !r.disputed_at && r.outcome_reported_at && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void act(r.id, "dispute")}
                      disabled={busyId === r.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Dispute (within 30 days of the report)
                    </Button>
                  </div>
                )}

                {activeHop?.id === r.id && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void stopChain(r)}
                      disabled={busyId === r.id}
                    >
                      {busyId === r.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="mr-2 h-4 w-4" />
                      )}
                      Stop chain
                    </Button>
                  </div>
                )}
              </div>
                ))}
              </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
