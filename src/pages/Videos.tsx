import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Download, Play } from "lucide-react";

type Spot = {
  file: string;
  title: string;
  concept: string;
  cut: string;
  blurb: string;
};

const STANDARD_CAST: Spot[] = [
  {
    file: "the-handoff-15s.mp4",
    title: "The Handoff",
    concept: "Both sides of the counter",
    cut: "15-second spot",
    blurb: "The driver struggles to describe the problem. The advisor struggles to decode it. Wrenchli helps both.",
  },
  {
    file: "the-handoff-30s.mp4",
    title: "The Handoff",
    concept: "Both sides of the counter",
    cut: "30-second spot",
    blurb: "The driver struggles to describe the problem. The advisor struggles to decode it. Wrenchli helps both.",
  },
  {
    file: "right-job-right-place-15s.mp4",
    title: "Right Job, Right Place",
    concept: "The DIY-or-shop math",
    cut: "15-second spot",
    blurb: "Some fixes are a $20 part and an afternoon. Some belong at the shop. Know which is which before you spend.",
  },
  {
    file: "right-job-right-place-30s.mp4",
    title: "Right Job, Right Place",
    concept: "The DIY-or-shop math",
    cut: "30-second spot",
    blurb: "Some fixes are a $20 part and an afternoon. Some belong at the shop. Know which is which before you spend.",
  },
  {
    file: "seller-buyer-garage-15s.mp4",
    title: "Seller & Buyer Garage",
    concept: "Proof you can sell on",
    cut: "15-second spot",
    blurb: "A documented service history turns your car into a car someone else trusts enough to buy.",
  },
  {
    file: "seller-buyer-garage-30s.mp4",
    title: "Seller & Buyer Garage",
    concept: "Proof you can sell on",
    cut: "30-second spot",
    blurb: "A documented service history turns your car into a car someone else trusts enough to buy.",
  },
  {
    file: "seller-buyer-garage-v2-15s.mp4",
    title: "Seller & Buyer Garage",
    concept: "Proof you can sell on",
    cut: "15-second spot (v2)",
    blurb: "A documented service history turns your car into a car someone else trusts enough to buy.",
  },
  {
    file: "seller-buyer-garage-v2-30s.mp4",
    title: "Seller & Buyer Garage",
    concept: "Proof you can sell on",
    cut: "30-second spot (v2)",
    blurb: "A documented service history turns your car into a car someone else trusts enough to buy.",
  },
];

const ALTERNATE_CAST: Spot[] = [
  {
    file: "the-handoff-alt-cast-15s.mp4",
    title: "The Handoff",
    concept: "Both sides of the counter",
    cut: "15-second spot",
    blurb: "The driver struggles to describe the problem. The advisor struggles to decode it. Wrenchli helps both.",
  },
  {
    file: "the-handoff-alt-cast-30s.mp4",
    title: "The Handoff",
    concept: "Both sides of the counter",
    cut: "30-second spot",
    blurb: "The driver struggles to describe the problem. The advisor struggles to decode it. Wrenchli helps both.",
  },
  {
    file: "right-job-right-place-alt-cast-15s.mp4",
    title: "Right Job, Right Place",
    concept: "The DIY-or-shop math",
    cut: "15-second spot",
    blurb: "Some fixes are a $20 part and an afternoon. Some belong at the shop. Know which is which before you spend.",
  },
  {
    file: "right-job-right-place-alt-cast-30s.mp4",
    title: "Right Job, Right Place",
    concept: "The DIY-or-shop math",
    cut: "30-second spot",
    blurb: "Some fixes are a $20 part and an afternoon. Some belong at the shop. Know which is which before you spend.",
  },
  {
    file: "seller-buyer-garage-alt-cast-15s.mp4",
    title: "Seller & Buyer Garage",
    concept: "Proof you can sell on",
    cut: "15-second spot",
    blurb: "A documented service history turns your car into a car someone else trusts enough to buy.",
  },
  {
    file: "seller-buyer-garage-alt-cast-30s.mp4",
    title: "Seller & Buyer Garage",
    concept: "Proof you can sell on",
    cut: "30-second spot",
    blurb: "A documented service history turns your car into a car someone else trusts enough to buy.",
  },
  {
    file: "seller-buyer-garage-v2-alt-cast-15s.mp4",
    title: "Seller & Buyer Garage",
    concept: "Proof you can sell on",
    cut: "15-second spot (v2)",
    blurb: "A documented service history turns your car into a car someone else trusts enough to buy.",
  },
  {
    file: "seller-buyer-garage-v2-alt-cast-30s.mp4",
    title: "Seller & Buyer Garage",
    concept: "Proof you can sell on",
    cut: "30-second spot (v2)",
    blurb: "A documented service history turns your car into a car someone else trusts enough to buy.",
  },
];

function SpotCard({ spot }: { spot: Spot }) {
  const src = `/videos/${spot.file}`;
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="aspect-[9/16] max-h-[480px] w-full bg-black">
        <video
          className="h-full w-full"
          controls
          preload="metadata"
          playsInline
          src={src}
          aria-label={`${spot.title} — ${spot.cut}`}
        />
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{spot.concept}</p>
        <h3 className="mt-1 font-heading text-xl font-bold text-card-foreground">
          {spot.title} <span className="text-base font-semibold text-muted-foreground">· {spot.cut}</span>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{spot.blurb}</p>
        <a
          href={src}
          download={spot.file}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <Download className="h-4 w-4" /> Download MP4
        </a>
      </div>
    </article>
  );
}

function CastSection({ heading, sub, spots }: { heading: string; sub: string; spots: Spot[] }) {
  return (
    <section className="section-padding">
      <div className="container-wrenchli">
        <SectionReveal>
          <h2 className="font-heading text-2xl font-extrabold md:text-4xl">{heading}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">{sub}</p>
        </SectionReveal>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {spots.map((spot) => (
            <SectionReveal key={spot.file}>
              <SpotCard spot={spot} />
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Videos() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Wrenchli Commercials — Mobility for All"
        description="Watch all 16 Wrenchli spots: The Handoff, Right Job Right Place, and Seller & Buyer Garage — in standard and alternate casts, 15 and 30 seconds."
        path="/videos"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-accent">
              <Play className="h-4 w-4" /> Wrenchli Commercials
            </p>
            <h1 className="mt-4 font-heading text-3xl font-extrabold md:text-5xl lg:text-6xl">
              See the mission in motion
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Sixteen spots. Four concepts. Two casts. One promise: transparency for the people
              a surprise repair hits hardest.
            </p>
          </SectionReveal>
        </div>
      </section>

      <div className="bg-background text-foreground">
        <CastSection
          heading="Standard Cast"
          sub="The original ensemble — a driver, a service advisor, and the moments between them where trust is won or lost."
          spots={STANDARD_CAST}
        />
        <CastSection
          heading="Alternate Cast"
          sub="The same stories through Detroit's eyes — a cast that reflects the city Wrenchli calls home."
          spots={ALTERNATE_CAST}
        />

        {/* Closer */}
        <section className="section-padding bg-primary text-primary-foreground">
          <div className="container-wrenchli text-center">
            <SectionReveal>
              <p className="font-heading text-2xl font-extrabold md:text-4xl">
                Wrenchli: Mobility for All.
              </p>
              <p className="mt-4 max-w-xl mx-auto text-primary-foreground/70 leading-relaxed">
                Free symptom assessment. Honest guidance. No account required.
              </p>
            </SectionReveal>
          </div>
        </section>
      </div>
    </main>
  );
}
