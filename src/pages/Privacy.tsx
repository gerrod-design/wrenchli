import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy | Wrenchli"
        description="How Wrenchli collects, uses, and protects your vehicle and assessment data."
        path="/privacy"
      />
      <main className="min-h-screen bg-background py-16 md:py-24">
        <div className="container-wrenchli max-w-3xl">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: April 4, 2026
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">1. Introduction</h2>
              <p>
                Wrenchli, Inc. ("Wrenchli," "we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit wrenchli.net and use our services — including our vehicle symptom assessment tool, repair shop matching, and repair financing features.
              </p>
              <p>This policy covers two types of users:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Consumers</strong> — vehicle owners who use Wrenchli to assess symptoms and find repair shops</li>
                <li><strong>Shop Partners</strong> — repair shops that join the Wrenchli partner network</li>
              </ul>
              <p>Please read this policy carefully. If you do not agree with its terms, please discontinue use of our services.</p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">2. Information We Collect</h2>

              <h3 className="font-heading text-lg font-medium text-foreground">From Consumers</h3>

              <h4 className="font-heading text-base font-medium text-foreground mt-4">Information you provide directly:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contact information (name, email address, phone number)</li>
                <li>Vehicle information (year, make, model, trim, mileage, VIN)</li>
                <li>Symptom descriptions — what you report is wrong with your vehicle</li>
                <li>Photos uploaded for visual assessment</li>
                <li>ZIP code and location for shop matching</li>
                <li>Repair outcome information — what your mechanic actually found and charged, if you choose to report it</li>
              </ul>

              <h4 className="font-heading text-base font-medium text-foreground mt-4">Information collected automatically:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Browser type, version, and device type</li>
                <li>Operating system</li>
                <li>Pages visited and time spent</li>
                <li>Referring website addresses</li>
                <li>IP address (anonymized for analytics)</li>
                <li>Session identifiers, including anonymous session IDs created before you sign in</li>
              </ul>

              <h4 className="font-heading text-base font-medium text-foreground mt-4">Information from third-party sources:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Vehicle specification data decoded from your VIN using the U.S. Department of Transportation's National Highway Traffic Safety Administration (NHTSA) public API. This includes engine type, trim level, drive type, and factory configuration.</li>
                <li>Repair confirmation data from partner repair shops when they close a repair order associated with your session (see Section 5)</li>
              </ul>

              <h3 className="font-heading text-lg font-medium text-foreground mt-6">From Shop Partners</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Business information (shop name, address, owner name, contact details)</li>
                <li>Shop management system (SMS) credentials — stored encrypted and never accessible in plaintext</li>
                <li>Repair order confirmation data — what was found, what was charged, parts used</li>
                <li>Performance metrics derived from confirmed repair outcomes</li>
              </ul>

              <h3 className="font-heading text-lg font-medium text-foreground mt-6">From Anonymous Sessions</h3>
              <p>
                If you use Wrenchli before creating an account, we create an anonymous session to preserve your progress. This session stores your vehicle information and symptom description on our servers temporarily. If you create an account during or after your session, anonymous session data is linked to your account. If you do not create an account, anonymous session data is retained for 90 days and then deleted.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">3. How We Use Your Information</h2>

              <h3 className="font-heading text-lg font-medium text-foreground">To Deliver Our Services</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Perform vehicle symptom assessments and generate repair likelihood reports</li>
                <li>Decode VIN data to improve assessment accuracy</li>
                <li>Match you with local partner repair shops</li>
                <li>Enable repair financing through our lending partners (with your consent)</li>
                <li>Pre-populate repair orders at partner shops so service advisors start informed</li>
                <li>Send maintenance reminders and recall alerts (with your consent)</li>
                <li>Respond to your support requests</li>
              </ul>

              <h3 className="font-heading text-lg font-medium text-foreground mt-6">To Improve Our AI System</h3>
              <p className="font-medium">
                This section describes how Wrenchli uses data to train and improve its artificial intelligence models. Please read it carefully.
              </p>
              <p>
                Wrenchli is building a proprietary AI system for vehicle symptom assessment. A core part of this effort is learning from real repair outcomes — comparing what Wrenchli predicted against what a professional technician actually found.
              </p>
              <p>
                When you voluntarily report a repair outcome (what your mechanic found, what was charged, whether the problem was fixed), we use that information to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Score the accuracy of Wrenchli's symptom assessment for that session</li>
                <li>Improve the accuracy of future assessments</li>
                <li>Train and refine Wrenchli's AI models over time</li>
              </ul>

              <p className="mt-4"><strong>What we use for AI training:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Anonymized symptom descriptions</li>
                <li>Anonymized assessment outputs (predicted causes, likelihood scores)</li>
                <li>Anonymized repair outcomes (confirmed issue, cost range, resolution)</li>
                <li>Vehicle category data (engine type, mileage range, repair category)</li>
              </ul>

              <p className="mt-4"><strong>What we never use for AI training:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your name, email address, or phone number</li>
                <li>Your VIN</li>
                <li>Your full address</li>
                <li>Any information that would identify you as an individual</li>
              </ul>

              <p className="mt-4">
                Your VIN is used at intake to decode your vehicle's specifications. Those decoded specifications (engine type, trim level, etc.) may be used in AI training. Your VIN itself is never included in training data.
              </p>
              <p>
                By using Wrenchli and voluntarily submitting repair outcome reports, you consent to the use of your anonymized data for AI training as described above. You may opt out at any time by contacting{" "}
                <a href="mailto:privacy@wrenchli.net" className="text-accent hover:underline font-medium">privacy@wrenchli.net</a>.
                Opting out will not affect your ability to use Wrenchli.
              </p>

              <h3 className="font-heading text-lg font-medium text-foreground mt-6">To Compute and Display Accuracy Metrics</h3>
              <p>
                Wrenchli publishes aggregate, anonymized accuracy statistics — for example, "Wrenchli's symptom assessments matched actual repair findings in X% of verified cases." These statistics are computed from anonymized outcome data and no individual's data is ever identified in these displays.
              </p>

              <h3 className="font-heading text-lg font-medium text-foreground mt-6">To Operate the Shop Partner Network</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Share your vehicle and symptom data with the shop you select</li>
                <li>Receive repair confirmation data from that shop to close your outcome loop</li>
                <li>Compute shop performance scores used to rank shops in consumer recommendations</li>
                <li>Enable repair financing for consumers who need it</li>
              </ul>

              <h3 className="font-heading text-lg font-medium text-foreground mt-6">For Security and Fraud Prevention</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Detect and prevent unauthorized access to our systems</li>
                <li>Validate webhook signatures from shop management system integrations</li>
                <li>Monitor for unusual data access patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">4. VIN and Vehicle Data</h2>
              <p>Your Vehicle Identification Number (VIN) is used to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Decode your vehicle's exact specifications via the NHTSA public API</li>
                <li>Improve the accuracy of your symptom assessment</li>
                <li>Enable recall lookup for your specific vehicle</li>
              </ul>
              <p className="mt-4">
                <strong>VIN storage:</strong> Your VIN is stored in your vehicle profile if you save a vehicle to your garage. If you do not save a vehicle, VIN is retained only for the duration of your session.
              </p>
              <p>
                <strong>VIN in AI training:</strong> Your VIN is never included in AI training data. Only decoded vehicle specifications (engine type, trim category, mileage range) are used for training purposes.
              </p>
              <p>
                <strong>VIN sharing:</strong> Your VIN is shared with the partner shop you select, as part of the intake data that pre-populates their repair order. It is not shared with any other third party except as required by law.
              </p>
              <p>
                <strong>VIN and repair financing:</strong> If you apply for repair financing, your VIN may be shared with our lending partner as part of the loan application. See Section 6 for details.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">5. How Repair Outcome Data Flows</h2>
              <p>When you complete a symptom assessment and visit a partner shop, data flows in two directions:</p>

              <h3 className="font-heading text-lg font-medium text-foreground mt-4">Wrenchli → Shop</h3>
              <p>
                Your name, contact information, vehicle details (including VIN if provided), symptom description, and assessment summary are sent to the shop you select. This pre-populates their repair order. The shop receives this data to prepare for your visit — it is not used for any other purpose.
              </p>

              <h3 className="font-heading text-lg font-medium text-foreground mt-4">Shop → Wrenchli</h3>
              <p>When the shop closes your repair order, they may confirm what they found, what they charged, and what parts were used. This information:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Closes your outcome loop so you can see how Wrenchli's assessment compared to what the shop found</li>
                <li>Contributes to the shop's Verified performance score</li>
                <li>Is used (in anonymized form) to improve Wrenchli's AI system</li>
                <li>May be shared with a lending partner if you obtained financing for the repair</li>
              </ul>
              <p className="mt-2">
                Shop-confirmed cost data is used to improve Wrenchli's cost estimate accuracy. Individual shop pricing is never shared with other shops. Aggregate cost benchmarks are anonymized by zip code and repair category.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">6. Repair Financing</h2>
              <p>If you use Wrenchli's repair financing feature:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your name, contact information, vehicle information, and symptom assessment summary will be shared with Wrenchli's lending partner(s) as part of the loan application process</li>
                <li>The shop's confirmed repair cost will be shared with the lender to verify the loan amount</li>
                <li>Lending partners are bound by their own privacy policies and applicable financial privacy regulations (including GLBA where applicable)</li>
                <li>We will identify our current lending partner(s) at the point of financing application and obtain your explicit consent before sharing your data with them</li>
                <li>Applying for financing is always optional and never required to use Wrenchli's other features</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">7. Third-Party Services We Use</h2>
              <p>The following third-party services receive data in connection with Wrenchli's operation:</p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Service</th>
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Purpose</th>
                      <th className="text-left py-2 font-semibold text-foreground">Data Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2 pr-4">Supabase</td>
                      <td className="py-2 pr-4">Database and authentication</td>
                      <td className="py-2">All user and session data</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Anthropic (Claude API)</td>
                      <td className="py-2 pr-4">AI symptom assessment and outcome matching</td>
                      <td className="py-2">Anonymized symptom and vehicle data</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">NHTSA VIN API</td>
                      <td className="py-2 pr-4">Vehicle specification lookup</td>
                      <td className="py-2">VIN (public API, no account required)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Shop Management Systems</td>
                      <td className="py-2 pr-4">Repair order creation and outcome retrieval</td>
                      <td className="py-2">Consumer and vehicle data for selected shop only</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Lending partners</td>
                      <td className="py-2 pr-4">Repair financing</td>
                      <td className="py-2">Name, vehicle data, assessment summary (with consent)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Analytics providers</td>
                      <td className="py-2 pr-4">Usage analytics</td>
                      <td className="py-2">Anonymized browsing data</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Google AI</td>
                      <td className="py-2 pr-4">Audio and video analysis</td>
                      <td className="py-2">Audio recordings and video uploads submitted through vehicle sound and video analysis features</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">Audio and video submitted through our vehicle sound and video analysis features are processed by Google AI. This data is subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's privacy policy</a>.</p>
              <p className="mt-4">Wrenchli does not sell your personal information to any third party.</p>
              <p className="mt-4">
                For a complete list of subprocessors with data handling details and compliance certifications, see our{" "}
                <a href="/subprocessors" className="text-accent hover:underline font-medium">Subprocessors</a> page.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">8. Data Sharing and Disclosure</h2>
              <p>We share your information only in these circumstances:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Partner shops</strong> — when you select a shop, your intake data is shared with that shop only</li>
                <li><strong>Lending partners</strong> — when you apply for financing, with your explicit consent</li>
                <li><strong>Service providers</strong> — who operate our platform (listed in Section 7), under data processing agreements</li>
                <li><strong>Legal requirements</strong> — when required by law, court order, or to protect the rights and safety of Wrenchli and its users</li>
                <li><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of all or substantially all of our assets, in which case your data would transfer to the acquiring entity subject to this policy</li>
              </ul>
              <p className="mt-2">We do not sell your personal information. We do not share your personal information with advertisers.</p>
              <p className="mt-2">Wrenchli uses affiliate links for parts recommendations. When you click an affiliate link and make a purchase, we may receive a commission. This does not affect our recommendations or the price you pay.</p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">9. Shop Partner Data</h2>
              <p>If you operate a repair shop and join the Wrenchli partner network:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your business credentials and shop management system API keys are stored encrypted using AES-256-GCM encryption. API keys are never stored in plaintext.</li>
                <li>Your shop's performance metrics (symptom match rate, cost percentile, satisfaction scores) are computed from confirmed repair outcomes and are visible to consumers on the Wrenchli platform.</li>
                <li>Individual shop pricing data is never shared with other shops.</li>
                <li>Aggregate pricing benchmarks are anonymized by zip code and repair category.</li>
                <li>You may request deletion of your shop account and associated data by contacting{" "}
                  <a href="mailto:privacy@wrenchli.net" className="text-accent hover:underline font-medium">privacy@wrenchli.net</a>.
                  Note that anonymized, aggregate data derived from your shop's confirmed outcomes may be retained in aggregate metrics even after account deletion.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">10. Data Retention</h2>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-semibold text-foreground">Data Type</th>
                      <th className="text-left py-2 font-semibold text-foreground">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 pr-4">Active consumer accounts</td><td className="py-2">Until account deletion requested</td></tr>
                    <tr><td className="py-2 pr-4">Anonymous sessions (no account created)</td><td className="py-2">90 days</td></tr>
                    <tr><td className="py-2 pr-4">Symptom assessment sessions</td><td className="py-2">Duration of account</td></tr>
                    <tr><td className="py-2 pr-4">Repair outcome reports</td><td className="py-2">Duration of account (individual); indefinitely in anonymized aggregate</td></tr>
                    <tr><td className="py-2 pr-4">Shop API credentials</td><td className="py-2">Duration of partner agreement</td></tr>
                    <tr><td className="py-2 pr-4">Integration sync logs</td><td className="py-2">12 months</td></tr>
                    <tr><td className="py-2 pr-4">Anonymized AI training data</td><td className="py-2">Indefinitely (no personal identifiers)</td></tr>
                    <tr><td className="py-2 pr-4">Analytics data</td><td className="py-2">26 months</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">11. Data Security</h2>
              <p>We implement the following security measures:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Encryption in transit:</strong> All data transmitted between your browser and our servers uses TLS 1.2 or higher</li>
                <li><strong>Encryption at rest:</strong> Sensitive data including shop API credentials is encrypted using AES-256-GCM</li>
                <li><strong>Access controls:</strong> Row-level security policies restrict data access so each user can only access their own data</li>
                <li><strong>API key protection:</strong> Shop management system API keys are encrypted before storage and decrypted only at the moment of use within secure server-side functions</li>
                <li><strong>Audit logging:</strong> All data synchronization events are logged with timestamps and outcomes</li>
                <li><strong>Principle of least privilege:</strong> AI training pipelines access only anonymized data and cannot access personally identifiable information</li>
              </ul>
              <p className="mt-2">
                No method of transmission over the Internet is 100% secure. While we implement strong security practices, we cannot guarantee absolute security and encourage you to use strong passwords and protect your account credentials.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">12. Your Rights</h2>
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Access</strong> your personal information we hold</li>
                <li><strong>Correct</strong> inaccurate personal information</li>
                <li><strong>Delete</strong> your personal information (subject to legal retention requirements)</li>
                <li><strong>Opt out of AI training</strong> — request that your data not be used for AI model training. This does not affect your use of Wrenchli.</li>
                <li><strong>Opt out of marketing</strong> communications at any time</li>
                <li><strong>Data portability</strong> — request a copy of your data in a machine-readable format</li>
                <li><strong>Withdraw consent</strong> for data processing where consent is the legal basis</li>
              </ul>
              <p className="mt-4">
                <strong>California residents (CCPA):</strong> You have the right to know what personal information is collected, to delete personal information, to opt out of the sale of personal information (we do not sell personal information), and to non-discrimination for exercising your rights.
              </p>
              <p className="mt-2">
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@wrenchli.net" className="text-accent hover:underline font-medium">privacy@wrenchli.net</a>.
                We will respond within 45 days.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">13. Children's Privacy</h2>
              <p>
                Our services are not directed to individuals under 16. We do not knowingly collect personal information from children under 16. If you believe we have collected information from a child under 16, please contact us at{" "}
                <a href="mailto:privacy@wrenchli.net" className="text-accent hover:underline font-medium">privacy@wrenchli.net</a>{" "}
                immediately and we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">14. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, our services, or applicable law. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Posting the updated policy on this page with a revised "Last updated" date</li>
                <li>Sending an email notification to registered users for significant changes</li>
              </ul>
              <p className="mt-2">
                Your continued use of Wrenchli after a material change constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">15. Contact Us</h2>
              <p>For questions, concerns, or to exercise your privacy rights:</p>
              <p className="mt-2">
                <strong>Wrenchli, Inc.</strong><br />
                Email:{" "}
                <a href="mailto:privacy@wrenchli.net" className="text-accent hover:underline font-medium">
                  privacy@wrenchli.net
                </a><br />
                Delaware Corporation
              </p>
              <p className="mt-2">
                For security-related concerns or to report a vulnerability, please email{" "}
                <a href="mailto:security@wrenchli.net" className="text-accent hover:underline font-medium">
                  security@wrenchli.net
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
