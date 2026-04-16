import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Share2, Loader2, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ShareWithShopProps {
  diagnosisTitle: string;
  diagnosisCode?: string | null;
  diagnosisUrgency?: string | null;
  diyFeasibility?: string | null;
  diagnosisDetails?: any;
  vehicleYear?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleTrim?: string | null;
  vin?: string | null;
  estimatedCostLow?: number | null;
  estimatedCostHigh?: number | null;
  costEstimateDetails?: any;
  metroArea?: string | null;
  zipCode?: string | null;
  photoUrls?: string[];
  audioClipUrl?: string | null;
  videoFrameUrls?: string[];
  chatSummary?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerNotes?: string | null;
  quoteRequestId?: string | null;
  className?: string;
}

export default function ShareWithShopButton(props: ShareWithShopProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to share with a shop.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("referral_packages" as any)
        .insert({
          user_id: user.id,
          diagnosis_title: props.diagnosisTitle,
          diagnosis_code: props.diagnosisCode || null,
          diagnosis_urgency: props.diagnosisUrgency || null,
          diagnosis_details: props.diagnosisDetails || {},
          diy_feasibility: props.diyFeasibility || null,
          vehicle_year: props.vehicleYear || null,
          vehicle_make: props.vehicleMake || null,
          vehicle_model: props.vehicleModel || null,
          vehicle_trim: props.vehicleTrim || null,
          vin: props.vin || null,
          estimated_cost_low: props.estimatedCostLow || null,
          estimated_cost_high: props.estimatedCostHigh || null,
          cost_estimate_details: props.costEstimateDetails || {},
          metro_area: props.metroArea || null,
          zip_code: props.zipCode || null,
          photo_urls: props.photoUrls || [],
          audio_clip_url: props.audioClipUrl || null,
          video_frame_urls: props.videoFrameUrls || [],
          chat_summary: props.chatSummary || null,
          customer_name: props.customerName || null,
          customer_email: props.customerEmail || null,
          customer_phone: props.customerPhone || null,
          customer_notes: props.customerNotes || null,
          quote_request_id: props.quoteRequestId || null,
        } as any)
        .select("token")
        .single();

      if (error) throw error;

      const token = (data as any).token;
      const url = `${window.location.origin}/referral/${token}`;
      setShareUrl(url);

      // Try native share first
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Wrenchli Repair Referral: ${props.diagnosisTitle}`,
            text: `View diagnostic details for ${[props.vehicleYear, props.vehicleMake, props.vehicleModel].filter(Boolean).join(" ")}`,
            url,
          });
        } catch {
          // User cancelled share — show copy fallback
        }
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Referral link copied to clipboard!");
      }
    } catch (e) {
      console.error("Share error:", e);
      toast.error("Failed to create referral package.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  if (shareUrl) {
    return (
      <div className={`rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3 ${props.className || ""}`}>
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">Referral Package Created!</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Share this link with a repair shop — they'll see your full assessment, photos, audio, and cost estimate.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 h-9 rounded-md border border-border bg-muted/50 px-3 text-xs font-mono truncate"
          />
          <Button size="sm" variant="outline" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleShare}
      disabled={loading}
      variant="outline"
      className={`border-accent text-accent hover:bg-accent/10 font-semibold ${props.className || ""}`}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
      Share with Shop
    </Button>
  );
}
