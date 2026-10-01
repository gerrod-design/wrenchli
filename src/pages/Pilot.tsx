import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Store, ArrowRight } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const included = [
  "Customers arrive pre-assessed — symptoms, likely causes, and a fair cost range attached",
  "Free referrals for 90 days. No exclusivity, no volume commitments",
  "A 2-minute outcome report per referral — the price of admission, and what makes every referral smarter",
  "Founding terms on paid partner tiers before public pricing",
];

const steps = [
  { step: 1, title: "Apply", desc: "Tell us about your shop. We review applications within 2 business days." },
  { step: 2, title: "Get referrals", desc: "Customers arrive with their symptoms, likely causes, and a fair cost range already assessed." },
  { step: 3, title: "Confirm outcomes", desc: "A 2-minute report per referral: what you found, what was done, what it cost." },
];

const bayOptions = ["1-3 bays", "4-6 bays", "7-10 bays", "10+ bays"];

export default function Pilot() {
  const [form, setForm] = useState({
    shopName: "", ownerName: "", email: "", phone: "", city: "", state: "", bays: "", message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.shopName) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("shop_applications").insert({
        shop_name: form.shopName,
        owner_name: form.ownerName || null,
        email: form.email,
        phone: form.phone || null,
        city: form.city || null,
        state: form.state || null,
        message: `PILOT APPLICATION: Bays: ${form.bays || 'Not specified'}. ${form.message || 'No additional notes'}`,
      });
      if (error) throw error;
      toast({
        title: "Application received",
        description: "We'll contact you within 2 business days about the pilot program.",
      });
      setForm({ shopName: "", ownerName: "", email: "", phone: "", city: "", state: "", bays: "", message: "" });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Free Referral Pilot for Repair Shops"
        description="Wrenchli's free 90-day referral pilot for independent repair shops in Detroit and Columbus, Ohio. Customers arrive pre-assessed with symptoms, likely causes, and a fair cost range."
        path="/pilot"
      />

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground py-20 md:py-28">
        <div className="container-wrenchli text-center max-w-3xl mx-auto">
          <SectionReveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 text-accent px-4 py-1.5 text-sm font-semibold mb-6">
              <Store className="h-4 w-4" />
              Now enrolling: Detroit + Columbus, Ohio
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Free Referral Pilot for Repair Shops
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 leading-relaxed">
              90 days. Free referrals. Customers arrive pre-assessed — symptoms,
              likely causes, and a fair cost range — before they walk in.
            </p>
            <div className="inline-flex flex-col items-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 px-8 py-5">
              <p className="text-sm text-primary-foreground/60 mb-1">90-Day Pilot</p>
              <p className="text-3xl font-heading font-bold">Free</p>
              <p className="text-sm text-primary-foreground/60">No exclusivity, no volume commitments</p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-4">
              What's included in the pilot
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              Everything a shop needs to turn Wrenchli assessments into booked jobs.
            </p>
          </SectionReveal>

          <div className="space-y-4">
            {included.map((item, i) => (
              <SectionReveal key={item} delay={i * 80}>
                <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                  <CheckCircle className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                  <p className="text-base">{item}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-10">
              How the pilot works
            </h2>
          </SectionReveal>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((item, i) => (
              <SectionReveal key={item.step} delay={i * 100}>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-heading font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="font-heading text-base font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>

          <SectionReveal>
            <p className="mt-10 text-center text-muted-foreground">
              Detroit shop? <Link to="/for-shops" className="text-accent underline hover:text-accent/80">See the Detroit pilot page <ArrowRight className="inline h-4 w-4" /></Link>
              <span className="mx-3">·</span>
              Columbus shop? <Link to="/columbus-shops" className="text-accent underline hover:text-accent/80">See the Columbus pilot page <ArrowRight className="inline h-4 w-4" /></Link>
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wrenchli max-w-lg">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-3">
              Apply for the pilot
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Independent shops in Detroit and Columbus, Ohio. Apply now to secure your spot.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Shop name *"
                required
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="h-12 text-base"
                maxLength={100}
              />
              <Input
                placeholder="Your name"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="h-12 text-base"
                maxLength={100}
              />
              <Input
                type="email"
                placeholder="Email *"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 text-base"
                maxLength={255}
              />
              <Input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-12 text-base"
                maxLength={20}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City *"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-12 text-base"
                  maxLength={100}
                />
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">State *</option>
                  <option value="Michigan">Michigan</option>
                  <option value="Ohio">Ohio</option>
                </select>
              </div>
              <select
                value={form.bays}
                onChange={(e) => setForm({ ...form, bays: e.target.value })}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Number of Bays</option>
                {bayOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <textarea
                placeholder="Anything else we should know?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                maxLength={1000}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base"
              >
                {loading ? "Submitting..." : "Apply to Pilot Program"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Questions? <Link to="/contact" className="text-accent underline hover:text-accent/80">Contact us</Link>
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
