import SEO from "@/components/SEO";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read Wrenchli's Terms of Service governing your use of our vehicle repair assessment and shop-matching platform."
        path="/terms"
      />
      <main className="min-h-screen bg-background py-16 md:py-24">
        <div className="container-wrenchli max-w-3xl">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: March 21, 2026
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Wrenchli's website and services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use our Services. Wrenchli, Inc. ("Wrenchli," "we," "our," or "us") is a Delaware corporation.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">2. Description of Services</h2>
              <p>Wrenchli provides:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI-powered vehicle assessment tools and symptom analysis</li>
                <li>Repair cost estimates and financing pre-qualification</li>
                <li>Local repair shop discovery and quote requests</li>
                <li>Vehicle maintenance tracking and recall alerts</li>
                <li>Photo-based damage assessment</li>
                <li>DIY repair guidance and tutorials</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">3. Disclaimer — Not Professional Advice</h2>
              <p>
                <strong>Wrenchli's assessment tools provide informational estimates only.</strong> Our AI-generated assessments, repair cost estimates, and recommendations are not substitutes for professional automotive inspection. Always consult a qualified mechanic before making repair decisions. Wrenchli is not liable for decisions made based on our assessment outputs.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">4. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate vehicle and contact information</li>
                <li>Use the Services for lawful purposes only</li>
                <li>Not attempt to reverse-engineer, scrape, or misuse the platform</li>
                <li>Not submit false or misleading repair requests</li>
                <li>Comply with all applicable local, state, and federal laws</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">5. Repair Shop Relationships</h2>
              <p>
                Wrenchli connects vehicle owners with independent repair shops. We do not employ, endorse, or guarantee the work of any repair shop listed on Wrenchli. Any agreement for repair services is between you and the shop. Wrenchli is not a party to those transactions and assumes no liability for the quality, timeliness, or outcome of repairs.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">6. Cost Estimates & Financing</h2>
              <p>
                Repair cost estimates are approximations based on publicly available data and AI models. Actual repair costs may vary based on your vehicle's condition, location, parts availability, and shop pricing. Financing options shown are illustrative and subject to lender approval and terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">7. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Services — including text, graphics, logos, icons, and software — are owned by Wrenchli, Inc. and protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">8. API & Developer Access</h2>
              <p>
                Access to Wrenchli's API is governed by separate API terms. API keys are personal and non-transferable. Misuse, excessive requests, or commercial redistribution of API data without authorization may result in access revocation.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Wrenchli shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Services, including but not limited to vehicle damage, financial loss, or personal injury resulting from reliance on our assessment tools or shop recommendations.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Wrenchli, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Services or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">11. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to the Services at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">12. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of Delaware.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">13. Changes to Terms</h2>
              <p>
                We may revise these Terms at any time. Material changes will be communicated by updating the "Last updated" date. Continued use of the Services after changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">14. Contact</h2>
              <p>
                Questions about these Terms? Contact us at{" "}
                <a href="mailto:legal@wrenchli.net" className="text-accent hover:underline font-medium">
                  legal@wrenchli.net
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
