import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Store, Copy, ExternalLink } from "lucide-react";
import wrenchliLogo from "@/assets/wrenchli-logo-dark.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const FONT = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const smsProviders = [
  { value: "tekmetric", label: "Tekmetric", helpUrl: "https://developers.tekmetric.com" },
  { value: "mitchell1", label: "Mitchell 1", helpUrl: "" },
  { value: "autoleap", label: "AutoLeap", helpUrl: "" },
  { value: "shopware", label: "ShopWare", helpUrl: "" },
  { value: "protractor", label: "Protractor", helpUrl: "" },
  { value: "rowriter", label: "ROWriter", helpUrl: "" },
  { value: "fullbay", label: "Fullbay", helpUrl: "" },
  { value: "napatracs", label: "NAPA TRACS", helpUrl: "" },
  { value: "csv", label: "Other (CSV only)", helpUrl: "" },
];

const bayOptions = ["1-2", "3-5", "6-10", "10+"];

type Step = 1 | 2 | 3 | 4;

export default function ShopOnboardingPreview() {
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [profile, setProfile] = useState({
    shopName: "", ownerName: "", email: "", phone: "",
    address: "", city: "", state: "", zip: "", bays: "",
  });

  // Step 2 state
  const [smsProvider, setSmsProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectedShopName, setConnectedShopName] = useState("");
  const [testError, setTestError] = useState("");

  // Step 3 state
  const [agreeData, setAgreeData] = useState(false);
  const [agreeAnonymized, setAgreeAnonymized] = useState(false);

  const shopSlug = profile.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const step1Valid = profile.shopName && profile.ownerName && profile.email && profile.phone && profile.address && profile.city && profile.state && profile.zip;
  const step2Valid = smsProvider === "csv" || testStatus === "success";
  const step3Valid = agreeData && agreeAnonymized;

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestError("");
    try {
      const res = await supabase.functions.invoke("sms-connection-test", {
        body: { provider: smsProvider, api_key: apiKey },
      });
      if (res.data?.connected) {
        setTestStatus("success");
        setConnectedShopName(res.data.shop_name || "Connected");
      } else {
        setTestStatus("error");
        setTestError(res.data?.error || "Connection failed");
      }
    } catch {
      setTestStatus("error");
      setTestError("Network error. Please try again.");
    }
  };

  const handleComplete = async () => {
    try {
      await supabase.from("contact_submissions").insert({
        name: profile.ownerName,
        email: profile.email,
        phone: profile.phone,
        message: `Shop Onboarding — Shop: ${profile.shopName}, Address: ${profile.address}, ${profile.city}, ${profile.state} ${profile.zip}, Bays: ${profile.bays}, SMS: ${smsProvider}`,
      });
      setStep(4);
    } catch {
      toast({ title: "Error submitting", description: "Please try again.", variant: "destructive" });
    }
  };

  const selectedProvider = smsProviders.find((p) => p.value === smsProvider);

  return (
    <div className="min-h-screen" style={{ fontFamily: FONT, background: "#F8F8F6" }}>
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "#E0DDD8", background: "#FFFFFF" }}>
        <Link to="/design-preview/for-shops" className="flex items-center gap-2">
          <img src={wrenchliLogo} alt="Wrenchli" className="h-7 w-7 object-contain" />
          <span className="text-lg font-bold" style={{ color: "#1A1D27" }}>Wrenchli</span>
          <span className="text-xs font-medium ml-2 px-2 py-0.5 rounded" style={{ background: "#FEF3E2", color: "#E07B39" }}>Shop Setup</span>
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Progress */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: step >= s ? "#E07B39" : "#E0DDD8",
                    color: step >= s ? "#FFFFFF" : "#9CA3AF",
                  }}
                >
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className="flex-1 h-0.5 rounded" style={{ background: step > s ? "#E07B39" : "#E0DDD8" }} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 — Shop Profile */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A1D27" }}>Shop Profile</h2>
            <p className="text-sm mb-8" style={{ color: "#6B7280" }}>Tell us about your shop so we can set up your profile.</p>
            <div className="space-y-4">
              <Input label="Shop name" value={profile.shopName} onChange={(v) => setProfile(p => ({ ...p, shopName: v }))} required />
              <Input label="Owner / manager name" value={profile.ownerName} onChange={(v) => setProfile(p => ({ ...p, ownerName: v }))} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email" type="email" value={profile.email} onChange={(v) => setProfile(p => ({ ...p, email: v }))} required />
                <Input label="Phone" type="tel" value={profile.phone} onChange={(v) => setProfile(p => ({ ...p, phone: v }))} required />
              </div>
              <Input label="Street address" value={profile.address} onChange={(v) => setProfile(p => ({ ...p, address: v }))} required />
              <div className="grid grid-cols-3 gap-4">
                <Input label="City" value={profile.city} onChange={(v) => setProfile(p => ({ ...p, city: v }))} required />
                <Input label="State" value={profile.state} onChange={(v) => setProfile(p => ({ ...p, state: v }))} required />
                <Input label="ZIP" value={profile.zip} onChange={(v) => setProfile(p => ({ ...p, zip: v }))} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1D27" }}>Number of bays</label>
                <select
                  value={profile.bays} onChange={(e) => setProfile(p => ({ ...p, bays: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg text-sm border outline-none"
                  style={{ borderColor: "#E0DDD8", background: "#FFFFFF" }}
                >
                  <option value="">Select...</option>
                  {bayOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <button
              disabled={!step1Valid} onClick={() => setStep(2)}
              className="w-full mt-8 px-6 py-3.5 rounded-lg font-semibold text-base disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "#E07B39", color: "#FFFFFF" }}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 2 — SMS Connection */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A1D27" }}>Connect Your Shop Management System</h2>
            <p className="text-sm mb-8" style={{ color: "#6B7280" }}>This lets Wrenchli send you pre-populated repair orders and automatically track repair outcomes.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1D27" }}>SMS provider</label>
                <select
                  value={smsProvider} onChange={(e) => { setSmsProvider(e.target.value); setTestStatus("idle"); }}
                  className="w-full px-4 py-3 rounded-lg text-sm border outline-none"
                  style={{ borderColor: "#E0DDD8", background: "#FFFFFF" }}
                >
                  <option value="">Select your system...</option>
                  {smsProviders.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              {smsProvider && smsProvider !== "csv" && (
                <>
                  <div>
                    <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1D27" }}>API Key</label>
                    <input
                      type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste your API key"
                      className="w-full px-4 py-3 rounded-lg text-sm border outline-none"
                      style={{ borderColor: "#E0DDD8", background: "#FFFFFF", fontFamily: MONO }}
                    />
                    {selectedProvider?.helpUrl && (
                      <a href={selectedProvider.helpUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs mt-1.5 inline-flex items-center gap-1 hover:underline" style={{ color: "#E07B39" }}>
                        Where do I find my {selectedProvider.label} API key? <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <button
                    disabled={!apiKey || testStatus === "testing"} onClick={handleTestConnection}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
                    style={{ background: "#1A1D27", color: "#FFFFFF" }}
                  >
                    {testStatus === "testing" ? "Testing…" : "Test Connection"}
                  </button>
                  {testStatus === "success" && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <CheckCircle2 className="h-4 w-4" /> Connected to {connectedShopName}
                    </div>
                  )}
                  {testStatus === "error" && (
                    <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      {testError}
                    </div>
                  )}
                </>
              )}

              {smsProvider === "csv" && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "#FEF3E2", color: "#92400E" }}>
                  You'll receive CSV exports by email after each consumer assessment. You can import these into any shop management system.
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid #E0DDD8", color: "#6B7280" }}>
                Back
              </button>
              <button
                disabled={!step2Valid} onClick={() => setStep(3)}
                className="flex-1 px-6 py-3.5 rounded-lg font-semibold text-base disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "#E07B39", color: "#FFFFFF" }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Data Agreement */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A1D27" }}>Here's What We Share and What We Don't</h2>
            <p className="text-sm mb-8" style={{ color: "#6B7280" }}>Plain English. No legal tricks.</p>

            <div className="space-y-6">
              <div className="rounded-xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                <h3 className="font-semibold text-sm mb-2" style={{ color: "#16A34A" }}>What Wrenchli Sends You</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                  Customer name and contact, vehicle details including VIN if provided, symptom description, likely repair categories, and estimated cost range. This pre-populates your repair order so your service advisor starts the conversation already informed.
                </p>
              </div>

              <div className="rounded-xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                <h3 className="font-semibold text-sm mb-2" style={{ color: "#E07B39" }}>What You Confirm Back</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                  When you close a repair order for a Wrenchli customer, we ask you to confirm what you found and what you charged. This helps us improve our symptom-to-repair accuracy and powers your Verified Shop score.
                </p>
              </div>

              <div className="rounded-xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                <h3 className="font-semibold text-sm mb-2" style={{ color: "#1A1D27" }}>What We Never Share</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                  Your individual pricing is never shared with other shops. Your customer list is yours and always will be. Aggregate cost benchmarks are anonymized by zip code and repair type — no shop is ever identified individually.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreeData} onChange={(e) => setAgreeData(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded" />
                  <span className="text-sm" style={{ color: "#1A1D27" }}>
                    I understand and agree to share repair confirmation data with Wrenchli for the purpose of improving symptom assessment accuracy and enabling consumer financing.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreeAnonymized} onChange={(e) => setAgreeAnonymized(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded" />
                  <span className="text-sm" style={{ color: "#1A1D27" }}>
                    I understand that anonymized aggregate data from confirmed repairs may be used to train and improve Wrenchli's AI models.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(2)} className="px-5 py-3 rounded-lg text-sm font-medium" style={{ border: "1px solid #E0DDD8", color: "#6B7280" }}>
                Back
              </button>
              <button
                disabled={!step3Valid} onClick={handleComplete}
                className="flex-1 px-6 py-3.5 rounded-lg font-semibold text-base disabled:opacity-40"
                style={{ background: "#E07B39", color: "#FFFFFF" }}
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Confirmation */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#DCFCE7" }}>
              <CheckCircle2 className="h-8 w-8" style={{ color: "#16A34A" }} />
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#1A1D27" }}>You're In. Welcome to Wrenchli.</h2>
            <p className="text-sm mb-10" style={{ color: "#6B7280" }}>
              Your Verified status is <span className="font-semibold" style={{ color: "#E07B39" }}>Pending</span> — it becomes Active after your first confirmed repair outcome.
            </p>

            <div className="space-y-4 text-left">
              <div className="rounded-xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "#E07B39", color: "#FFF" }}>1</div>
                  <div>
                    <h4 className="font-semibold text-sm">Share your Wrenchli shop link with customers</h4>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs px-3 py-1.5 rounded" style={{ fontFamily: MONO, background: "#F8F8F6", border: "1px solid #E0DDD8", color: "#1A1D27" }}>
                        wrenchli.net/shop/{shopSlug || "your-shop"}
                      </code>
                      <button onClick={() => { navigator.clipboard.writeText(`wrenchli.net/shop/${shopSlug}`); toast({ title: "Copied!" }); }}
                        className="p-1.5 rounded hover:bg-gray-100">
                        <Copy className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "#E07B39", color: "#FFF" }}>2</div>
                  <div>
                    <h4 className="font-semibold text-sm">Your first Wrenchli customer will trigger a pre-populated repair order</h4>
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      {smsProvider === "csv" ? "You'll receive a CSV export by email." : `It will appear in ${selectedProvider?.label || "your SMS"} automatically.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "#E07B39", color: "#FFF" }}>3</div>
                  <div>
                    <h4 className="font-semibold text-sm">Confirm the outcome to earn your Verified badge</h4>
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      When you close that repair order, confirm what you found in Wrenchli. This powers your shop's Verified score.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/shop-portal"
              className="inline-flex items-center gap-2 mt-10 px-8 py-3.5 rounded-lg font-semibold text-base"
              style={{ background: "#E07B39", color: "#FFFFFF" }}
            >
              View Your Shop Dashboard <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple input component for the form
function Input({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1D27" }}>
        {label} {required && <span style={{ color: "#DC2626" }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full px-4 py-3 rounded-lg text-sm border outline-none focus:ring-2"
        style={{ borderColor: "#E0DDD8", background: "#FFFFFF" }}
      />
    </div>
  );
}
