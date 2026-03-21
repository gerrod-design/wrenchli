import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Learn how Wrenchli collects, uses, and protects your personal information. Your privacy matters to us."
        path="/privacy"
      />
      <main className="min-h-screen bg-background py-16 md:py-24">
        <div className="container-wrenchli max-w-3xl">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: March 21, 2026
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">1. Introduction</h2>
              <p>
                Wrenchli, Inc. ("Wrenchli," "we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at wrenchli.net and use our services.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">2. Information We Collect</h2>
              <h3 className="font-heading text-lg font-medium text-foreground">Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contact information (name, email, phone number)</li>
                <li>Vehicle information (make, model, year, VIN, mileage)</li>
                <li>Repair and maintenance descriptions</li>
                <li>Photos uploaded for damage diagnosis</li>
                <li>ZIP code and general location for shop matching</li>
              </ul>

              <h3 className="font-heading text-lg font-medium text-foreground mt-4">Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Browser type and version</li>
                <li>Device type and operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>IP address (anonymized for analytics)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide vehicle diagnostics, repair estimates, and shop recommendations</li>
                <li>Connect you with local repair shops</li>
                <li>Send maintenance reminders and recall alerts (with your consent)</li>
                <li>Improve our services and user experience</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">4. VIN & Vehicle Data</h2>
              <p>
                Your Vehicle Identification Number (VIN) is used solely to identify your vehicle's specifications for accurate diagnosis, parts lookup, and recall checks. VINs are not stored beyond your current session unless you explicitly save a vehicle to your garage. We do not sell or share VIN data with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">5. Local Storage & Cookies</h2>
              <p>
                Wrenchli uses browser local storage to save your garage vehicles and preferences on your device. This data stays on your device and is not transmitted to our servers unless you choose to sync. Clearing your browser data will remove locally stored vehicles.
              </p>
              <p>
                We use essential cookies for site functionality and optional analytics cookies to understand usage patterns. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">6. Data Sharing & Disclosure</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Repair shops</strong> — only when you request a quote or schedule service</li>
                <li><strong>Service providers</strong> — who help us operate our platform (e.g., hosting, analytics)</li>
                <li><strong>Legal requirements</strong> — when required by law or to protect our rights</li>
              </ul>
              <p className="mt-2">We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">7. Data Security</h2>
              <p>
                We implement industry-standard security measures including encryption in transit (TLS/SSL), secure data storage, and access controls. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">8. Your Rights</h2>
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access, correct, or delete your personal information</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, contact us at{" "}
                <a href="mailto:privacy@wrenchli.net" className="text-accent hover:underline font-medium">
                  privacy@wrenchli.net
                </a>.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">9. Children's Privacy</h2>
              <p>
                Our services are not directed to individuals under 16. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a revised "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, contact us at:
              </p>
              <p className="mt-2">
                <strong>Wrenchli, Inc.</strong><br />
                Email:{" "}
                <a href="mailto:privacy@wrenchli.net" className="text-accent hover:underline font-medium">
                  privacy@wrenchli.net
                </a><br />
                Delaware Corporation
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
