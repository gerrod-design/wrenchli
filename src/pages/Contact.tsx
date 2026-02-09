import { useState } from "react";
import { MapPin, Linkedin, Mail } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const subjects = ["General Inquiry", "Partnership", "Shop Onboarding", "Press / Media", "Other"];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: subjects[0], message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.message) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: "Message sent! ✉️", description: "We'll get back to you as soon as possible." });
    setForm({ name: "", email: "", subject: subjects[0], message: "" });
    setLoading(false);
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl">Contact Us</h1>
            <p className="mt-4 text-primary-foreground/70 md:text-lg">Have a question, partnership idea, or just want to say hello?</p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli grid gap-12 md:grid-cols-2 max-w-4xl">
          <SectionReveal>
            <h2 className="font-heading text-xl font-bold md:text-2xl mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 text-base" maxLength={100} />
              <Input type="email" placeholder="Email *" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 text-base" maxLength={255} />
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <textarea
                placeholder="Your message *"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={1000}
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <Button type="submit" disabled={loading} className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base">
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </SectionReveal>

          <SectionReveal delay={200}>
            <h2 className="font-heading text-xl font-bold md:text-2xl mb-6">Get in touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-accent shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Headquarters</div>
                  <p className="text-sm text-muted-foreground">Detroit, Michigan</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5 text-accent shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Email</div>
                  <p className="text-sm text-muted-foreground">hello@wrenchli.net</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Linkedin className="h-5 w-5 mt-0.5 text-accent shrink-0" />
                <div>
                  <div className="font-semibold text-sm">LinkedIn</div>
                  <a
                    href="https://linkedin.com/company/wrenchli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    linkedin.com/company/wrenchli
                  </a>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
