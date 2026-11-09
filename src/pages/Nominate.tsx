import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import RecommendShopForm from "@/components/recommend/RecommendShopForm";

export default function Nominate() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Nominate a Repair Shop You Trust"
        description="Tell us which shop you trust with your car. We will invite them to join Wrenchli. Nominating a shop does not require an account or a vehicle assessment."
        path="/nominate"
      />

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-2xl">
          <SectionReveal>
            <div className="text-center">
              <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                Nominate a repair shop you trust
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Tell us which shop you trust with your car. We will invite them to join Wrenchli. Nominating a shop does not require an account or a vehicle assessment.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={100}>
            <div className="mt-8 rounded-xl border border-border bg-card p-6 md:p-8 text-left shadow-sm">
              <RecommendShopForm variant="page" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Your name and email are never shown to the shop. We only use your email if you opt in above.
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
