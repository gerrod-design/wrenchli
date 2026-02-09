import { useState } from "react";
import { Store, Calendar, ClipboardCheck, CreditCard, Users, TrendingUp, CheckCircle } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const features = [
  { icon: Calendar, title: "Smart Scheduling", desc: "Online booking, automated reminders, and calendar management built for busy shops." },
  { icon: ClipboardCheck, title: "Digital Inspections", desc: "Send photo/video inspection reports to customers. Build trust and increase approval rates." },
  { icon: CreditCard, title: "Integrated Payments", desc: "Accept payments online, in-shop, and through financing — all in one system." },
  { icon: Users, title: "Customer Management", desc: "CRM built for auto repair. Track vehicle history, send reminders, and retain customers." },
  { icon: TrendingUp, title: "Pre-Qualified Leads", desc: "Customers come to you ready to book. No more tire-kickers — just people who need repairs." },
  { icon: Store, title: "Your Shop, Online", desc: "A professional profile page with reviews, services, hours, and booking — no web design needed." },
];

export default function ForShops() {
  const [form, setForm] = useState({ shopName: "", ownerName: "", email: "", phone: "", location: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.shopName) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: "Application received! 🔧", description: "We'll reach out about early access for your shop." });
    setForm({ shopName: "", ownerName: "", email: "", phone: "", location: "" });
    setLoading(false);
  };

  return (
    <main className="pb-[60px] md:pb-0">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-wrenchli-trust-blue/20 px-4 py-1 text-sm font-medium text-wrenchli-trust-blue">
              <Store className="h-4 w-4" /> For Shop Owners
            </div>
            <h1 className="mt-4 font-heading text-3xl font-extrabold md:text-5xl">
              Grow your shop with modern tools.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-primary-foreground/70 md:text-lg">
              Pre-qualified customers, digital inspections, integrated payments, and a platform built for independent repair shops.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Everything your shop needs</h2>
          </SectionReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <SectionReveal key={f.title} delay={i * 100}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-wrenchli-trust-blue/10">
                    <f.icon className="h-5 w-5 text-wrenchli-trust-blue" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-lg text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">Simple Pricing</h2>
            <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="font-stats text-5xl font-bold text-accent">$299</div>
              <div className="mt-1 text-muted-foreground">/month per location</div>
              <ul className="mt-6 space-y-3 text-left text-sm">
                {["Full SaaS platform access", "Marketplace listing & lead gen", "Digital inspections & payments", "Customer CRM & reminders", "Dedicated onboarding support"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-wrenchli-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Early Access Form */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-lg">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Apply for Early Access</h2>
            <p className="mt-3 text-center text-primary-foreground/70">We're onboarding Detroit shops now. Get in early.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <Input placeholder="Shop name *" required value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="h-12 text-base bg-card text-foreground" maxLength={200} />
              <Input placeholder="Your name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="h-12 text-base bg-card text-foreground" maxLength={100} />
              <Input type="email" placeholder="Email *" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 text-base bg-card text-foreground" maxLength={255} />
              <Input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 text-base bg-card text-foreground" />
              <Input placeholder="Location (city, state)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-12 text-base bg-card text-foreground" maxLength={200} />
              <Button type="submit" disabled={loading} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base">
                {loading ? "Submitting..." : "Apply for Early Access"}
              </Button>
            </form>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
