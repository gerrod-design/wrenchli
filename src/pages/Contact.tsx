import { useState } from "react";
import { MapPin, Mail, Phone, Car, Store } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const bayOptions = ["1-3 bays", "4-6 bays", "7-10 bays", "10+ bays"];

export default function Contact() {
  const [consumerForm, setConsumerForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [shopForm, setShopForm] = useState({ shopName: "", name: "", email: "", phone: "", city: "", bays: "", message: "" });
  const [loadingConsumer, setLoadingConsumer] = useState(false);
  const [loadingShop, setLoadingShop] = useState(false);

  const submitConsumer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerForm.email || !consumerForm.message) return;
    setLoadingConsumer(true);
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: "Message sent! ✉️", description: "We'll get back to you as soon as possible." });
    setConsumerForm({ name: "", email: "", phone: "", message: "" });
    setLoadingConsumer(false);
  };

  const submitShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopForm.email || !shopForm.shopName) return;
    setLoadingShop(true);
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: "Request received! 🔧", description: "Our partnerships team will be in touch soon." });
    setShopForm({ shopName: "", name: "", email: "", phone: "", city: "", bays: "", message: "" });
    setLoadingShop(false);
  };

  return (
    <main className="pb-[60px] md:pb-0">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl lg:text-6xl">Get in Touch</h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Whether you're a car owner with a question or a shop interested in partnering — we'd love to hear from you.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Dual Forms */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli grid gap-8 md:grid-cols-2 max-w-5xl">
          {/* Car Owners */}
          <SectionReveal>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 h-full">
              <div className="inline-flex items-center gap-2 rounded-full bg-wrenchli-green/10 px-3 py-1 text-sm font-medium text-wrenchli-green mb-4">
                <Car className="h-4 w-4" /> For Car Owners
              </div>
              <h2 className="font-heading text-xl font-bold md:text-2xl">Have a Question?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Ask us anything about Wrenchli, repairs, or how it works.</p>
              <form onSubmit={submitConsumer} className="mt-6 space-y-4">
                <Input placeholder="Your name" value={consumerForm.name} onChange={(e) => setConsumerForm({ ...consumerForm, name: e.target.value })} className="h-12 text-base" maxLength={100} />
                <Input type="email" placeholder="Email *" required value={consumerForm.email} onChange={(e) => setConsumerForm({ ...consumerForm, email: e.target.value })} className="h-12 text-base" maxLength={255} />
                <Input type="tel" placeholder="Phone (optional)" value={consumerForm.phone} onChange={(e) => setConsumerForm({ ...consumerForm, phone: e.target.value })} className="h-12 text-base" />
                <textarea
                  placeholder="Your message *"
                  required
                  value={consumerForm.message}
                  onChange={(e) => setConsumerForm({ ...consumerForm, message: e.target.value })}
                  maxLength={1000}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <Button type="submit" disabled={loadingConsumer} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base">
                  {loadingConsumer ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </SectionReveal>

          {/* Repair Shops */}
          <SectionReveal delay={150}>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 h-full">
              <div className="inline-flex items-center gap-2 rounded-full bg-wrenchli-trust-blue/10 px-3 py-1 text-sm font-medium text-wrenchli-trust-blue mb-4">
                <Store className="h-4 w-4" /> For Repair Shops
              </div>
              <h2 className="font-heading text-xl font-bold md:text-2xl">Interested in Partnering?</h2>
              <p className="mt-2 text-sm text-muted-foreground">We're onboarding shops in Detroit. Tell us about yours.</p>
              <form onSubmit={submitShop} className="mt-6 space-y-4">
                <Input placeholder="Shop name *" required value={shopForm.shopName} onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })} className="h-12 text-base" maxLength={200} />
                <Input placeholder="Your name" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} className="h-12 text-base" maxLength={100} />
                <Input type="email" placeholder="Email *" required value={shopForm.email} onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })} className="h-12 text-base" maxLength={255} />
                <Input type="tel" placeholder="Phone" value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} className="h-12 text-base" />
                <Input placeholder="City / Location" value={shopForm.city} onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })} className="h-12 text-base" maxLength={200} />
                <select
                  value={shopForm.bays}
                  onChange={(e) => setShopForm({ ...shopForm, bays: e.target.value })}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Number of Bays</option>
                  {bayOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <textarea
                  placeholder="Tell us more about your shop"
                  value={shopForm.message}
                  onChange={(e) => setShopForm({ ...shopForm, message: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <Button type="submit" disabled={loadingShop} className="w-full h-12 bg-wrenchli-trust-blue text-white hover:bg-wrenchli-trust-blue/90 font-semibold text-base">
                  {loadingShop ? "Submitting..." : "Request Partnership Info"}
                </Button>
              </form>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Contact Info */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-10">Contact Information</h2>
          </SectionReveal>
          <div className="grid gap-6 sm:grid-cols-3">
            <SectionReveal>
              <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-6">
                <Mail className="h-6 w-6 text-accent mb-3" />
                <div className="font-heading text-sm font-semibold">Email</div>
                <a href="mailto:info@wrenchli.net" className="mt-1 text-sm text-accent hover:underline">info@wrenchli.net</a>
              </div>
            </SectionReveal>
            <SectionReveal delay={100}>
              <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-6">
                <Phone className="h-6 w-6 text-accent mb-3" />
                <div className="font-heading text-sm font-semibold">Phone</div>
                <a href="tel:+12484638905" className="mt-1 text-sm text-accent hover:underline">(248) 463-8905</a>
              </div>
            </SectionReveal>
            <SectionReveal delay={200}>
              <div className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-6">
                <MapPin className="h-6 w-6 text-accent mb-3" />
                <div className="font-heading text-sm font-semibold">Headquarters</div>
                <p className="mt-1 text-sm text-muted-foreground">Detroit, Michigan</p>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>
    </main>
  );
}
