import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, ShieldCheck, Ban, Play, Eye } from "lucide-react";
import FinancingPartnerReport from "@/components/FinancingPartnerReport";
import {
  fetchSimulationFinancingOptions,
  fetchPublicFinancingPartners,
  createFinancingReferral,
  reportFinancingOutcome,
  buildPartnerPayload,
  partnerTermsLine,
  PARTNER_TYPE_LABELS,
  type FinancingOutcomeKind,
  type SimulationFinancingOption,
} from "@/lib/financing";

/**
 * /admin/financing-simulation — the mock provider harness.
 *
 * Admin-only (route is behind ProtectedRoute; every data call is a
 * has_role-gated SQL function). Plugs MOCK partners into the real
 * journey code paths — options predicate, ceiling filter, token
 * link-out, outcome interface, reporting — and plays the partner's
 * side, so nothing external is ever contacted. Every surface here
 * is badged SIMULATION. Mock partners can never appear on the
 * public /financing page; the "public view" check below proves it
 * live against the same predicate the public page uses.
 */

interface SimSession {
  partnerName: string;
  token: string;
  partnerUrl: string;
  payloadJson: string;
  outcomes: string[];
}

const OUTCOME_BUTTONS: { kind: FinancingOutcomeKind; label: string }[] = [
  { kind: "applied", label: "Applied" },
  { kind: "approved", label: "Approved" },
  { kind: "declined", label: "Declined" },
  { kind: "funded", label: "Funded" },
  { kind: "repair_completed", label: "Repair completed" },
];

function SimulationBadge() {
  return (
    <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500 gap-1">
      <FlaskConical className="h-3 w-3" /> SIMULATION
    </Badge>
  );
}

export default function FinancingSimulation() {
  const [amountDollars, setAmountDollars] = useState(850);
  const [category, setCategory] = useState("Brake repair");
  const [options, setOptions] = useState<SimulationFinancingOption[] | null>(null);
  const [publicCount, setPublicCount] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SimSession[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amountCents = Math.round(amountDollars * 100);

  const addLog = useCallback((line: string) => {
    setLog((prev) => [...prev, line]);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [sim, pub] = await Promise.all([
        fetchSimulationFinancingOptions(amountCents),
        fetchPublicFinancingPartners(amountCents),
      ]);
      setOptions(sim);
      setPublicCount(pub.length);
    } catch (e: any) {
      setError(
        e?.message?.includes("admin")
          ? "The simulation harness is restricted to admins."
          : "Could not load simulation options. Seed the mock partners first (scripts/seed-mock-financing-partners.sql).",
      );
    }
  }, [amountCents]);

  useEffect(() => {
    void load();
  }, [load]);

  const startApplication = async (option: SimulationFinancingOption) => {
    setBusy(true);
    try {
      const referral = await createFinancingReferral({
        partnerId: option.id,
        amountCents,
        repairCategory: category,
        simulation: true,
      });
      const payload = buildPartnerPayload({
        token: referral.token,
        amountCents,
        repairCategory: category,
        customer: null,
      });
      setSessions((prev) => [
        ...prev,
        {
          partnerName: option.name,
          token: referral.token,
          partnerUrl: referral.partner_url,
          payloadJson: JSON.stringify(payload, null, 2),
          outcomes: [],
        },
      ]);
      addLog(
        `Link-out to ${option.name}: referral ${referral.token} created; amount band ${referral.amount_band}; partner receives token + band + category only.`,
      );
    } catch (e: any) {
      setError(e?.message ?? "Could not start the simulated application.");
    } finally {
      setBusy(false);
    }
  };

  const sendOutcome = async (session: SimSession, kind: FinancingOutcomeKind) => {
    setBusy(true);
    try {
      const result = await reportFinancingOutcome(session.token, kind);
      setSessions((prev) =>
        prev.map((s) =>
          s.token === session.token ? { ...s, outcomes: [...s.outcomes, kind] } : s,
        ),
      );
      addLog(
        `${session.partnerName} reported "${kind}" against token ${session.token} (recorded source: ${result.source}).`,
      );
    } catch (e: any) {
      setError(e?.message ?? "Could not record the simulated outcome.");
    } finally {
      setBusy(false);
    }
  };

  const qualifying = (options ?? []).filter((o) => o.qualifies);
  const excluded = (options ?? []).filter((o) => !o.qualifies);

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Financing Simulation — Wrenchli Admin"
        description="Mock financing provider simulation harness."
        path="/admin/financing-simulation"
      />
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">Financing partner simulation</h1>
            <SimulationBadge />
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <FlaskConical className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-sm">
              <span className="font-semibold">This whole page is a simulation.</span>{" "}
              Every partner named here is a mock. Nothing on this page is a real lender, a
              real application, or a real offer, and no external site is ever contacted —
              the harness plays the partner's side. Mock partners never appear on the
              public <Link to="/financing" className="underline">financing page</Link>.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simulated estimate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label htmlFor="sim-amount">Repair estimate ($)</Label>
                <Input
                  id="sim-amount"
                  type="number"
                  min={50}
                  step={10}
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(Number(e.target.value) || 0)}
                  className="w-36"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sim-category">Repair category</Label>
                <Input
                  id="sim-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-52"
                />
              </div>
              <Button variant="outline" onClick={() => void load()}>
                Reload options
              </Button>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                Public view right now:{" "}
                <span className="font-semibold text-foreground">
                  {publicCount === null ? "…" : `${publicCount} partner(s) shown`}
                </span>{" "}
                (mock partners are excluded from the public page by the data layer)
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              Options the platform presents <SimulationBadge />
            </h2>
            {options === null ? (
              <p className="text-sm text-muted-foreground">Loading mock partners…</p>
            ) : qualifying.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No mock partner qualifies for this amount under the ceiling rule.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {qualifying.map((option) => (
                  <Card key={option.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{option.name}</CardTitle>
                        <Badge variant="secondary">
                          {PARTNER_TYPE_LABELS[option.partner_type]}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{partnerTermsLine(option)}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        In simulation, "apply" creates a real referral record and hands
                        you the partner's side of the exchange below — no external site
                        opens.
                      </p>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void startApplication(option)}
                      >
                        <Play className="h-4 w-4 mr-1" /> Simulate application
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {excluded.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                Filtered out by the ceiling rule <SimulationBadge />
              </h2>
              {excluded.map((option) => (
                <div
                  key={option.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4"
                >
                  <Ban className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
                  <p className="text-sm">
                    <span className="font-semibold">{option.name}</span> (
                    {PARTNER_TYPE_LABELS[option.partner_type]}) —{" "}
                    {option.exclusion_reason}. It is not presented as an option and
                    cannot be applied to, in simulation or in public.
                  </p>
                </div>
              ))}
            </div>
          )}

          {sessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                Partner side of the exchange <SimulationBadge />
              </h2>
              {sessions.map((session) => (
                <Card key={session.token}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {session.partnerName} received this referral
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                      This payload is everything that leaves Wrenchli: a referral token,
                      the repair cost range, and the repair category. No name, no email,
                      no phone, no address.
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                      {session.payloadJson}
                    </pre>
                    <p className="break-all text-xs text-muted-foreground">
                      Simulated partner link: {session.partnerUrl}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {OUTCOME_BUTTONS.map(({ kind, label }) => (
                        <Button
                          key={kind}
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void sendOutcome(session, kind)}
                        >
                          Report: {label}
                        </Button>
                      ))}
                    </div>
                    {session.outcomes.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Outcomes reported: {session.outcomes.join(" → ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {log.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Simulation run log</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {log.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <FinancingPartnerReport />
        </div>
      </section>
    </main>
  );
}
