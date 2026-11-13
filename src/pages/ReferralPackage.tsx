import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Car, MapPin, DollarSign, Wrench, Clock, AlertTriangle,
  CheckCircle, Download, Eye, Volume2, Image, FileText,
  Shield, ChevronDown, ChevronUp, Loader2, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { TRANSPORT_STATUS_LABELS } from "@/lib/referralTransport";

interface ReferralData {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_trim: string | null;
  vin: string | null;
  diagnosis_title: string;
  diagnosis_code: string | null;
  diagnosis_urgency: string | null;
  diagnosis_details: any;
  diy_feasibility: string | null;
  estimated_cost_low: number | null;
  estimated_cost_high: number | null;
  cost_estimate_details: any;
  metro_area: string | null;
  zip_code: string | null;
  photo_urls: string[] | null;
  audio_clip_url: string | null;
  video_frame_urls: string[] | null;
  chat_summary: string | null;
  customer_notes: string | null;
  view_count: number;
  pdf_download_count: number;
  // Mobility Brief 3: the owner's pickup/delivery request rides on
  // the package, visible to the addressed shop before it decides.
  transport_requested?: boolean;
  transport_note?: string | null;
  // Referral Lifecycle Phase 1: the token RPC never returns the owner's
  // name, email, or phone. It does return the currently addressed
  // shop_referrals hop (if any) and that shop's name.
  referral_count?: number;
  active_referral?: ActiveReferral | null;
  shop?: { id: string; name: string; offers_pickup_delivery?: boolean } | null;
}

interface ActiveReferral {
  id: string;
  shop_id: string;
  status: string;
  preference_order: number;
  sent_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  window_expires_at: string | null;
  outcome_found: string | null;
  outcome_did: string | null;
  outcome_cost: number | null;
  outcome_transport_cost: number | null;
  transport_status: string | null;
  transport_charge_stated: number | null;
  outcome_reported_at: string | null;
  outcome_reported_by: string | null;
  completion_confirmed_by: string | null;
  completion_confirmed_at: string | null;
  founder_flagged: boolean;
  disputed_at: string | null;
}

const urgencyColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  low: "bg-green-500/10 text-green-700 border-green-500/30",
};

export default function ReferralPackage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  // Phase 1 shop actions (token-scoped)
  const [actionBusy, setActionBusy] = useState(false);
  const [justDeclined, setJustDeclined] = useState(false);
  const [outcomeFound, setOutcomeFound] = useState("");
  const [outcomeDid, setOutcomeDid] = useState("");
  const [outcomeCost, setOutcomeCost] = useState("");
  const [outcomeTransportCost, setOutcomeTransportCost] = useState("");
  // Brief 3 transport management (after acceptance)
  const [transportStatus, setTransportStatus] = useState("arranged");
  const [transportCharge, setTransportCharge] = useState("");

  // Keep the transport controls in sync with the addressed hop
  // whenever the package (re)loads.
  useEffect(() => {
    const ar = data?.active_referral;
    if (!ar) return;
    if (
      ar.transport_status &&
      ["arranged", "picked_up", "delivered", "unable"].includes(ar.transport_status)
    ) {
      setTransportStatus(ar.transport_status);
    }
    if (ar.transport_charge_stated != null) {
      setTransportCharge(String(ar.transport_charge_stated));
    }
  }, [data]);

  const fetchPackage = async (): Promise<ReferralData | null> => {
    if (!token) return null;
    const { data: pkg, error: err } = await supabase
      .rpc("get_referral_package_by_token", { p_token: token });
    if (err || !pkg) return null;
    return pkg as any as ReferralData;
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        // Run the escalation/fallback processor on access first, so an
        // expired acceptance window escalates before we render.
        await supabase.rpc("process_referral_escalations");

        let p = await fetchPackage();
        if (!p) {
          setError("This referral link is invalid or has expired.");
          setLoading(false);
          return;
        }

        if (new Date(p.expires_at) < new Date()) {
          setError("This referral package has expired.");
          setLoading(false);
          return;
        }

        setData(p);

        // Increment view count via secure RPC
        await supabase.rpc("increment_referral_view", { p_token: token });

        // Mark the addressed referral viewed (first view only), then
        // refresh so the rendered status is current.
        if (p.active_referral && p.active_referral.status === "sent") {
          await supabase.rpc("mark_referral_viewed", { p_token: token });
          const refreshed = await fetchPackage();
          if (refreshed) {
            p = refreshed;
            setData(refreshed);
          }
        }
      } catch {
        setError("Failed to load referral package.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRespond = async (accept: boolean) => {
    if (!token) return;
    setActionBusy(true);
    try {
      const { data: result, error: err } = await supabase.rpc("respond_to_referral", {
        p_token: token,
        p_accept: accept,
      });
      if (err) throw err;
      const r = result as any;
      if (!r?.ok) {
        toast.error("This referral is no longer awaiting a response.");
        const refreshed = await fetchPackage();
        if (refreshed) setData(refreshed);
        return;
      }
      if (accept) {
        toast.success("Referral accepted. You can file the outcome report after the repair.");
        const refreshed = await fetchPackage();
        if (refreshed) setData(refreshed);
      } else {
        // Do NOT refetch here: a refetch would surface the next hop in
        // the owner's chain under the same package token. This shop
        // sees only the neutral passed-on state for this session.
        setJustDeclined(true);
      }
    } catch (e) {
      console.error("Respond error:", e);
      toast.error("Failed to record your response.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleSetTransport = async () => {
    if (!token) return;
    const charge = transportCharge.trim() ? Number(transportCharge) : null;
    if (charge != null && (Number.isNaN(charge) || charge < 0)) {
      toast.error("Please enter a valid charge, or leave it blank.");
      return;
    }
    setActionBusy(true);
    try {
      const { data: result, error: err } = await supabase.rpc(
        "set_referral_transport" as any,
        {
          p_token: token,
          p_status: transportStatus,
          p_charge_stated: charge,
        } as any
      );
      if (err) throw err;
      const r = result as any;
      if (!r?.ok) {
        toast.error(
          r?.reason === "pickup_delivery_not_offered"
            ? "Your shop has not told Wrenchli it offers pickup and delivery, so pickup and delivery can't be arranged here."
            : "Transport could not be updated."
        );
        return;
      }
      toast.success("Transport status updated.");
      const refreshed = await fetchPackage();
      if (refreshed) setData(refreshed);
    } catch (e) {
      console.error("Set transport error:", e);
      toast.error("Failed to update transport.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleSubmitOutcome = async () => {
    if (!token) return;
    if (!outcomeFound.trim() || !outcomeDid.trim()) {
      toast.error("Please tell us what you found and what you did.");
      return;
    }
    const cost = outcomeCost.trim() ? Number(outcomeCost) : null;
    if (cost != null && (Number.isNaN(cost) || cost < 0)) {
      toast.error("Please enter a valid cost.");
      return;
    }
    const transportCost = outcomeTransportCost.trim()
      ? Number(outcomeTransportCost)
      : null;
    if (transportCost != null && (Number.isNaN(transportCost) || transportCost < 0)) {
      toast.error("Please enter a valid pickup/delivery cost, or leave it blank.");
      return;
    }
    setActionBusy(true);
    try {
      const { data: result, error: err } = await supabase.rpc(
        "submit_referral_outcome" as any,
        {
          p_token: token,
          p_found: outcomeFound.trim(),
          p_did: outcomeDid.trim(),
          p_cost: cost,
          p_transport_cost: transportCost,
        } as any
      );
      if (err) throw err;
      const r = result as any;
      if (!r?.ok) {
        toast.error(
          r?.reason === "outcome_window_closed"
            ? "The outcome window for this referral has closed."
            : "This referral is not awaiting an outcome report."
        );
        return;
      }
      toast.success("Outcome reported. The vehicle owner will be asked to confirm completion.");
      const refreshed = await fetchPackage();
      if (refreshed) setData(refreshed);
    } catch (e) {
      console.error("Outcome submit error:", e);
      toast.error("Failed to submit the outcome report.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 128, 128);
      doc.text("WRENCHLI", margin, y);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text("Shop Referral Package", margin + 60, y);
      y += 5;
      doc.setDrawColor(0, 128, 128);
      doc.setLineWidth(0.5);
      doc.line(margin, y, 190, y);
      y += 12;

      // Vehicle info
      const vehicleStr = [data.vehicle_year, data.vehicle_make, data.vehicle_model, data.vehicle_trim].filter(Boolean).join(" ");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Vehicle Information", margin, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      if (vehicleStr) { doc.text(`Vehicle: ${vehicleStr}`, margin, y); y += 6; }
      if (data.vin) { doc.text(`VIN: ${data.vin}`, margin, y); y += 6; }
      if (data.zip_code) { doc.text(`Location: ${data.metro_area || data.zip_code}`, margin, y); y += 6; }
      y += 6;

      // Diagnosis
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Assessment", margin, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Issue: ${data.diagnosis_title}`, margin, y); y += 6;
      if (data.diagnosis_code) { doc.text(`Code: ${data.diagnosis_code}`, margin, y); y += 6; }
      if (data.diagnosis_urgency) { doc.text(`Urgency: ${data.diagnosis_urgency.toUpperCase()}`, margin, y); y += 6; }
      if (data.diy_feasibility) { doc.text(`DIY Feasibility: ${data.diy_feasibility}`, margin, y); y += 6; }
      y += 6;

      // Cost estimate
      if (data.estimated_cost_low != null && data.estimated_cost_high != null) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Cost Estimate", margin, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Range: $${data.estimated_cost_low.toLocaleString()} – $${data.estimated_cost_high.toLocaleString()}`, margin, y);
        y += 6;
        const details = data.cost_estimate_details || {};
        if (details.parts_estimate) { doc.text(`Parts: ${details.parts_estimate}`, margin, y); y += 6; }
        if (details.labor_estimate) { doc.text(`Labor: ${details.labor_estimate}`, margin, y); y += 6; }
        if (details.labor_hours) { doc.text(`Est. Time: ${details.labor_hours}`, margin, y); y += 6; }
        y += 6;
      }

      // Owner notes for the shop. The owner's name, email, and phone are
      // never part of this package or its PDF export (Phase 1 privacy).
      if (data.customer_notes) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Notes for the Shop", margin, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const noteLines = doc.splitTextToSize(data.customer_notes, 170 - margin);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 5 + 4;
        y += 6;
      }

      // Chat summary
      if (data.chat_summary) {
        if (y > 240) { doc.addPage(); y = margin; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("AI Chat Summary", margin, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const chatLines = doc.splitTextToSize(data.chat_summary, 170 - margin);
        doc.text(chatLines, margin, y);
        y += chatLines.length * 5 + 6;
      }

      // Media section
      const hasMedia = (data.photo_urls?.length || 0) > 0 || data.audio_clip_url || (data.video_frame_urls?.length || 0) > 0;
      if (hasMedia) {
        if (y > 240) { doc.addPage(); y = margin; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Attached Media", margin, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        if (data.photo_urls?.length) { doc.text(`📸 ${data.photo_urls.length} damage photo(s) — view online`, margin, y); y += 6; }
        if (data.audio_clip_url) { doc.text("🎤 Audio recording of car noise — play online", margin, y); y += 6; }
        if (data.video_frame_urls?.length) { doc.text(`🎬 ${data.video_frame_urls.length} video frame(s) — view online`, margin, y); y += 6; }
        y += 4;
        doc.setTextColor(0, 128, 128);
        doc.textWithLink("View full interactive package online →", margin, y, {
          url: window.location.href,
        });
        doc.setTextColor(0, 0, 0);
        y += 10;
      }

      // Footer
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, 190, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Wrenchli on ${new Date().toLocaleDateString()}`, margin, y);
      doc.text("This is an AI-assisted estimate. Final assessment and pricing should be confirmed by a qualified technician.", margin, y + 4);
      doc.text(`Package ID: ${data.token}`, margin, y + 8);

      doc.save(`wrenchli-referral-${data.token.slice(0, 8)}.pdf`);

      // Track download
      await supabase.rpc("increment_referral_download", { p_token: data.token });

      toast.success("PDF downloaded!");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error("Failed to generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
          <p className="text-muted-foreground">Loading referral package...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <SEO title="Referral Package — Wrenchli" description="View a vehicle repair referral package." path={`/referral/${token}`} />
        <div className="text-center space-y-4 max-w-md px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h1 className="font-heading text-2xl font-bold">Package Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild variant="outline">
            <Link to="/">Go to Wrenchli</Link>
          </Button>
        </div>
      </main>
    );
  }

  const vehicleStr = [data.vehicle_year, data.vehicle_make, data.vehicle_model, data.vehicle_trim].filter(Boolean).join(" ");
  const details = data.cost_estimate_details || {};
  const transportLabel = data.active_referral?.transport_status
    ? TRANSPORT_STATUS_LABELS[
        data.active_referral.transport_status as keyof typeof TRANSPORT_STATUS_LABELS
      ]
    : undefined;

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title={`Referral: ${data.diagnosis_title} — Wrenchli`}
        description={`View assessment and repair estimate for ${vehicleStr || "vehicle"}.`}
        path={`/referral/${token}`}
      />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-8 md:py-12">
        <div className="container-wrenchli max-w-4xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-2">
                <Shield className="h-4 w-4" />
                <span>Wrenchli Shop Referral Package</span>
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{data.diagnosis_title}</h1>
              {vehicleStr && (
                <p className="mt-2 flex items-center gap-2 text-primary-foreground/80">
                  <Car className="h-4 w-4" /> {vehicleStr}
                </p>
              )}
            </div>
            <Button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              variant="secondary"
              className="font-semibold"
            >
              {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
          </div>
        </div>
      </section>

      <div className="container-wrenchli max-w-4xl py-8 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {data.estimated_cost_low != null && data.estimated_cost_high != null && (
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <DollarSign className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Cost</p>
              <p className="font-heading text-2xl font-extrabold text-accent mt-1">
                ${data.estimated_cost_low.toLocaleString()} – ${data.estimated_cost_high.toLocaleString()}
              </p>
            </div>
          )}
          {data.diagnosis_urgency && (
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Urgency</p>
              <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-sm font-semibold ${urgencyColors[data.diagnosis_urgency] || ""}`}>
                {data.diagnosis_urgency.charAt(0).toUpperCase() + data.diagnosis_urgency.slice(1)}
              </span>
            </div>
          )}
          {data.metro_area && (
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <MapPin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
              <p className="font-semibold mt-1">{data.metro_area}</p>
            </div>
          )}
        </div>

        {/* Shop actions for an addressed referral (Phase 1). Legacy
            unaddressed packages (no shop_referrals rows) render the
            package only, with no buttons. */}
        {justDeclined ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
            <CheckCircle className="h-8 w-8 text-accent mx-auto" />
            <h2 className="font-heading text-lg font-bold">Thanks — this referral has been passed on</h2>
            <p className="text-sm text-muted-foreground">
              No action is needed. The vehicle owner will take it from here.
            </p>
          </div>
        ) : data.active_referral ? (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 space-y-4">
            {data.shop && (
              <p className="text-sm text-muted-foreground">
                This package was sent to <span className="font-semibold text-foreground">{data.shop.name}</span>.
              </p>
            )}
            {/* Brief 3: the pickup/delivery request is visible BEFORE
                the shop decides, so a shop that cannot arrange a tow
                can pass with full information. After acceptance the
                shop manages the transport status here. */}
            {data.transport_requested && data.active_referral.status !== "outcome_reported" && (
              <div className="rounded-lg border border-border bg-background p-4 space-y-2">
                <h3 className="font-heading text-base font-bold">Pickup and delivery requested</h3>
                <p className="text-sm text-muted-foreground">
                  This car can&rsquo;t be driven. The owner is asking your shop to
                  arrange pickup and delivery.
                </p>
                {data.transport_note && (
                  <p className="text-sm">Owner&rsquo;s note: {data.transport_note}</p>
                )}
                {data.active_referral.status === "accepted" &&
                  (data.shop?.offers_pickup_delivery === false ? (
                    <p className="text-sm text-muted-foreground">
                      Your shop has not told Wrenchli it offers pickup and delivery,
                      so pickup and delivery can&rsquo;t be arranged here.
                    </p>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <p className="text-sm">
                        Transport status:{" "}
                        <span className="font-medium">
                          {transportLabel ?? "Pickup requested"}
                        </span>
                        {data.active_referral.transport_charge_stated != null && (
                          <>
                            {" "}· Your stated charge: $
                            {Number(data.active_referral.transport_charge_stated).toLocaleString()}
                          </>
                        )}
                      </p>
                      <div>
                        <label htmlFor="transport-status" className="block text-sm font-medium mb-1">
                          Update transport status
                        </label>
                        <select
                          id="transport-status"
                          value={transportStatus}
                          onChange={(e) => setTransportStatus(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="arranged">Arranged</option>
                          <option value="picked_up">Picked up</option>
                          <option value="delivered">Delivered to the shop</option>
                          <option value="unable">Unable to arrange</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="transport-charge" className="block text-sm font-medium mb-1">
                          Your pickup/delivery charge (USD, optional)
                        </label>
                        <input
                          id="transport-charge"
                          type="number"
                          min="0"
                          step="0.01"
                          value={transportCharge}
                          onChange={(e) => setTransportCharge(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="e.g. 75"
                        />
                      </div>
                      <Button
                        onClick={() => void handleSetTransport()}
                        disabled={actionBusy}
                        variant="outline"
                      >
                        {actionBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update transport status
                      </Button>
                    </div>
                  ))}
              </div>
            )}
            {(data.active_referral.status === "sent" || data.active_referral.status === "viewed") && (
              <>
                <div>
                  <h2 className="font-heading text-lg font-bold">Can your shop take this repair?</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accept to let the owner know you will handle it, or pass and the owner
                    will be notified — no penalty either way.
                    {data.active_referral.window_expires_at && (
                      <> Please respond by {new Date(data.active_referral.window_expires_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.</>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => void handleRespond(true)}
                    disabled={actionBusy}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  >
                    {actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Accept this repair
                  </Button>
                  <Button
                    onClick={() => void handleRespond(false)}
                    disabled={actionBusy}
                    variant="outline"
                  >
                    Pass on this repair
                  </Button>
                </div>
              </>
            )}
            {data.active_referral.status === "accepted" && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-heading text-lg font-bold">You accepted this repair</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    After the work is done, file the 2-minute outcome report below. The
                    repair counts as a completed referred repair once the vehicle owner
                    confirms it.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="outcome-found" className="block text-sm font-medium mb-1">What did you find?</label>
                    <textarea
                      id="outcome-found"
                      value={outcomeFound}
                      onChange={(e) => setOutcomeFound(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[70px]"
                      placeholder="e.g. Front brake pads worn to 2mm, rotors scored"
                    />
                  </div>
                  <div>
                    <label htmlFor="outcome-did" className="block text-sm font-medium mb-1">What did you do?</label>
                    <textarea
                      id="outcome-did"
                      value={outcomeDid}
                      onChange={(e) => setOutcomeDid(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[70px]"
                      placeholder="e.g. Replaced front pads and rotors, road tested"
                    />
                  </div>
                  <div>
                    <label htmlFor="outcome-cost" className="block text-sm font-medium mb-1">What did it cost? (USD)</label>
                    <input
                      id="outcome-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={outcomeCost}
                      onChange={(e) => setOutcomeCost(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g. 425"
                    />
                  </div>
                  {data.transport_requested && (
                    <div>
                      <label htmlFor="outcome-transport-cost" className="block text-sm font-medium mb-1">Pickup/delivery cost (USD, optional)</label>
                      <input
                        id="outcome-transport-cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={outcomeTransportCost}
                        onChange={(e) => setOutcomeTransportCost(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="e.g. 75"
                      />
                    </div>
                  )}
                  <Button
                    onClick={() => void handleSubmitOutcome()}
                    disabled={actionBusy}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  >
                    {actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Submit outcome report
                  </Button>
                </div>
              </div>
            )}
            {data.active_referral.status === "outcome_reported" && (
              <div className="space-y-2">
                <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" /> Outcome reported
                </h2>
                <p className="text-sm text-muted-foreground">
                  Thanks — your report is on file. The vehicle owner has been asked to
                  confirm the repair was completed.
                </p>
                {(data.active_referral.outcome_found || data.active_referral.outcome_did || data.active_referral.outcome_cost != null || data.active_referral.outcome_transport_cost != null) && (
                  <dl className="space-y-1 text-sm">
                    {data.active_referral.outcome_found && <div className="flex gap-2"><dt className="text-muted-foreground">Found</dt><dd className="font-medium">{data.active_referral.outcome_found}</dd></div>}
                    {data.active_referral.outcome_did && <div className="flex gap-2"><dt className="text-muted-foreground">Did</dt><dd className="font-medium">{data.active_referral.outcome_did}</dd></div>}
                    {data.active_referral.outcome_cost != null && <div className="flex gap-2"><dt className="text-muted-foreground">Cost</dt><dd className="font-medium">${Number(data.active_referral.outcome_cost).toLocaleString()}</dd></div>}
                    {data.active_referral.outcome_transport_cost != null && <div className="flex gap-2"><dt className="text-muted-foreground">Pickup/delivery</dt><dd className="font-medium">${Number(data.active_referral.outcome_transport_cost).toLocaleString()}</dd></div>}
                  </dl>
                )}
              </div>
            )}
          </div>
        ) : (data.referral_count ?? 0) > 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              This referral is no longer awaiting a response.
            </p>
          </div>
        ) : null}

        {/* Vehicle Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <Car className="h-5 w-5 text-accent" /> Vehicle Details
            </h2>
            <dl className="space-y-2 text-sm">
              {vehicleStr && <div className="flex justify-between"><dt className="text-muted-foreground">Vehicle</dt><dd className="font-medium">{vehicleStr}</dd></div>}
              {data.vin && <div className="flex justify-between"><dt className="text-muted-foreground">VIN</dt><dd className="font-mono font-medium text-xs">{data.vin}</dd></div>}
              {data.zip_code && <div className="flex justify-between"><dt className="text-muted-foreground">ZIP Code</dt><dd className="font-medium">{data.zip_code}</dd></div>}
              {data.diagnosis_code && <div className="flex justify-between"><dt className="text-muted-foreground">DTC Code</dt><dd className="font-mono font-medium">{data.diagnosis_code}</dd></div>}
              {data.diy_feasibility && <div className="flex justify-between"><dt className="text-muted-foreground">DIY Feasibility</dt><dd className="font-medium capitalize">{data.diy_feasibility}</dd></div>}
            </dl>
          </div>

          {/* Owner notes for the shop (never name, email, or phone) */}
          {data.customer_notes && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" /> Notes for the Shop
              </h2>
              <p className="text-sm">{data.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        {details.parts_estimate && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" /> Cost Breakdown
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
                <Wrench className="h-5 w-5 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">Parts</p>
                <p className="font-semibold">{details.parts_estimate}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
                <DollarSign className="h-5 w-5 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">Labor</p>
                <p className="font-semibold">{details.labor_estimate}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
                <Clock className="h-5 w-5 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">Est. Time</p>
                <p className="font-semibold">{details.labor_hours}</p>
              </div>
            </div>
            {details.what_to_expect && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">What to Expect</h4>
                <p>{details.what_to_expect}</p>
              </div>
            )}
            {details.regional_notes && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Regional Notes</h4>
                <p>{details.regional_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Media Section */}
        {((data.photo_urls?.length || 0) > 0 || data.audio_clip_url || (data.video_frame_urls?.length || 0) > 0) && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <Image className="h-5 w-5 text-accent" /> Attached Media
            </h2>

            {/* Photos */}
            {data.photo_urls && data.photo_urls.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">📸 Damage Photos ({data.photo_urls.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.photo_urls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(url)}
                      className="aspect-square rounded-lg overflow-hidden border border-border hover:border-accent transition-colors"
                    >
                      <img src={url} alt={`Damage photo ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Video Frames */}
            {data.video_frame_urls && data.video_frame_urls.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">🎬 Video Frames ({data.video_frame_urls.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.video_frame_urls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(url)}
                      className="aspect-video rounded-lg overflow-hidden border border-border hover:border-accent transition-colors"
                    >
                      <img src={url} alt={`Video frame ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audio */}
            {data.audio_clip_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  <Volume2 className="inline h-4 w-4 mr-1" /> Car Noise Recording
                </p>
                <audio controls className="w-full" preload="metadata">
                  <source src={data.audio_clip_url} />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}
          </div>
        )}

        {/* Chat Summary */}
        {data.chat_summary && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" /> AI Assessment Chat Summary
              </h2>
              {showChat ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>
            {showChat && (
              <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                {data.chat_summary}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">⚠️ Important Disclaimer</p>
          <p>
            This is an AI-assisted assessment and cost estimate. Final assessment and pricing should be confirmed through hands-on inspection by a qualified technician. Actual repair costs may vary based on vehicle condition and shop rates.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-xs text-muted-foreground">
            <Eye className="inline h-3 w-3 mr-1" /> Viewed {data.view_count + 1} time{data.view_count !== 0 ? "s" : ""}
            {" · "}Created {new Date(data.created_at).toLocaleDateString()}
            {" · "}Expires {new Date(data.expires_at).toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by <Link to="/" className="text-accent hover:underline font-semibold">Wrenchli</Link>
          </p>
        </div>
      </div>

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
