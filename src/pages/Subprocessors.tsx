import SEO from "@/components/SEO";

const subprocessors = [
  {
    name: "Anthropic PBC",
    purpose: "AI symptom assessment generation",
    dataSent: "Symptom description, vehicle year/make/model",
    notes: "No training use",
  },
  {
    name: "Supabase Inc.",
    purpose: "Database and authentication",
    dataSent: "All user account and session data",
    notes: "SOC 2 Type II certified",
  },
  {
    name: "Vercel Inc.",
    purpose: "Hosting and CDN",
    dataSent: "Request logs",
    notes: "No personal data stored beyond standard logs",
  },
  {
    name: "Google AI (Gemini)",
    purpose: "Audio and video analysis features only",
    dataSent: "Audio/video recordings submitted for analysis",
    notes: "Subject to Google AI terms",
  },
  {
    name: "Stripe Inc.",
    purpose: "Payment processing (Pro subscriptions)",
    dataSent: "Payment card data",
    notes: "PCI DSS compliant, Wrenchli never stores card data",
  },
  {
    name: "NHTSA",
    purpose: "Vehicle recall lookup",
    dataSent: "VIN",
    notes: "US government public API, no data retained",
  },
];

export default function Subprocessors() {
  return (
    <>
      <SEO
        title="Subprocessors | Wrenchli"
        description="List of third-party services that process Wrenchli user data, including data handling details and compliance certifications."
        path="/subprocessors"
      />
      <main className="min-h-screen bg-background py-16 md:py-24 pb-[80px] md:pb-24">
        <div className="container-wrenchli max-w-4xl">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl mb-2">
            Subprocessors
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: April 2026
          </p>

          <p className="text-foreground/90 leading-relaxed mb-10">
            Wrenchli uses the following third-party services to operate our platform.
            Each service processes user data under a data processing agreement.
          </p>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-5 py-3 font-heading font-semibold text-foreground">Service</th>
                  <th className="px-5 py-3 font-heading font-semibold text-foreground">Purpose</th>
                  <th className="px-5 py-3 font-heading font-semibold text-foreground">Data Sent</th>
                  <th className="px-5 py-3 font-heading font-semibold text-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {subprocessors.map((sp, i) => (
                  <tr
                    key={sp.name}
                    className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  >
                    <td className="px-5 py-4 font-medium text-foreground whitespace-nowrap">{sp.name}</td>
                    <td className="px-5 py-4 text-foreground/80">{sp.purpose}</td>
                    <td className="px-5 py-4 text-foreground/80">{sp.dataSent}</td>
                    <td className="px-5 py-4 text-muted-foreground">{sp.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {subprocessors.map((sp) => (
              <div key={sp.name} className="rounded-xl border border-border bg-card p-5 space-y-2">
                <h3 className="font-heading font-semibold text-foreground">{sp.name}</h3>
                <p className="text-sm text-foreground/80"><span className="font-medium text-foreground">Purpose:</span> {sp.purpose}</p>
                <p className="text-sm text-foreground/80"><span className="font-medium text-foreground">Data sent:</span> {sp.dataSent}</p>
                <p className="text-sm text-muted-foreground">{sp.notes}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Questions about data processing? Email{" "}
              <a
                href="mailto:privacy@wrenchli.net"
                className="font-medium text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
              >
                privacy@wrenchli.net
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
