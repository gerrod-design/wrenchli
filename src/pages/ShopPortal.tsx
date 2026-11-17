import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Wrench, LogOut, Phone, Mail, User, Clock, CheckCircle2 } from "lucide-react";

// Shop portal v1 (2026-11-17). Built for the person at the front
// desk: what arrived, what is being asked, what happens when you
// accept, in plain words and as few clicks as possible.
//
// Data comes only from the shop RPCs (get_shop_inbox,
// get_shop_job, respond_to_shop_referral, submit_shop_outcome),
// which return Stage 1 package fields. The owner's name and
// phone are included only after the shop accepts a referral.

type InboxReferral = {
  id: string;
  status: string;
  sent_at: string;
  responded_at: string | null;
  window_expires_at: string | null;
  outcome_reported_at: string | null;
  completion_confirmed_by: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  diagnosis_title: string | null;
  diagnosis_urgency: string | null;
  estimated_cost_low: number | null;
  estimated_cost_high: number | null;
  metro_area: string | null;
};

type Job = {
  referral: {
    id: string;
    status: string;
    sent_at: string;
    responded_at: string | null;
    window_expires_at: string | null;
    outcome_found: string | null;
    outcome_did: string | null;
    outcome_cost: number | null;
    outcome_reported_at: string | null;
    completion_confirmed_by: string | null;
  };
  package: {
    vehicle_year: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_trim: string | null;
    diagnosis_title: string | null;
    diagnosis_urgency: string | null;
    diagnosis_details: any;
    chat_summary: string | null;
    estimated_cost_low: number | null;
    estimated_cost_high: number | null;
    cost_estimate_details: any;
    metro_area: string | null;
    photo_urls: string[] | null;
    customer_notes: string | null;
  };
  owner_contact: { name: string | null; phone: string | null; email: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Needs your answer",
  viewed: "Needs your answer",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Answer window passed",
  outcome_reported: "Report filed",
  completed: "Completed",
  not_completed: "Not completed",
  cancelled: "Owner stopped this one",
};

function vehicleName(r: { vehicle_year: string | null; vehicle_make: string | null; vehicle_model: string | null; vehicle_trim?: string | null }) {
  return [r.vehicle_year, r.vehicle_make, r.vehicle_model, r.vehicle_trim].filter(Boolean).join(" ") || "Vehicle";
}

function costRange(low: number | null, high: number | null) {
  if (low != null && high != null) return `$${Number(low).toLocaleString()} to $${Number(high).toLocaleString()}`;
  if (low != null) return `From $${Number(low).toLocaleString()}`;
  if (high != null) return `Up to $${Number(high).toLocaleString()}`;
  return "No cost range on this one";
}

function answerBy(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function sentWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
    ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function causesFrom(details: any): { label: string; likelihood: string | null }[] {
  const raw = details?.likely_causes ?? details?.possible_causes ?? details?.causes ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((c: any) => {
    if (typeof c === "string") return { label: c, likelihood: null };
    const pct = c.likelihood != null ? `${Math.round(Number(c.likelihood))}%` : (c.probability != null ? `${Math.round(Number(c.probability))}%` : null);
    return { label: c.cause ?? c.name ?? c.title ?? String(c), likelihood: pct };
  });
}

function symptomText(job: Job): string | null {
  const d = job.package.diagnosis_details;
  return d?.symptom_summary ?? d?.symptoms ?? job.package.chat_summary ?? job.package.customer_notes ?? null;
}

const OUTCOME_CHOICES = [
  { value: "fixed", label: "We fixed it" },
  { value: "still_same", label: "The problem is still there" },
  { value: "worse", label: "It got worse" },
  { value: "no_show", label: "The customer never showed up" },
  { value: "declined_after_evaluation", label: "The customer decided not to go ahead after our evaluation" },
] as const;

export default function ShopPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [noShop, setNoShop] = useState(false);
  const [shop, setShop] = useState<{ name: string; city: string | null; state: string | null; phone: string | null } | null>(null);
  const [counts, setCounts] = useState<{ received: number; accepted: number; completed: number; owner_confirmed: number } | null>(null);
  const [referrals, setReferrals] = useState<InboxReferral[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Outcome form state
  const [outcome, setOutcome] = useState<string>("fixed");
  const [found, setFound] = useState("");
  const [did, setDid] = useState("");
  const [cost, setCost] = useState("");

  const loadInbox = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_shop_inbox" as any);
    if (error) {
      toast.error("Could not load your referrals. Try refreshing the page.");
      return;
    }
    const res = data as any;
    if (!res?.ok) {
      if (res?.reason === "no_shop_account") setNoShop(true);
      return;
    }
    setShop(res.shop);
    setCounts(res.counts);
    setReferrals(res.referrals ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/shop-login");
        return;
      }
      await loadInbox();
      setLoading(false);
    })();
  }, [navigate, loadInbox]);

  const openJob = async (id: string) => {
    setJobLoading(true);
    setOutcome("fixed");
    setFound("");
    setDid("");
    setCost("");
    const { data, error } = await supabase.rpc("get_shop_job" as any, { p_referral_id: id });
    setJobLoading(false);
    if (error) {
      toast.error("Could not open that referral.");
      return;
    }
    const res = data as any;
    if (!res?.ok) {
      toast.error("That referral is not on your shop's list.");
      return;
    }
    setJob({ referral: res.referral, package: res.package, owner_contact: res.owner_contact });
  };

  const respond = async (accept: boolean) => {
    if (!job) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("respond_to_shop_referral" as any, {
      p_referral_id: job.referral.id,
      p_accept: accept,
    });
    setBusy(false);
    if (error) {
      toast.error("That did not go through. Try again.");
      return;
    }
    const res = data as any;
    if (!res?.ok) {
      toast.error("This referral can no longer be answered.");
      return;
    }
    toast.success(accept ? "Accepted. The owner now sees your shop's name and phone number." : "Declined. The owner will be offered the next shop on their list.");
    await loadInbox();
    await openJob(job.referral.id);
  };

  const fileOutcome = async () => {
    if (!job) return;
    const noWork = outcome === "no_show" || outcome === "declined_after_evaluation";
    if (!noWork) {
      if (!found.trim() || !did.trim()) {
        toast.error("Please fill in what you found and what you did.");
        return;
      }
      if (!cost || Number(cost) < 0 || Number.isNaN(Number(cost))) {
        toast.error("Please enter what the customer paid.");
        return;
      }
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_shop_outcome" as any, {
      p_referral_id: job.referral.id,
      p_found: found.trim() || null,
      p_did: did.trim() || null,
      p_cost: cost ? Number(cost) : null,
      p_repair_status: outcome,
    });
    setBusy(false);
    if (error) {
      toast.error("The report did not go through. Try again.");
      return;
    }
    const res = data as any;
    if (!res?.ok) {
      toast.error("The report did not go through. It may be past the reporting window.");
      return;
    }
    toast.success("Report sent. Thank you.");
    await loadInbox();
    await openJob(job.referral.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/shop-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="animate-pulse text-muted-foreground">Loading your shop page...</div>
      </div>
    );
  }

  if (noShop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
        <div className="text-center max-w-md">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">This sign-in is not linked to a shop yet</h2>
          <p className="text-muted-foreground mb-6">
            Wrenchli links your sign-in to your shop when your shop joins the pilot.
            If your shop is part of the pilot, contact us and we will get it set up.
          </p>
          <Button onClick={() => navigate("/contact")} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Contact Us
          </Button>
        </div>
      </div>
    );
  }

  const status = job?.referral.status;
  const canAnswer = status === "sent" || status === "viewed";
  const canReport = status === "accepted";
  const causes = job ? causesFrom(job.package.diagnosis_details) : [];
  const symptoms = job ? symptomText(job) : null;
  const noWork = outcome === "no_show" || outcome === "declined_after_evaluation";

  return (
    <>
      <SEO title="Shop Page" description="Referrals Wrenchli has sent your shop, and the outcome reports you file." path="/shop-portal" />
      <div className="min-h-screen bg-secondary">
        <header className="bg-card border-b border-border px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-accent rounded-lg p-2">
                <Wrench className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">{shop?.name || "Your shop"}</h1>
                <p className="text-xs text-muted-foreground">
                  {[shop?.city, shop?.state].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-4 pt-6 space-y-6">
          {counts && (
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { n: counts.received, label: "Referrals received" },
                { n: counts.accepted, label: "Accepted" },
                { n: counts.completed, label: "Completed" },
                { n: counts.owner_confirmed, label: "Owner confirmed" },
              ].map((c) => (
                <div key={c.label} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-foreground">{c.n}</div>
                  <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
                </div>
              ))}
            </section>
          )}

          <section className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-bold text-foreground mb-1">How the fees work</h2>
            <p className="text-sm text-muted-foreground">
              Referrals are free to receive and free to decline. Your first five completed repairs are free.
              After that, the fee is $50 per completed repair, charged only when the owner confirms the work
              was done, and fees in any month never go over $299. Nothing is charged through this page.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <section className="lg:col-span-2 space-y-3">
              <h2 className="font-bold text-foreground">Referrals sent to your shop</h2>
              {referrals.length === 0 && (
                <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">
                  Nothing here yet. When a car owner sends your shop a referral, it shows up on this list.
                </p>
              )}
              {referrals.map((r) => (
                <button
                  key={r.id}
                  onClick={() => openJob(r.id)}
                  className={`w-full text-left bg-card border rounded-xl p-4 space-y-1 hover:border-accent transition-colors ${job?.referral.id === r.id ? "border-accent" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">{vehicleName(r)}</span>
                    <span className="text-xs font-medium bg-secondary border border-border rounded-full px-2 py-0.5 text-muted-foreground whitespace-nowrap">
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  <div className="text-sm text-foreground">{r.diagnosis_title || "Owner's concern"}</div>
                  <div className="text-sm text-muted-foreground">{costRange(r.estimated_cost_low, r.estimated_cost_high)}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sent {sentWhen(r.sent_at)}
                    {r.window_expires_at && (r.status === "sent" || r.status === "viewed") && (
                      <span> · Answer by {answerBy(r.window_expires_at)}, end of day</span>
                    )}
                  </div>
                </button>
              ))}
            </section>

            <section className="lg:col-span-3">
              {jobLoading && (
                <div className="bg-card border border-border rounded-xl p-6 text-muted-foreground">Opening...</div>
              )}
              {!jobLoading && !job && (
                <div className="bg-card border border-border rounded-xl p-6 text-muted-foreground">
                  Pick a referral on the left to see the full details and answer it.
                </div>
              )}
              {!jobLoading && job && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xl font-bold text-foreground">{vehicleName(job.package)}</h2>
                      <span className="text-xs font-medium bg-secondary border border-border rounded-full px-2 py-0.5 text-muted-foreground whitespace-nowrap">
                        {STATUS_LABELS[job.referral.status] ?? job.referral.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.package.diagnosis_title}
                      {job.package.metro_area ? ` · ${job.package.metro_area} area` : ""}
                    </p>
                  </div>

                  {symptoms && (
                    <div>
                      <h3 className="font-bold text-foreground mb-1">What the owner told us</h3>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{symptoms}</p>
                    </div>
                  )}

                  {causes.length > 0 && (
                    <div>
                      <h3 className="font-bold text-foreground mb-1">What is likely wrong</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        This is Wrenchli's early read, from what the owner described. Your own evaluation decides the job.
                      </p>
                      <ul className="space-y-1">
                        {causes.map((c, i) => (
                          <li key={i} className="text-sm text-foreground flex justify-between gap-3">
                            <span>{i + 1}. {c.label}</span>
                            {c.likelihood && <span className="text-muted-foreground">{c.likelihood}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Fair cost range</div>
                      <div className="font-bold text-foreground">{costRange(job.package.estimated_cost_low, job.package.estimated_cost_high)}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">How soon it needs attention</div>
                      <div className="font-bold text-foreground">{job.package.diagnosis_urgency || "Not stated"}</div>
                    </div>
                  </div>

                  {job.package.photo_urls && job.package.photo_urls.length > 0 && (
                    <div>
                      <h3 className="font-bold text-foreground mb-2">Photos from the owner</h3>
                      <div className="flex gap-2 flex-wrap">
                        {job.package.photo_urls.map((u, i) => (
                          <img key={i} src={u} alt={`Owner photo ${i + 1}`} className="w-28 h-28 object-cover rounded-lg border border-border" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <h3 className="font-bold text-foreground mb-1">The owner</h3>
                    {job.owner_contact && (job.owner_contact.name || job.owner_contact.phone || job.owner_contact.email) ? (
                      <div className="text-sm text-foreground space-y-1">
                        {job.owner_contact.name && <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{job.owner_contact.name}</div>}
                        {job.owner_contact.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{job.owner_contact.phone}</div>}
                        {job.owner_contact.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{job.owner_contact.email}</div>}
                      </div>
                    ) : status === "accepted" || status === "outcome_reported" || status === "completed" ? (
                      <p className="text-sm text-muted-foreground">
                        The owner has your shop's name and phone number and contacts you directly.
                        Wrenchli does not pass the owner's contact details on this referral.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        The owner's name and phone number appear here after you accept.
                        Before that, you see the vehicle and the problem only.
                      </p>
                    )}
                  </div>

                  {canAnswer && (
                    <div className="border-t border-border pt-4 space-y-3">
                      <p className="text-sm text-foreground">
                        <strong>Accepting means you will take this job.</strong> The owner then sees your shop's
                        name and phone number and contacts you to book. Declining sends the owner to the next
                        shop on their list.
                      </p>
                      {job.referral.window_expires_at && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Please answer by {answerBy(job.referral.window_expires_at)}, end of day.
                        </p>
                      )}
                      <div className="flex gap-3">
                        <Button onClick={() => respond(true)} disabled={busy} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-12 text-base">
                          Accept this job
                        </Button>
                        <Button onClick={() => respond(false)} disabled={busy} variant="outline" className="flex-1 h-12 text-base">
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}

                  {canReport && (
                    <div className="border-t border-border pt-4 space-y-4">
                      <div>
                        <h3 className="font-bold text-foreground">Report how this job turned out</h3>
                        <p className="text-sm text-muted-foreground">Two minutes. This report is the one thing the pilot asks of your shop.</p>
                      </div>
                      <div className="space-y-2">
                        {OUTCOME_CHOICES.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setOutcome(c.value)}
                            className={`w-full text-left border rounded-lg px-4 py-3 text-sm font-medium transition-colors ${outcome === c.value ? "border-accent bg-accent/10 text-foreground" : "border-border text-foreground hover:border-accent"}`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                      {!noWork && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">What did you find?</label>
                            <Textarea value={found} onChange={(e) => setFound(e.target.value)} rows={2} placeholder="What was actually wrong with the car" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">What did you do?</label>
                            <Textarea value={did} onChange={(e) => setDid(e.target.value)} rows={2} placeholder="The work you carried out" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">What did the customer pay? ($)</label>
                            <Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
                          </div>
                        </>
                      )}
                      {noWork && (
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Anything worth noting? (optional)</label>
                          <Textarea value={found} onChange={(e) => setFound(e.target.value)} rows={2} placeholder="Optional note" />
                        </div>
                      )}
                      <Button onClick={fileOutcome} disabled={busy} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-12 text-base">
                        Send the report
                      </Button>
                    </div>
                  )}

                  {status === "outcome_reported" && (
                    <div className="border-t border-border pt-4 space-y-1">
                      <p className="text-sm text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" /> Your report is in. Thank you.
                      </p>
                      {job.referral.outcome_found && <p className="text-sm text-muted-foreground">Found: {job.referral.outcome_found}</p>}
                      {job.referral.outcome_did && <p className="text-sm text-muted-foreground">Done: {job.referral.outcome_did}</p>}
                      {job.referral.outcome_cost != null && <p className="text-sm text-muted-foreground">Customer paid: ${Number(job.referral.outcome_cost).toLocaleString()}</p>}
                      {job.referral.completion_confirmed_by === "owner" && (
                        <p className="text-sm text-foreground">The owner has confirmed this job is done. It counts as a completed repair.</p>
                      )}
                    </div>
                  )}

                  {status === "completed" && (
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        This job is complete and counted.
                        {job.referral.completion_confirmed_by === "owner" ? " The owner confirmed it." : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
