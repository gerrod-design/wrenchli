import { useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Store } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const benefits = [
  "Weekly predictive maintenance alerts for vehicles in your area",
  "Know which customers need service BEFORE they call",
  "Data-driven customer acquisition (not cold calls)",
  "Backed by State of Michigan Economic Development",
  "University research partnership validation",
  "3-month pilot with performance tracking",
];

const bayOptions = ["1-3 bays", "4-6 bays", "7-10 bays", "10+ bays"];

export default function Pilot() {
  const [form, setForm] = useState({
    shopName: "", ownerName: "", email: "", phone: "", location: "", bays: "", message: "",
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
        city: form.location || null,
        state: "Michigan",
        message: `PILOT APPLICATION: Bays: ${form.bays || 'Not specified'}. ${form.message || 'No additional notes'}`,
      });
      if (error) throw error;
      toast({
        title: "Application received! 🎯",
        description: "We'll contact you within 2 business days about the pilot program.",
      });
      setForm({ shopName: "", ownerName: "", email: "", phone: "", location: "", bays: "", message: "" });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Michigan Pilot Program"
        description="Join Wrenchli's Michigan repair shop pilot. Get weekly predictive maintenance alerts for vehicles in your area."
        path="/pilot"
      />

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground py-20 md:py-28">
        <div className="container-wrenchli text-center max-w-3xl mx-auto">
          <SectionReveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 text-accent px-4 py-1.5 text-sm font-semibold mb-6">
              <Store className="h-4 w-4" />
              Michigan Pilot Program
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Know Which Customers Need Service BEFORE They Call
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 leading-relaxed">
              Join Michigan's repair shop modernization pilot. Get weekly predictive maintenance alerts for vehicles in your area.
            </p>
            <div className="inline-flex flex-col items-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 px-8 py-5">
              <p className="text-sm text-primary-foreground/60 mb-1">3-Month Pilot</p>
              <p className="text-3xl font-heading font-bold">$500</p>
              <p className="text-sm text-primary-foreground/60">or FREE for select shops</p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Backed By */}
      <section className="bg-accent py-6">
        <div className="container-wrenchli text-center">
          <p className="text-xs uppercase tracking-widest text-accent-foreground/60 mb-3">Pilot Supported By</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-accent-foreground">
            <div className="text-lg font-semibold">State of Michigan Economic Development</div>
            <div className="hidden sm:block w-px h-8 bg-accent-foreground/30" />
            <div className="text-lg font-semibold">University Research Partners</div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-4">
              What's Included in the Pilot
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              3-month pilot program starting March 2026. We track performance and you keep the data.
            </p>
          </SectionReveal>

          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <SectionReveal key={benefit} delay={i * 80}>
                <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                  <CheckCircle className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                  <p className="text-base">{benefit}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-10">
              How the Pilot Works
            </h2>
          </SectionReveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: 1, title: "Apply & Get Approved", desc: "Submit application, we review within 2 business days" },
              { step: 2, title: "Receive Weekly Alerts", desc: "Get predictive maintenance alerts for vehicles in your area" },
              { step: 3, title: "Track Performance", desc: "We measure customer acquisition, you keep the data" },
            ].map((item, i) => (
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
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wrenchli max-w-lg">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-3">
              Apply for Pilot Program
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Limited to 50-100 Michigan shops. Apply now to secure your spot.
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
              <Input
                placeholder="City / Location (Michigan) *"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-12 text-base"
                maxLength={100}
              />
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
              Questions? Email pilot@wrenchli.net or call (313) XXX-XXXX
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
