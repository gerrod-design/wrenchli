import SEO from "@/components/SEO";
import { Mail, ShieldCheck, BarChart3, Clock, Ban } from "lucide-react";

const sections = [
  {
    icon: BarChart3,
    title: "What It Measures",
    body: "The Verified Score reflects three things: how often a shop's repair matched what our assessment predicted (symptom-to-repair accuracy), how their pricing compares to the local market average (cost fairness), and ratings from consumers who visited through Wrenchli (satisfaction).",
  },
  {
    icon: Clock,
    title: "When It Appears",
    body: "A Verified Score is only displayed after a shop has at least 5 confirmed outcomes. New partner shops show a "New Partner" badge while their score is building.",
  },
  {
    icon: ShieldCheck,
    title: "How to Dispute",
    body: "If you believe an outcome was recorded incorrectly — for example, a customer declined the recommended repair and the mismatch is being counted against you — you can flag it within 30 days. Flagged outcomes are reviewed by the Wrenchli team before being counted.",
  },
  {
    icon: Ban,
    title: "What It Is Not",
    body: "The Verified Score cannot be purchased, boosted, or influenced by Wrenchli staff. Shops with higher scores appear earlier in consumer results — nothing else affects that ranking.",
  },
];

export default function VerifiedScore() {
  return (
    <>
      <SEO
        title="How the Verified Score Works | Wrenchli"
        description="Learn how Wrenchli calculates the Verified Score for repair shops — based on accuracy, cost fairness, and customer satisfaction."
        path="/verified-score"
      />
      <main className="min-h-screen pt-10 pb-20 px-4" style={{ background: "#0A0C10" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2" style={{ color: "#F5F5F5" }}>
            How the Verified Score Works
          </h1>
          <p className="text-sm mb-10" style={{ color: "#6B7280" }}>
            Transparency is non-negotiable. Here's exactly how we score partner shops.
          </p>

          <div className="space-y-6">
            {sections.map((s) => (
              <section
                key={s.title}
                className="rounded-lg p-5"
                style={{ background: "#0F1117", border: "1px solid #2A2D37" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <s.icon className="h-5 w-5 shrink-0" style={{ color: "#E07B39" }} />
                  <h2 className="text-base font-heading font-semibold" style={{ color: "#F5F5F5" }}>
                    {s.title}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
                  {s.body}
                </p>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div
            className="mt-10 rounded-lg p-5 text-center"
            style={{ background: "#E07B3910", border: "1px solid #E07B39" }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: "#F5F5F5" }}>
              Questions about your score?
            </p>
            <a
              href="mailto:partners@wrenchli.net"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "#E07B39", color: "#0F1117" }}
            >
              <Mail className="h-4 w-4" />
              Email partners@wrenchli.net
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
