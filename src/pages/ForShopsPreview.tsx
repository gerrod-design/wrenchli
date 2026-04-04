import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Store, Users, ClipboardCheck, DollarSign, Shield, CheckCircle2, Clock, MessageSquare, ChevronRight, BadgeCheck, FileText, Upload } from "lucide-react";
import wrenchliLogo from "@/assets/wrenchli-logo-dark.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const FONT = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const smsProviders = [
  "Tekmetric", "Mitchell 1", "AutoLeap", "ShopWare", "Protractor",
  "ROWriter", "Fullbay", "NAPA TRACS", "Other (CSV only)"
];

export default function ForShopsPreview() {
  const [form, setForm] = useState({ name: "", shopName: "", email: "", phone: "", smsProvider: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.shopName || !form.email) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: `Shop Pilot Application — Shop: ${form.shopName}, SMS: ${form.smsProvider || "Not specified"}`,
      });
      if (error) throw error;
      toast({ title: "Application received!", description: "We'll be in touch within 48 hours." });
      setForm({ name: "", shopName: "", email: "", phone: "", smsProvider: "" });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: FONT }}>
      {/* Back link */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/design-preview" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#1A1D27", border: "1px solid #2A2D37", color: "#9CA3AF" }}>
          <ArrowLeft className="h-4 w-4" /> Back to preview
        </Link>
      </div>

      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "#1A1D27", background: "#0F1117" }}>
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight" style={{ color: "#F5F5F5" }}>
          <img src={wrenchliLogo} alt="Wrenchli" className="h-8 w-8 object-contain" />
          Wrenchli
        </span>
        <a href="#apply" className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#E07B39", color: "#0F1117" }}>
          Request a Pilot
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: "#0F1117", minHeight: "60vh" }}>
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(135deg, rgba(224,123,57,0.12) 0%, rgba(15,17,23,0.95) 60%)" }} />
        <div className="relative z-10 px-6 py-24 max-w-4xl mx-auto text-center flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: "rgba(224,123,57,0.15)", border: "1px solid rgba(224,123,57,0.3)", color: "#E07B39" }}>
            <Store className="h-3 w-3" /> For Repair Shops
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight" style={{ color: "#FFFFFF" }}>
            Better Customers.<br />
            <span style={{ color: "#E07B39" }}>Before They Walk In.</span>
          </h1>
          <p className="mt-6 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Wrenchli sends you pre-assessed customers who already understand their symptoms, know what questions to ask, and are ready to approve the repair. No more 20-minute intake conversations. No more pricing disputes with uninformed customers.
          </p>
          <a href="#apply" className="mt-10 inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base" style={{ background: "#E07B39", color: "#0F1117" }}>
            Request a Pilot <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      {/* ── Everything below: warm light ── */}
      <div style={{ background: "#F8F8F6", color: "#1A1D27" }}>

        {/* SECTION 1 — The Problem */}
        <section className="px-6 py-20 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center tracking-tight mb-4" style={{ color: "#1A1D27" }}>
            The Problems You Live With Every Day
          </h2>
          <p className="text-center text-lg mb-12 max-w-2xl mx-auto" style={{ color: "#6B7280" }}>
            These cost you time, money, and reputation — and none of them are about your technical skill.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Uninformed Customers", desc: "Customers arrive scared and defensive, having Googled their symptoms at midnight. They argue about price because they have no frame of reference." },
              { icon: Clock, title: "Intake Time", desc: "Your service advisor spends 15–20 minutes per customer just capturing basic vehicle and symptom information that the customer already knows." },
              { icon: DollarSign, title: "Repair Abandonment", desc: "Customers approve only part of the repair they need because they ran out of money. You lose revenue. They come back with a bigger problem." },
            ].map((c) => (
              <div key={c.title} className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#FEE2E2" }}>
                  <c.icon className="h-5 w-5" style={{ color: "#DC2626" }} />
                </div>
                <h3 className="font-semibold mb-2">{c.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2 — What Wrenchli Changes */}
        <section className="px-6 py-20" style={{ background: "#F0EFEC" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center tracking-tight mb-4" style={{ color: "#1A1D27" }}>
              What Wrenchli Changes
            </h2>
            <p className="text-center text-lg mb-12 max-w-2xl mx-auto" style={{ color: "#6B7280" }}>
              Same shop. Same technicians. Better-prepared customers.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: CheckCircle2, title: "Prepared Customers", desc: "Wrenchli customers arrive having already described their symptoms, reviewed likely causes, and seen a fair cost range. They trust the process before they trust you — and then they trust you faster." },
                { icon: ClipboardCheck, title: "Pre-Populated Intake", desc: "Customer vehicle and symptom data flows directly into your shop management system before they arrive. Your service advisor starts the conversation already informed." },
                { icon: DollarSign, title: "Repair Financing", desc: "Customers who need help paying for the full repair can access short-term financing through Wrenchli. You get paid in full. They get the repair they actually need." },
              ].map((c) => (
                <div key={c.title} className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "#DCFCE7" }}>
                    <c.icon className="h-5 w-5" style={{ color: "#16A34A" }} />
                  </div>
                  <h3 className="font-semibold mb-2">{c.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 — How It Works */}
        <section className="px-6 py-20 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center tracking-tight mb-12" style={{ color: "#1A1D27" }}>
            How It Works for Your Shop
          </h2>
          <div className="space-y-6">
            {[
              { num: "1", title: "Customer assesses their symptoms on Wrenchli", desc: "They describe what's wrong and receive a structured repair likelihood report with cost estimates." },
              { num: "2", title: "Customer selects your shop", desc: "They choose your shop from Verified Wrenchli Shops in their area." },
              { num: "3", title: "Vehicle and symptom data pre-populates your repair order", desc: "No re-entering vehicle info. No guessing what the customer meant." },
              { num: "4", title: "Your technician performs the professional assessment and repair", desc: "Your diagnostic process is unchanged. Wrenchli improves intake, not the technical repair." },
              { num: "5", title: "You confirm the outcome in Wrenchli", desc: "A quick confirmation of what you found and charged. Earns your shop a Verified performance score." },
              { num: "6", title: "Your shop ranks higher in Wrenchli recommendations", desc: "Shops with strong symptom-to-repair match rates and fair pricing appear first." },
            ].map((step) => (
              <div key={step.num} className="flex gap-4 items-start">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm" style={{ background: "#E07B39", color: "#FFFFFF" }}>
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "#6B7280" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 — Verified Shop Badge */}
        <section className="px-6 py-20" style={{ background: "#F0EFEC" }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ background: "#FFFFFF", border: "2px solid #E07B39", color: "#E07B39" }}>
              <BadgeCheck className="h-5 w-5" /> Verified Wrenchli Shop
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: "#1A1D27" }}>
              Earn Your Verified Badge
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: "#6B7280" }}>
              Visible to every Wrenchli customer searching for a shop in your area. Shows your track record in three key metrics:
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { label: "Symptom-to-Repair Match Rate", value: "92%", desc: "How often your findings match the Wrenchli assessment" },
                { label: "Cost Fairness Rating", value: "A+", desc: "Your pricing vs. local average for the same repair" },
                { label: "Customer Satisfaction", value: "4.8★", desc: "Post-repair feedback from Wrenchli customers" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8" }}>
                  <div className="text-3xl font-bold mb-2" style={{ fontFamily: MONO, color: "#E07B39" }}>{m.value}</div>
                  <div className="font-semibold text-sm mb-1">{m.label}</div>
                  <div className="text-xs" style={{ color: "#6B7280" }}>{m.desc}</div>
                </div>
              ))}
            </div>
            <a href="#apply" className="inline-flex items-center gap-2 mt-10 px-6 py-3 rounded-lg font-semibold text-sm" style={{ background: "#E07B39", color: "#FFFFFF" }}>
              Apply for Verified Status <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* SECTION 5 — SMS Integration */}
        <section className="px-6 py-20 max-w-4xl mx-auto text-center">
          <MessageSquare className="h-10 w-10 mx-auto mb-4" style={{ color: "#E07B39" }} />
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: "#1A1D27" }}>
            Connects to Your Shop Management System
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: "#6B7280" }}>
            No new software to learn. Customer data arrives in the system you already use.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {["Tekmetric", "Mitchell 1", "AutoLeap", "ShopWare", "Protractor", "ROWriter", "Fullbay", "NAPA TRACS"].map((name) => (
              <div key={name} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: "#FFFFFF", border: "1px solid #E0DDD8", color: "#1A1D27" }}>
                {name}
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Don't see your system? We support <span className="font-semibold" style={{ color: "#1A1D27" }}>CSV import</span> for any platform.
          </p>
        </section>

        {/* SECTION 6 — Pilot Application */}
        <section id="apply" className="px-6 py-20" style={{ background: "#F0EFEC" }}>
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center tracking-tight mb-2" style={{ color: "#1A1D27" }}>
              Join the Pilot Program
            </h2>
            <p className="text-center text-sm mb-8" style={{ color: "#6B7280" }}>
              Currently accepting shops in Michigan and Ohio. Free to join. No commitment. Cancel anytime.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  required placeholder="Your name" value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg text-sm border outline-none focus:ring-2"
                  style={{ borderColor: "#E0DDD8", background: "#FFFFFF" }}
                />
                <input
                  required placeholder="Shop name" value={form.shopName}
                  onChange={(e) => setForm(f => ({ ...f, shopName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg text-sm border outline-none focus:ring-2"
                  style={{ borderColor: "#E0DDD8", background: "#FFFFFF" }}
                />
              </div>
              <input
                required type="email" placeholder="Email" value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm border outline-none focus:ring-2"
                style={{ borderColor: "#E0DDD8", background: "#FFFFFF" }}
              />
              <input
                type="tel" placeholder="Phone (optional)" value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm border outline-none focus:ring-2"
                style={{ borderColor: "#E0DDD8", background: "#FFFFFF" }}
              />
              <select
                value={form.smsProvider}
                onChange={(e) => setForm(f => ({ ...f, smsProvider: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm border outline-none focus:ring-2"
                style={{ borderColor: "#E0DDD8", background: "#FFFFFF", color: form.smsProvider ? "#1A1D27" : "#9CA3AF" }}
              >
                <option value="">Which SMS system do you use?</option>
                {smsProviders.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button
                type="submit" disabled={submitting}
                className="w-full px-6 py-3.5 rounded-lg font-semibold text-base disabled:opacity-50"
                style={{ background: "#E07B39", color: "#FFFFFF" }}
              >
                {submitting ? "Submitting…" : "Apply for Pilot"}
              </button>
            </form>
          </div>
        </section>

        {/* Footer note */}
        <div className="text-center py-10 text-xs" style={{ color: "#9CA3AF", borderTop: "1px solid #E0DDD8" }}>
          This is a design concept preview. Your current site is unchanged.
        </div>
      </div>
    </div>
  );
}
