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
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_notes: string | null;
  view_count: number;
  pdf_download_count: number;
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

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: pkg, error: err } = await supabase
          .rpc("get_referral_package_by_token", { p_token: token });

        if (err || !pkg) {
          setError("This referral link is invalid or has expired.");
          setLoading(false);
          return;
        }

        const p = pkg as any as ReferralData;
        if (new Date(p.expires_at) < new Date()) {
          setError("This referral package has expired.");
          setLoading(false);
          return;
        }

        setData(p);

        // Increment view count via secure RPC
        await supabase.rpc("increment_referral_view", { p_token: token });
      } catch {
        setError("Failed to load referral package.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

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

      // Customer info
      if (data.customer_name || data.customer_email || data.customer_phone) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Customer Information", margin, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        if (data.customer_name) { doc.text(`Name: ${data.customer_name}`, margin, y); y += 6; }
        if (data.customer_email) { doc.text(`Email: ${data.customer_email}`, margin, y); y += 6; }
        if (data.customer_phone) { doc.text(`Phone: ${data.customer_phone}`, margin, y); y += 6; }
        if (data.customer_notes) {
          y += 2;
          doc.text("Notes:", margin, y); y += 6;
          const noteLines = doc.splitTextToSize(data.customer_notes, 170 - margin);
          doc.text(noteLines, margin, y);
          y += noteLines.length * 5 + 4;
        }
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

        {/* Vehicle & Customer Info */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vehicle Details */}
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

          {/* Customer Contact */}
          {(data.customer_name || data.customer_email || data.customer_phone) && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" /> Customer Information
              </h2>
              <dl className="space-y-2 text-sm">
                {data.customer_name && <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{data.customer_name}</dd></div>}
                {data.customer_email && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd><a href={`mailto:${data.customer_email}`} className="font-medium text-accent hover:underline">{data.customer_email}</a></dd>
                  </div>
                )}
                {data.customer_phone && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd><a href={`tel:${data.customer_phone}`} className="font-medium text-accent hover:underline">{data.customer_phone}</a></dd>
                  </div>
                )}
              </dl>
              {data.customer_notes && (
                <div className="mt-3 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Customer Notes</p>
                  <p className="text-sm">{data.customer_notes}</p>
                </div>
              )}
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
