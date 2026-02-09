import { useState } from "react";
import SEO from "@/components/SEO";
import heroShops from "@/assets/hero-shops.jpg";
import { supabase } from "@/integrations/supabase/client";
import {
  Store, ArrowRight, TrendingUp, DollarSign, Wrench, Star,
  CreditCard, BarChart3, Users, CheckCircle, Shield, Calendar,
  MessageSquare, ClipboardCheck, Eye, Zap, Building
} from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import StatCounter from "@/components/StatCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";

const steps = [
  { step: 1, title: "Join the Network", desc: "Submit your application, verify credentials, and go live in days — not weeks." },
  { step: 2, title: "Set Your Pricing", desc: "Set competitive rates and manage your availability calendar. You control your business." },
  { step: 3, title: "Receive Job Requests", desc: "Get full repair details including vehicle info, diagnosis, and customer financing status." },
  { step: 4, title: "Win the Work", desc: "Submit your best quote and let your reputation, reviews, and ratings speak for you." },
  { step: 5, title: "Get Paid Fast", desc: "Platform payment processing with direct payout. On financed repairs, the lender pays you directly." },
];

const benefits = [
  { icon: TrendingUp, title: "Pre-Qualified Leads", desc: "Customers come to you ready to book. They've already described their issue and are comparing shops — no tire-kickers." },
  { icon: DollarSign, title: "Bigger Tickets", desc: "Financing helps customers afford the repair they actually need — not just the minimum. Approve more work, grow revenue." },
  { icon: Wrench, title: "Modern Shop Software", desc: "Digital inspections, scheduling, CRM, and messaging — all in one platform designed for independent shops." },
  { icon: Star, title: "Build Your Reputation", desc: "Verified reviews tied to real repairs. Build trust with new customers and showcase your best work." },
  { icon: CreditCard, title: "Guaranteed Payment", desc: "No chasing invoices. Platform payments and lender direct-pay mean you get paid — fast and reliably." },
  { icon: BarChart3, title: "Business Insights", desc: "See your close rate, average ticket, customer satisfaction, and market positioning. Data to run your shop smarter." },
];

const platformTabs = [
  {
    value: "acquisition",
    label: "Customer Acquisition",
    features: [
      { icon: Users, title: "Quote Requests", desc: "Receive repair requests from local car owners with full vehicle and issue details." },
      { icon: Eye, title: "Local Visibility", desc: "Professional shop profile with your services, hours, photos, and location on the Wrenchli marketplace." },
      { icon: Star, title: "Verified Reviews", desc: "Real reviews from real customers, tied to completed repairs. No fake or purchased reviews." },
    ],
  },
  {
    value: "operations",
    label: "Shop Operations",
    features: [
      { icon: Calendar, title: "Online Scheduling", desc: "Customers book available slots directly. Sync with your existing calendar." },
      { icon: ClipboardCheck, title: "Digital Inspections", desc: "Send photo and video inspection reports to build trust and increase approval rates." },
      { icon: MessageSquare, title: "Messaging & Job Tracking", desc: "In-platform messaging with customers. Track job status from quote to completion." },
    ],
  },
  {
    value: "payments",
    label: "Payments & Financing",
    features: [
      { icon: CreditCard, title: "Integrated Payments", desc: "Accept credit cards, debit, and ACH — online and in-shop. Simple, transparent processing." },
      { icon: Zap, title: "POS Financing", desc: "Offer point-of-sale financing to every customer. Multiple lenders, all credit profiles." },
      { icon: DollarSign, title: "Direct Payout", desc: "Get paid within days. On financed repairs, the lender pays you directly — no waiting on the customer." },
    ],
  },
];

const faqs = [
  { q: "How much does Wrenchli cost for shops?", a: "$299/month per location for the full platform — marketplace listing, SaaS tools, payment processing, and customer management. Plus an 8% performance fee on jobs booked through the marketplace." },
  { q: "What's the 8% fee?", a: "We charge 8% of the job total on repairs booked through the Wrenchli marketplace. This is a performance-based fee — you only pay when you close a job. No upfront costs beyond the monthly subscription." },
  { q: "How do I get customers through Wrenchli?", a: "Customers search for repairs on Wrenchli and receive quotes from shops in their area. You set your own prices and respond to requests that match your services. Your reviews and ratings help you win work." },
  { q: "What's included in the $299/month?", a: "Everything: marketplace listing, quote management, online scheduling, digital inspections, customer CRM, messaging, payment processing, business analytics, and a professional shop profile page." },
  { q: "How does the financing work for my shop?", a: "When a customer chooses financing at checkout, they apply through our lending partners. Once approved, the lender pays you directly for the full repair amount — usually within 2-3 business days." },
  { q: "Do I have to change my workflow?", a: "Wrenchli is designed to fit into how you already work. Our onboarding team will help you get set up and trained. Most shops are fully operational within a few days." },
  { q: "How are shops verified?", a: "We verify licensing, insurance, and business history. We also monitor customer satisfaction ratings and review quality continuously. This protects both you and the customers." },
  { q: "Can I set my own prices?", a: "Absolutely. You set all your own pricing. Wrenchli never dictates what you charge. Customers compare on price, reviews, and availability — so competitive pricing helps, but it's always your call." },
];

const bayOptions = ["1-3 bays", "4-6 bays", "7-10 bays", "10+ bays"];

export default function ForShops() {
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
        state: null,
        message: form.message || null,
      });
      if (error) throw error;
      toast({ title: "Application received! 🔧", description: "We'll reach out about partnership opportunities soon." });
      setForm({ shopName: "", ownerName: "", email: "", phone: "", location: "", bays: "", message: "" });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="For Repair Shops"
        description="Grow your shop with pre-qualified leads, modern software, and embedded financing. $299/mo all-in-one platform for independent repair shops."
        path="/for-shops"
      />
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground section-padding overflow-hidden">
        <img src={heroShops} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60" />
        <div className="container-wrenchli text-center relative">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-wrenchli-trust-blue/20 px-4 py-1 text-sm font-medium text-wrenchli-trust-blue">
              <Store className="h-4 w-4" /> For Repair Shops
            </div>
            <h1 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              More Customers. Higher Tickets. Less Hassle.
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Pre-qualified customers who need repairs now. Built-in financing that helps them say yes. Modern tools to run your shop. All for one simple monthly fee.
            </p>
            <Button
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]"
              onClick={() => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" })}
            >
              Apply to Become a Partner Shop <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="bg-wrenchli-trust-blue text-white py-16 md:py-20">
        <div className="container-wrenchli">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <StatCounter end={55} suffix="%" label="Average bay underutilization we help fill" />
            <div className="text-center">
              <div className="font-stats text-4xl font-bold text-accent md:text-5xl lg:text-6xl">$299</div>
              <div className="mt-1 text-sm">/mo</div>
              <p className="mt-1 text-sm text-white/70">All-in-one shop management software</p>
            </div>
            <StatCounter end={8} suffix="%" label="Performance-based fee — pay when you close" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">How It Works</h2>
            <p className="mt-3 text-center text-muted-foreground md:text-lg">From application to revenue in five steps.</p>
          </SectionReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <SectionReveal key={s.step} delay={i * 100} className={i === 4 ? "md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto lg:max-w-none" : ""}>
                <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-wrenchli-trust-blue text-white font-heading font-bold">
                    {s.step}
                  </div>
                  <h3 className="font-heading text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Why Shops Choose Wrenchli</h2>
          </SectionReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <SectionReveal key={b.title} delay={i * 80}>
                <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wrenchli-trust-blue/10">
                    <b.icon className="h-5 w-5 text-wrenchli-trust-blue" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold">{b.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features — 3 Tabs */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-4xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Platform Features</h2>
            <p className="mt-3 text-center text-muted-foreground md:text-lg">Everything you need to grow your shop — in one platform.</p>
          </SectionReveal>

          <SectionReveal>
            <Tabs defaultValue="acquisition" className="mt-10">
              <TabsList className="grid w-full grid-cols-3 h-12">
                {platformTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs md:text-sm font-semibold h-10">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {platformTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-8">
                  <div className="grid gap-6 md:grid-cols-3">
                    {tab.features.map((f) => (
                      <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-wrenchli-trust-blue/10">
                          <f.icon className="h-5 w-5 text-wrenchli-trust-blue" />
                        </div>
                        <h3 className="font-heading text-sm font-semibold">{f.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </SectionReveal>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-lg">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Apply to Partner</h2>
            <p className="mt-3 text-center text-primary-foreground/70">We're onboarding shops in Detroit now. Fill out the form and we'll be in touch.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <Input placeholder="Shop name *" required value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="h-12 text-base bg-card text-foreground" maxLength={200} />
              <Input placeholder="Your name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="h-12 text-base bg-card text-foreground" maxLength={100} />
              <Input type="email" placeholder="Email *" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 text-base bg-card text-foreground" maxLength={255} />
              <Input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 text-base bg-card text-foreground" />
              <Input placeholder="City / Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-12 text-base bg-card text-foreground" maxLength={200} />
              <select
                value={form.bays}
                onChange={(e) => setForm({ ...form, bays: e.target.value })}
                className="flex h-12 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Number of Bays</option>
                {bayOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <textarea
                placeholder="Anything else you'd like us to know?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={500}
                rows={3}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <Button type="submit" disabled={loading} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base">
                {loading ? "Submitting..." : "Request Partnership Info"}
              </Button>
            </form>
          </SectionReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-8">Frequently Asked Questions</h2>
          </SectionReveal>
          <SectionReveal>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem value={`faq-${i}`} key={i}>
                  <AccordionTrigger className="text-left text-sm md:text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
