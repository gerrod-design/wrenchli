import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ban, CheckCircle, Flag, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import TransportationPanel, { MobilityAttributeChips } from "@/components/TransportationPanel";
import {
  chainShowsHomeDirections,
  pickPanelShop,
  type MobilityShop,
} from "@/lib/transportationLinks";
import {
  COMPARISON_VERDICTS,
  INSPECTION_LIMITS,
  INSPECTION_LIMITS_INTRO,
  INSPECTION_SEVERITIES,
  KNOWN_ISSUE_MARKS,
  NOT_INSPECTED_REASONS,
  inspectionItemLabel,
  inspectionSection,
  knownIssuesHeader,
  notInspectedEntries,
  type ComparisonVerdictEntry,
  type InspectionFinding,
  type KnownIssueResult,
} from "@/config/inspection";
import {
  TRANSPORT_LIABILITY_LINE,
  TRANSPORT_SAFETY_LINE,
  TRANSPORT_STATUS_LABELS,
  chainExhausted,
  chainTransportCharge,
  chainTransportStatus,
} from "@/lib/referralTransport";

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
  outcome_transport_cost: number | null;
  transport_status: string | null;
  transport_charge_stated: number | null;
  referral_kind?: string;
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
  const inspection = row.referral_kind === "inspection";
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
      return inspection
        ? "Inspector filed the report — awaiting your confirmation"
        : "Shop reported the outcome — awaiting your confirmation";
    case "completed":
      return inspection ? "Inspection completed" : "Repair completed";
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

/**
 * Brief 3: add the pickup/delivery request after the shop has
 * accepted (immobility is sometimes discovered at drop-off time).
 * Calls the owner RPC request_referral_transport; the request then
 * rides on the package like a send-time request.
 */
function AddTransportRequest({
  referralId,
  onDone,
}: {
  referralId: string;
  onDone: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc(
        "request_referral_transport" as any,
        { p_referral_id: referralId, p_note: note.trim() } as any
      );
      if (error) throw error;
      const result = data as any;
      if (result && result.ok === false) {
        toast.error(
          `Could not add the pickup and delivery request (${result.reason || "unknown error"}).`
        );
      } else {
        toast.success("Pickup and delivery requested.");
        await onDone();
      }
    } catch (e) {
      console.error("Request referral transport failed:", e);
      toast.error("Failed to add the pickup and delivery request.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="space-y-1.5">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          This car can&rsquo;t be driven — request pickup and delivery
        </Button>
        <p className="text-xs text-muted-foreground">{TRANSPORT_LIABILITY_LINE}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-sm font-medium">Request pickup and delivery</p>
      <p className="text-xs text-muted-foreground">{TRANSPORT_LIABILITY_LINE}</p>
      <label className="block text-xs text-muted-foreground">
        Where the car sits, and anything the driver should know (optional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void submit()} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Request pickup and delivery
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface InspectionReportRow {
  id: string;
  referral_id: string;
  checklist_version: string;
  findings: InspectionFinding[];
  summary: string;
  safe_to_drive: boolean;
  recommended_next_step: string | null;
  photo_urls: string[] | null;
  onsite_eligible: boolean;
  onsite_performed: boolean;
  onsite_did: string | null;
  onsite_cost: number | null;
  filed_at: string;
  // Checklist v3: stage-1 filing time and the comparison
  // verdicts (likelihoods attached as issued, post-filing).
  findings_filed_at?: string | null;
  comparison_verdicts?: ComparisonVerdictEntry[] | null;
}

/**
 * Mobility Brief 2: the "Send for repair" conversion. One action
 * creates a repair referral package prefilled from the inspection
 * findings (diagnosis fields from the report, photos carried
 * over), then the owner picks the ordered shop list exactly as in
 * Phase 1 and the addressed repair send starts. The inspector
 * gets no automatic place in the chain.
 */
function SendForRepair({
  report,
  sourcePackage,
  onDone,
}: {
  report: InspectionReportRow;
  sourcePackage: any;
  onDone: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<{ id: string; name: string }[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [sentNote, setSentNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open || shops !== null) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("service_providers")
        .select("id, name")
        .eq("provider_kind", "shop")
        .order("name", { ascending: true });
      if (!cancelled) setShops((data as { id: string; name: string }[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, shops]);

  const send = async () => {
    if (selected.length === 0 || !sourcePackage) return;
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to send to a shop.");
        return;
      }
      const titleSeed =
        report.recommended_next_step?.trim() ||
        report.summary?.trim() ||
        "Repair follow-up to mobile inspection";
      const photos = Array.from(
        new Set([
          ...((report.photo_urls ?? []) as string[]),
          ...((sourcePackage.photo_urls ?? []) as string[]),
        ])
      );
      const { data: pkg, error: pkgError } = await supabase
        .from("referral_packages" as any)
        .insert({
          user_id: user.id,
          diagnosis_title:
            titleSeed.length > 120 ? `${titleSeed.slice(0, 117)}…` : titleSeed,
          diagnosis_code: sourcePackage.diagnosis_code ?? null,
          diagnosis_urgency: sourcePackage.diagnosis_urgency ?? null,
          diagnosis_details: {
            source: "inspection_conversion",
            inspection_report_id: report.id,
            checklist_version: report.checklist_version,
            findings: report.findings,
            summary: report.summary,
            safe_to_drive: report.safe_to_drive,
            recommended_next_step: report.recommended_next_step,
          },
          diy_feasibility: sourcePackage.diy_feasibility ?? null,
          vehicle_year: sourcePackage.vehicle_year ?? null,
          vehicle_make: sourcePackage.vehicle_make ?? null,
          vehicle_model: sourcePackage.vehicle_model ?? null,
          vehicle_trim: sourcePackage.vehicle_trim ?? null,
          vin: sourcePackage.vin ?? null,
          estimated_cost_low: sourcePackage.estimated_cost_low ?? null,
          estimated_cost_high: sourcePackage.estimated_cost_high ?? null,
          cost_estimate_details: sourcePackage.cost_estimate_details ?? {},
          metro_area: sourcePackage.metro_area ?? null,
          zip_code: sourcePackage.zip_code ?? null,
          photo_urls: photos,
          audio_clip_url: sourcePackage.audio_clip_url ?? null,
          video_frame_urls: sourcePackage.video_frame_urls ?? [],
          chat_summary: sourcePackage.chat_summary ?? null,
          customer_notes: sourcePackage.customer_notes ?? null,
        } as any)
        .select("id, token")
        .single();
      if (pkgError) throw pkgError;
      const { error: refError } = await supabase
        .from("shop_referrals" as any)
        .insert({
          package_id: (pkg as any).id,
          shop_id: selected[0],
          owner_user_id: user.id,
          chain_id: crypto.randomUUID(),
          shop_chain: selected,
          preference_order: 1,
          referral_kind: "repair",
        } as any);
      if (refError) throw refError;
      const firstName =
        shops?.find((sh) => sh.id === selected[0])?.name || "your first-choice shop";
      setSentNote(
        `Repair referral sent to ${firstName} first, prefilled from the inspection findings.`
      );
      toast.success("Repair referral sent.");
      await onDone();
    } catch (e) {
      console.error("Send for repair failed:", e);
      toast.error("Failed to create the repair referral.");
    } finally {
      setBusy(false);
    }
  };

  if (sentNote) {
    return <p className="text-sm text-muted-foreground">{sentNote}</p>;
  }
  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Send for repair
      </Button>
    );
  }
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-sm font-medium">Send these findings to a repair shop</p>
      <p className="text-xs text-muted-foreground">
        A new repair package is created from the inspection report — findings
        and photos included — and goes to one shop at a time, in the order you
        pick.
      </p>
      {shops === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading shops…
        </p>
      ) : shops.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No participating shops are available yet.
        </p>
      ) : (
        <>
          <ul className="space-y-1">
            {shops.map((shop) => {
              const idx = selected.indexOf(shop.id);
              const isSel = idx >= 0;
              return (
                <li key={shop.id}>
                  <button
                    type="button"
                    disabled={!isSel && selected.length >= 3}
                    onClick={() =>
                      setSelected((prev) =>
                        isSel
                          ? prev.filter((id) => id !== shop.id)
                          : [...prev, shop.id]
                      )
                    }
                    aria-pressed={isSel}
                    className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm ${
                      isSel ? "border-accent bg-accent/10" : "border-border"
                    } ${!isSel && selected.length >= 3 ? "opacity-50" : ""}`}
                  >
                    <span className="font-medium">{shop.name}</span>
                    {isSel && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Choice {idx + 1}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void send()} disabled={busy || selected.length === 0}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send to first-choice shop
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
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
  // Mobility Brief 1: full provider rows (address + mobility
  // attributes) for the per-hop chips and the transportation panel,
  // and each package's ZIP for the panel's directions-home variant.
  const [shopDetails, setShopDetails] = useState<Record<string, MobilityShop>>({});
  const [packageZips, setPackageZips] = useState<Record<string, string | null>>({});
  // Mobility Brief 3: each package's transport request (flag + the
  // owner's note), shown alongside the chain it rides on.
  const [packageTransport, setPackageTransport] = useState<
    Record<string, { requested: boolean; note: string | null }>
  >({});
  // Mobility Brief 2: inspection reports by referral id, and the
  // full package rows (the conversion action prefills a repair
  // package from the inspection findings).
  const [inspectionReports, setInspectionReports] = useState<
    Record<string, InspectionReportRow>
  >({});
  // Checklist v3: the known-issues block (with the inspector's
  // marks) per chain, read from the owner's own details rows.
  const [knownIssuesByChain, setKnownIssuesByChain] = useState<
    Record<string, KnownIssueResult[]>
  >({});
  const [packageFull, setPackageFull] = useState<Record<string, any>>({});
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
        "id, package_id, shop_id, chain_id, preference_order, escalated_from, status, sent_at, responded_at, window_expires_at, outcome_found, outcome_did, outcome_cost, outcome_transport_cost, transport_status, transport_charge_stated, referral_kind, outcome_reported_at, completion_confirmed_by, completion_confirmed_at, founder_flagged, disputed_at, created_at, updated_at"
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
        .select(
          "id, name, address, city, state, zip_code, lat, lng, offers_loaner, offers_shuttle, offers_pickup_delivery, mobility_notes"
        )
        .in("id", shopIds);
      if (shops) {
        setShopNames(
          Object.fromEntries((shops as { id: string; name: string }[]).map((s) => [s.id, s.name]))
        );
        setShopDetails(
          Object.fromEntries((shops as MobilityShop[]).map((s) => [s.id, s]))
        );
      }
    }

    // Mobility Brief 2: filed inspection reports for these
    // referrals (owner-readable under the report table's RLS).
    const referralIds = referrals.map((r) => r.id);
    if (referralIds.length > 0) {
      const { data: reports } = await supabase
        .from("inspection_reports" as any)
        .select(
          "id, referral_id, checklist_version, findings, summary, safe_to_drive, recommended_next_step, photo_urls, onsite_eligible, onsite_performed, onsite_did, onsite_cost, filed_at, findings_filed_at, comparison_verdicts"
        )
        .in("referral_id", referralIds);
      if (reports) {
        setInspectionReports(
          Object.fromEntries(
            (reports as any[]).map((rep) => [rep.referral_id, rep])
          )
        );
      }
    }

    // Checklist v3: the known-issues blocks for these chains
    // (the owner's own rows; the filed marks ride on them).
    const chainIds = Array.from(
      new Set(
        referrals
          .filter((r) => r.referral_kind === "inspection")
          .map((r) => r.chain_id)
      )
    );
    if (chainIds.length > 0) {
      const { data: details } = await supabase
        .from("inspection_details" as any)
        .select("chain_id, known_issues")
        .in("chain_id", chainIds);
      if (details) {
        setKnownIssuesByChain(
          Object.fromEntries(
            (details as any[])
              .filter((d) => Array.isArray(d.known_issues))
              .map((d) => [d.chain_id, d.known_issues])
          )
        );
      }
    }

    const packageIds = Array.from(new Set(referrals.map((r) => r.package_id)));
    if (packageIds.length > 0) {
      const { data: packages } = await supabase
        .from("referral_packages")
        .select("id, zip_code, transport_requested, transport_note, vehicle_year, vehicle_make, vehicle_model, vehicle_trim, vin, diagnosis_title, diagnosis_code, diagnosis_urgency, diagnosis_details, diy_feasibility, estimated_cost_low, estimated_cost_high, cost_estimate_details, metro_area, photo_urls, audio_clip_url, video_frame_urls, chat_summary, customer_notes")
        .in("id", packageIds);
      if (packages) {
        setPackageFull(
          Object.fromEntries(packages.map((pkg: any) => [pkg.id, pkg]))
        );
      }
      if (packages) {
        setPackageZips(
          Object.fromEntries(packages.map((p) => [p.id, p.zip_code]))
        );
        setPackageTransport(
          Object.fromEntries(
            packages.map((p) => [
              p.id,
              {
                requested: p.transport_requested === true,
                note: p.transport_note ?? null,
              },
            ])
          )
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
    // Brief 3: stopping the chain cancels the transport request
    // with it; say so before the owner confirms.
    const transportSentence = packageTransport[referral.package_id]?.requested
      ? " This also cancels your pickup and delivery request."
      : "";
    const confirmed = window.confirm(
      `Stop this referral chain? The package will not stay with ${shop} and will not be sent to any other shops on your list.${transportSentence}`
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
              // Mobility Brief 1: the chain's transportation panel
              // points at the accepted hop's shop (falling back per
              // pickPanelShop) and gains the directions-home variant
              // once an outcome is reported or completed.
              const panelShop = pickPanelShop(chain.hops, shopDetails);
              const showHome = chainShowsHomeDirections(chain.hops);
              const homeZip = packageZips[chain.hops[0].package_id] ?? null;
              // Mobility Brief 3: the chain's transport thread. The
              // request lives on the package; the status and the
              // shop's stated charge come from the hop that carries
              // them (accepted / outcome / completed first).
              const transport = packageTransport[chain.hops[0].package_id];
              const transportRequested = transport?.requested === true;
              const tStatus = chainTransportStatus(chain.hops, transportRequested);
              const tCharge = transportRequested
                ? chainTransportCharge(chain.hops)
                : null;
              const exhausted = transportRequested && chainExhausted(chain.hops);
              const acceptedHop = chain.hops.find((h) => h.status === "accepted");
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
                    {shopNames[r.shop_id] ||
                      (r.referral_kind === "inspection"
                        ? "Mobile inspector"
                        : "Repair shop")}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {r.referral_kind === "inspection" ? "Inspection" : "Repair"}
                  </Badge>
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

                {shopDetails[r.shop_id] && (
                  <MobilityAttributeChips shop={shopDetails[r.shop_id]} />
                )}
                {shopDetails[r.shop_id]?.mobility_notes?.trim() && (
                  <p className="text-xs text-muted-foreground">
                    {shopDetails[r.shop_id].mobility_notes}
                  </p>
                )}

                {r.outcome_reported_at && (
                  <div className="text-sm space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Shop's outcome report
                    </p>
                    {r.outcome_found && <p>Found: {r.outcome_found}</p>}
                    {r.outcome_did && <p>Did: {r.outcome_did}</p>}
                    {r.outcome_transport_cost != null ? (
                      <>
                        {r.outcome_cost != null && (
                          <p>Repair cost: ${Number(r.outcome_cost).toLocaleString()}</p>
                        )}
                        <p>
                          Pickup/delivery: $
                          {Number(r.outcome_transport_cost).toLocaleString()} (charge
                          set by the shop)
                        </p>
                        {r.outcome_cost != null && (
                          <p className="font-medium">
                            Total: $
                            {(
                              Number(r.outcome_cost) +
                              Number(r.outcome_transport_cost)
                            ).toLocaleString()}
                          </p>
                        )}
                      </>
                    ) : (
                      r.outcome_cost != null && (
                        <p>Cost: ${Number(r.outcome_cost).toLocaleString()}</p>
                      )
                    )}
                  </div>
                )}

                {inspectionReports[r.id] && (
                  <div className="text-sm space-y-1.5 rounded-md border border-border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Inspection report — observed condition for this vehicle
                    </p>
                    <p>{inspectionReports[r.id].summary}</p>
                    <p>
                      Safe to drive:{" "}
                      {inspectionReports[r.id].safe_to_drive ? "Yes" : "No"}
                    </p>
                    {inspectionReports[r.id].recommended_next_step && (
                      <p>
                        Recommended next step:{" "}
                        {inspectionReports[r.id].recommended_next_step}
                      </p>
                    )}
                    {Array.isArray(inspectionReports[r.id].findings) &&
                      inspectionReports[r.id].findings.length > 0 && (
                        <ul className="space-y-0.5">
                          {inspectionReports[r.id].findings.map((f, i) => (
                            <li key={i}>
                              <span className="font-medium">
                                {inspectionSection(f.system)?.label ?? f.system}
                              </span>
                              {": "}
                              {INSPECTION_SEVERITIES.find(
                                (sev) => sev.value === f.severity
                              )?.label ?? f.severity}
                              {f.note ? ` — ${f.note}` : ""}
                              {Array.isArray(f.items) &&
                                f.items.some(
                                  (it) =>
                                    it.status !== "checked_ok" ||
                                    it.measurement != null,
                                ) && (
                                  <ul className="pl-4 text-xs text-muted-foreground space-y-0.5">
                                    {f.items
                                      .filter(
                                        (it) =>
                                          it.status !== "checked_ok" ||
                                          it.measurement != null,
                                      )
                                      .map((it, j) => (
                                        <li key={j}>
                                          {inspectionItemLabel(it.item) ?? it.item}
                                          {" — "}
                                          {it.status === "not_inspected"
                                            ? `Not inspected (${
                                                NOT_INSPECTED_REASONS.find(
                                                  (x) =>
                                                    x.value ===
                                                    it.notInspectedReason,
                                                )?.label ?? "no reason given"
                                              })`
                                            : it.status === "concern"
                                              ? `Concern: ${
                                                  INSPECTION_SEVERITIES.find(
                                                    (s) =>
                                                      s.value === it.severity,
                                                  )?.label ??
                                                  it.severity ??
                                                  ""
                                                }`
                                              : "Checked, fine"}
                                          {it.measurement
                                            ? ` · ${it.measurement}`
                                            : ""}
                                          {it.note ? ` · ${it.note}` : ""}
                                        </li>
                                      ))}
                                  </ul>
                                )}
                            </li>
                          ))}
                        </ul>
                      )}
                    {notInspectedEntries(inspectionReports[r.id].findings ?? [])
                      .length > 0 && (
                      <div>
                        <p className="font-medium">Not inspected on this visit</p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                          {notInspectedEntries(
                            inspectionReports[r.id].findings ?? [],
                          ).map((entry, i) => (
                            <li key={i}>
                              {entry.section}: {entry.item} ({entry.reason})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(knownIssuesByChain[r.chain_id] ?? []).some(
                      (c) => c.mark != null,
                    ) && (
                      <div>
                        <p className="font-medium">
                          {knownIssuesHeader(knownIssuesByChain[r.chain_id] ?? [])}
                        </p>
                        <ul className="space-y-0.5">
                          {(knownIssuesByChain[r.chain_id] ?? []).map((check) => (
                            <li key={check.id}>
                              <span className="font-medium">{check.title}</span>
                              {": "}
                              {check.mark === "no_evidence_found"
                                ? "No evidence of this problem was found on this visit"
                                : (KNOWN_ISSUE_MARKS.find(
                                    (m) => m.value === check.mark,
                                  )?.label ?? check.mark)}
                              {check.evidenceNote
                                ? ` — ${check.evidenceNote}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(
                      inspectionReports[r.id].comparison_verdicts,
                    ) &&
                      (inspectionReports[r.id].comparison_verdicts?.length ??
                        0) > 0 && (
                        <div>
                          <p className="font-medium">
                            Pre-assessment comparison — what was suspected, what
                            the visit found
                          </p>
                          <ul className="space-y-0.5">
                            {inspectionReports[r.id].comparison_verdicts!.map(
                              (v, i) => (
                                <li key={i}>
                                  <span className="font-medium">{v.name}</span>
                                  {": "}
                                  {COMPARISON_VERDICTS.find(
                                    (x) => x.value === v.verdict,
                                  )?.label ?? v.verdict}
                                  {v.likelihood != null &&
                                    ` · the pre-assessment rated this ${Math.round(v.likelihood * 100)}% likely`}
                                  {v.evidenceNote
                                    ? ` — ${v.evidenceNote}`
                                    : ""}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    {inspectionReports[r.id].onsite_performed && (
                      <p>
                        Done on site: {inspectionReports[r.id].onsite_did || "Onsite work"}
                        {inspectionReports[r.id].onsite_cost != null &&
                          ` — $${Number(inspectionReports[r.id].onsite_cost).toLocaleString()}`}
                      </p>
                    )}
                    {(inspectionReports[r.id].photo_urls?.length ?? 0) > 0 && (
                      <p>
                        {inspectionReports[r.id].photo_urls!.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mr-2 text-accent hover:underline"
                          >
                            Photo {i + 1}
                          </a>
                        ))}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Filed{" "}
                      {new Date(inspectionReports[r.id].filed_at).toLocaleDateString("en-US")}{" "}
                      · Checklist {inspectionReports[r.id].checklist_version}
                    </p>
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer font-medium text-foreground">
                        What this inspection cannot tell you
                      </summary>
                      <p className="mt-1">{INSPECTION_LIMITS_INTRO}</p>
                      <ul className="list-disc pl-5 space-y-0.5 mt-1">
                        {INSPECTION_LIMITS.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </details>
                    <SendForRepair
                      report={inspectionReports[r.id]}
                      sourcePackage={packageFull[r.package_id]}
                      onDone={load}
                    />
                  </div>
                )}

                {r.status === "completed" && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    {r.completion_confirmed_by === "owner"
                      ? r.referral_kind === "inspection"
                        ? "You confirmed this inspection took place."
                        : "You confirmed this repair was completed."
                      : r.referral_kind === "inspection"
                        ? "Counted from the inspector's report because no confirmation or dispute arrived within 14 days."
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
                    as a completed {r.referral_kind === "inspection" ? "inspection" : "repair"}.
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
                {transportRequested && (
                  <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Pickup and delivery
                    </p>
                    {tStatus && (
                      <p className="text-sm font-medium">
                        {TRANSPORT_STATUS_LABELS[tStatus]}
                      </p>
                    )}
                    {transport?.note && (
                      <p className="text-sm text-muted-foreground">
                        Your note for the shop: {transport.note}
                      </p>
                    )}
                    {tCharge != null && (
                      <p className="text-sm">
                        Pickup/delivery charge set by the shop: $
                        {Number(tCharge).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {TRANSPORT_LIABILITY_LINE}
                    </p>
                    {tStatus === "arranged" && (
                      <p className="text-xs text-muted-foreground">
                        {TRANSPORT_SAFETY_LINE}
                      </p>
                    )}
                    {tStatus === "unable" && (
                      <p className="text-sm">
                        The shop could not arrange pickup and delivery. Your repair
                        referral is still in place.
                      </p>
                    )}
                    {exhausted && (
                      <p className="text-sm">
                        Your pickup and delivery request could not be fulfilled by
                        the shops on your list. You can send your assessment to
                        another shop — shops that offer pickup and delivery are
                        shown first in the shop list — or arrange your own tow.
                      </p>
                    )}
                  </div>
                )}
                {!transportRequested && acceptedHop && (
                  <AddTransportRequest referralId={acceptedHop.id} onDone={load} />
                )}
                <TransportationPanel
                  shop={panelShop}
                  homeZip={homeZip}
                  showHomeDirections={showHome}
                />
              </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
