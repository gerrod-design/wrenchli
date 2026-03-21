import SEO from "@/components/SEO";

export default function Accessibility() {
  return (
    <>
      <SEO
        title="Accessibility"
        description="Wrenchli is committed to digital accessibility. Learn about our efforts to make vehicle repair tools usable for everyone."
        path="/accessibility"
      />
      <main className="min-h-screen bg-background py-16 md:py-24">
        <div className="container-wrenchli max-w-3xl">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl mb-2">
            Accessibility Statement
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: March 21, 2026
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">Our Commitment</h2>
              <p>
                Wrenchli is committed to ensuring digital accessibility for people of all abilities. We believe that vehicle repair information and tools should be available to everyone, regardless of disability or impairment. We are continually improving the user experience for all visitors and applying the relevant accessibility standards.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">Standards We Follow</h2>
              <p>
                We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. These guidelines explain how to make web content more accessible to people with a wide range of disabilities, including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Visual impairments (blindness, low vision, color blindness)</li>
                <li>Hearing impairments</li>
                <li>Motor impairments</li>
                <li>Cognitive and learning disabilities</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">What We're Doing</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Semantic HTML</strong> — We use proper heading hierarchy, landmarks, and ARIA labels to support screen readers and assistive technologies.
                </li>
                <li>
                  <strong>Keyboard navigation</strong> — All interactive elements are accessible via keyboard. Focus indicators are visible for keyboard users.
                </li>
                <li>
                  <strong>Color contrast</strong> — We maintain sufficient color contrast ratios throughout our interface to ensure readability.
                </li>
                <li>
                  <strong>Alt text</strong> — Images include descriptive alternative text. Decorative images are marked appropriately.
                </li>
                <li>
                  <strong>Responsive design</strong> — Our site adapts to different screen sizes, zoom levels, and orientations.
                </li>
                <li>
                  <strong>Form accessibility</strong> — Form fields include labels, error messages are descriptive, and required fields are clearly indicated.
                </li>
                <li>
                  <strong>Motion sensitivity</strong> — We respect the <code>prefers-reduced-motion</code> setting to minimize animations for users who are sensitive to motion.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">Known Limitations</h2>
              <p>
                While we strive for full accessibility, some areas of our site are still being improved:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Some third-party embedded content (e.g., maps) may have limited accessibility</li>
                <li>Older PDF documents may not be fully screen-reader compatible</li>
                <li>The VIN barcode scanner requires camera access and may not be fully accessible to all users</li>
              </ul>
              <p className="mt-2">
                We are actively working to address these limitations and improve accessibility across all features.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">Assistive Technology Support</h2>
              <p>Our site is designed to be compatible with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
                <li>Screen magnification software</li>
                <li>Speech recognition software</li>
                <li>Keyboard-only navigation</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">Feedback & Contact</h2>
              <p>
                We welcome your feedback on the accessibility of Wrenchli. If you encounter any barriers or have suggestions for improvement, please contact us:
              </p>
              <p className="mt-2">
                <strong>Email:</strong>{" "}
                <a href="mailto:accessibility@wrenchli.net" className="text-accent hover:underline font-medium">
                  accessibility@wrenchli.net
                </a>
              </p>
              <p>
                We aim to respond to accessibility feedback within 5 business days and to resolve reported issues as quickly as possible.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">Continuous Improvement</h2>
              <p>
                Accessibility is an ongoing effort. We regularly review our site, train our team, and incorporate accessibility testing into our development process. As we grow, we are committed to making vehicle repair accessible to all communities.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
