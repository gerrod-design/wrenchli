import { useState } from "react";
import { MessageCircle, Lock, Check, Copy, Facebook, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SPECIALIZATIONS = [
  "General Repair",
  "Brakes & Suspension",
  "Engine & Transmission",
  "Oil Change / Maintenance",
  "Body Work",
  "Electrical / Diagnostics",
  "Tires & Alignment",
];

const NOMINATE_URL = "https://www.wrenchli.net/nominate";

export interface RecommendShopFormProps {
  variant?: "modal" | "page";
  onClose?: () => void;
}

type FormState = "form" | "submitting" | "success";

export default function RecommendShopForm({ variant = "modal" }: RecommendShopFormProps) {
  const [state, setState] = useState<FormState>("form");
  const [shopName, setShopName] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [shareIdentity, setShareIdentity] = useState(false);
  const [showYourInfo, setShowYourInfo] = useState(false);
  const [submittedShopName, setSubmittedShopName] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSpec = (spec: string) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (shopName.trim().length < 2) e.shopName = "Shop name is required";
    if (shopLocation.trim().length < 2) e.shopLocation = "Location is required";
    if (yourEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(yourEmail.trim()))
      e.yourEmail = "Please enter a valid email";
    if (yourEmail.trim() && !emailConsent)
      e.emailConsent = "Please check the box so we may email you, or clear your email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setShopName("");
    setShopLocation("");
    setSpecializations([]);
    setReason("");
    setYourName("");
    setYourEmail("");
    setEmailConsent(false);
    setShareIdentity(false);
    setShowYourInfo(false);
    setErrors({});
    setState("form");
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setState("submitting");
    try {
      const { error } = await supabase.from("shop_recommendations" as any).insert({
        shop_name: shopName.trim(),
        shop_location: shopLocation.trim(),
        specializations,
        recommendation_reason: reason.trim() || null,
        recommender_name: yourName.trim() || null,
        recommender_email: yourEmail.trim() || null,
        email_consent: emailConsent,
        email_consent_at: emailConsent ? new Date().toISOString() : null,
        share_identity: shareIdentity,
      });
      if (error) throw error;
      setSubmittedShopName(shopName.trim());
      setSubmittedEmail(yourEmail.trim());
      setState("success");
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      setState("form");
    }
  };

  const nominationMessage = `I just nominated ${submittedShopName} to join Wrenchli, the platform that brings transparency to auto repair. Nominate your shop too: ${NOMINATE_URL}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(NOMINATE_URL);
    toast({ title: "Link copied!", description: "www.wrenchli.net/nominate copied to clipboard." });
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(NOMINATE_URL)}&quote=${encodeURIComponent(nominationMessage)}`,
      "_blank"
    );
  };

  const handleTextFriend = () => {
    const text = encodeURIComponent(nominationMessage);
    window.open(`sms:?body=${text}`, "_self");
  };

  const yourInfoProps = {
    yourName,
    setYourName,
    yourEmail,
    setYourEmail,
    emailConsent,
    setEmailConsent,
    shareIdentity,
    setShareIdentity,
    errors,
  };

  return (
    <div className={variant === "page" ? "" : "p-6 md:p-8"}>
      {state === "success" ? (
        /* ── SUCCESS STATE ── */
        <div className="text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-wrenchli-teal/10 mb-4">
            <Check className="h-8 w-8 text-wrenchli-teal" />
          </div>
          <h2 className="font-heading text-xl font-bold">Thanks for the recommendation!</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            We'll reach out to <span className="font-semibold text-foreground">{submittedShopName}</span> and let them know their customers want them on Wrenchli.
          </p>
          {submittedEmail && (
            <p className="mt-2 text-sm text-muted-foreground">
              We'll notify you at <span className="font-medium text-foreground">{submittedEmail}</span> when they join.
            </p>
          )}

          <div className="mt-6 border-t border-border pt-5">
            <Button
              onClick={resetForm}
              variant="outline"
              className="font-semibold"
            >
              Recommend Another →
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm text-muted-foreground mb-3">Share Wrenchli with friends who need car help:</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-1.5" /> Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareFacebook}>
                <Facebook className="h-4 w-4 mr-1.5" /> Facebook
              </Button>
              <Button variant="outline" size="sm" onClick={handleTextFriend}>
                <Smartphone className="h-4 w-4 mr-1.5" /> Text a Friend
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── FORM STATE ── */
        <>
          {variant === "modal" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="h-5 w-5 text-wrenchli-teal" />
                <h2 className="font-heading text-lg font-bold">Recommend a Shop You Trust</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Help us bring great mechanics to Wrenchli. We'll reach out to them and let them know their customers want them on the platform.
              </p>
            </>
          )}

          {/* Section: Shop Info */}
          <div className="flex items-center gap-3 mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            Shop Information
            <span className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Shop Name *</label>
              <Input
                placeholder="e.g., Mike's Auto Repair"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="h-12 text-base"
              />
              {errors.shopName && <p className="text-xs text-destructive mt-1">{errors.shopName}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Shop Location (city or address) *</label>
              <Input
                placeholder="e.g., Dearborn, MI or 1234 Michigan Ave"
                value={shopLocation}
                onChange={(e) => setShopLocation(e.target.value)}
                className="h-12 text-base"
              />
              {errors.shopLocation && <p className="text-xs text-destructive mt-1">{errors.shopLocation}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">What do they specialize in?</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpec(spec)}
                    className={`rounded-full border px-4 py-2.5 text-sm transition-all select-none min-h-[44px] ${
                      specializations.includes(spec)
                        ? "border-wrenchli-teal bg-wrenchli-teal/10 text-wrenchli-teal font-semibold"
                        : "border-border text-muted-foreground hover:border-wrenchli-teal"
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Why do you recommend them? (optional)</label>
              <Textarea
                placeholder="e.g., Honest pricing, great communication, been going there for years..."
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                rows={2}
                className="text-base resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{reason.length}/500</p>
            </div>
          </div>

          {/* Section: Your Info */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="flex-1 h-px bg-border" />
              Your Information (optional)
              <span className="flex-1 h-px bg-border" />
            </div>

            {/* Mobile: collapsible toggle */}
            <div className="md:hidden">
              {!showYourInfo ? (
                <button
                  onClick={() => setShowYourInfo(true)}
                  className="text-sm text-wrenchli-teal font-semibold hover:underline"
                >
                  + Add your info (optional)
                </button>
              ) : (
                <YourInfoFields {...yourInfoProps} />
              )}
            </div>

            {/* Desktop: always visible */}
            <div className="hidden md:block">
              <YourInfoFields {...yourInfoProps} />
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={state === "submitting"}
            className="w-full mt-6 h-14 bg-wrenchli-teal text-white hover:bg-wrenchli-teal/90 font-semibold text-base"
          >
            {state === "submitting" ? "Submitting..." : "Submit Recommendation"}
          </Button>

          {/* Privacy */}
          <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>We'll never share your personal info with the shop without your permission.</p>
          </div>
        </>
      )}
    </div>
  );
}

function YourInfoFields({
  yourName,
  setYourName,
  yourEmail,
  setYourEmail,
  emailConsent,
  setEmailConsent,
  shareIdentity,
  setShareIdentity,
  errors,
}: {
  yourName: string;
  setYourName: (v: string) => void;
  yourEmail: string;
  setYourEmail: (v: string) => void;
  emailConsent: boolean;
  setEmailConsent: (v: boolean) => void;
  shareIdentity: boolean;
  setShareIdentity: (v: boolean) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Your Name</label>
        <Input
          placeholder="Your name"
          value={yourName}
          onChange={(e) => setYourName(e.target.value)}
          className="h-12 text-base"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Your Email</label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={yourEmail}
          onChange={(e) => setYourEmail(e.target.value)}
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground mt-1">So we can let you know when they join</p>
        {errors.yourEmail && <p className="text-xs text-destructive mt-1">{errors.yourEmail}</p>}
      </div>
      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer">
          <Checkbox
            checked={emailConsent}
            onCheckedChange={(v) => setEmailConsent(v === true)}
            className="mt-0.5"
            aria-label="Email me if my shop joins Wrenchli, and send me occasional Wrenchli updates"
          />
          <span>
            Email me if my shop joins Wrenchli, and send me occasional Wrenchli updates. We never share your email with the shop.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer">
          <Checkbox
            checked={shareIdentity}
            onCheckedChange={(v) => setShareIdentity(v === true)}
            className="mt-0.5"
            aria-label="You may tell the shop my name, as the customer who recommended them"
          />
          <span>
            You may tell the shop my name, as the customer who recommended them.
          </span>
        </label>
        {errors.emailConsent && <p className="text-xs text-destructive">{errors.emailConsent}</p>}
      </div>
    </div>
  );
}
