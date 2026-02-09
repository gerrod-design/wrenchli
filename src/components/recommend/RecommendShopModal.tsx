import { useState } from "react";
import { X, MessageCircle, Lock, Check, Share2, Copy, Facebook, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface RecommendShopModalProps {
  open: boolean;
  onClose: () => void;
}

type FormState = "form" | "submitting" | "success";

export default function RecommendShopModal({ open, onClose }: RecommendShopModalProps) {
  const [state, setState] = useState<FormState>("form");
  const [shopName, setShopName] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [showYourInfo, setShowYourInfo] = useState(false);
  const [submittedShopName, setSubmittedShopName] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://wrenchli.net");
    toast({ title: "Link copied!", description: "wrenchli.net copied to clipboard." });
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://wrenchli.net")}&quote=${encodeURIComponent("I just recommended my mechanic to Wrenchli — a new platform that brings transparency to auto repair.")}`,
      "_blank"
    );
  };

  const handleTextFriend = () => {
    const text = encodeURIComponent(
      "Hey, check out Wrenchli — it helps you diagnose car problems, find DIY tutorials, or get quotes from trusted local shops. wrenchli.net"
    );
    window.open(`sms:?body=${text}`, "_self");
  };

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90%] md:max-w-[560px] md:rounded-2xl rounded-t-2xl bg-background max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-4">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="p-6 md:p-8">
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
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="h-5 w-5 text-wrenchli-teal" />
                <h2 className="font-heading text-lg font-bold">Recommend a Shop You Trust</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Help us bring great mechanics to Wrenchli. We'll reach out to them and let them know their customers want them on the platform.
              </p>

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
                    <YourInfoFields
                      yourName={yourName}
                      setYourName={setYourName}
                      yourEmail={yourEmail}
                      setYourEmail={setYourEmail}
                      errors={errors}
                    />
                  )}
                </div>

                {/* Desktop: always visible */}
                <div className="hidden md:block">
                  <YourInfoFields
                    yourName={yourName}
                    setYourName={setYourName}
                    yourEmail={yourEmail}
                    setYourEmail={setYourEmail}
                    errors={errors}
                  />
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
      </div>
    </div>
  );
}

function YourInfoFields({
  yourName,
  setYourName,
  yourEmail,
  setYourEmail,
  errors,
}: {
  yourName: string;
  setYourName: (v: string) => void;
  yourEmail: string;
  setYourEmail: (v: string) => void;
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
    </div>
  );
}
