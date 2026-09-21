import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Download, Play } from "lucide-react";

type Spot = {
  file: string;
  title: string;
  cut: string;
  blurb: string;
};

const HANDOFF: Spot[] = [
  {
    file: "the-handoff-15s.mp4",
    title: "The Handoff",
    cut: "15-second cut",
    blurb:
      "A dashboard light at night. She runs the free Wrenchli assessment before the shop visit, so the conversation starts with facts instead of anxiety.",
  },
  {
    file: "the-handoff-alt-cast-30s.mp4",
    title: "The Handoff",
    cut: "30-second cut",
    blurb:
      "The check-engine light comes on in traffic. A structured symptom report means she can describe it clearly — and the advisor can finally hear it.",
  },
];

const RIGHT_JOB: Spot[] = [
  {
    file: "right-job-right-place-alt-cast-15s.mp4",
    title: "Right Job, Right Place",
    cut: "15-second cut",
    blurb:
      "An air filter, a driveway, a phone propped on the fender. Coached step by step, she does it herself — and skips the $200 shop visit.",
  },
  {
    file: "right-job-right-place-30s.mp4",
    title: "Right Job, Right Place",
    cut: "30-second cut",
    blurb:
      "Not every fix needs a lift. Wrenchli's DIY coaching sorts the $20 afternoon jobs from the ones that truly belong with a technician.",
  },
];

const GARAGE: Spot[] = [
  {
    file: "seller-buyer-garage-alt-cast-15s.mp4",
    title: "Seller & Buyer Garage",
    cut: "15-second cut",
    blurb:
      "Selling her car with a for-sale sign and a full Wrenchli Garage history behind it — proof a stranger can trust.",
  },
  {
    file: "seller-buyer-garage-v2-30s.mp4",
    title: "Seller & Buyer Garage",
    cut: "30-second cut",
    blurb:
      "The buyer sees the whole story before the handshake. A documented history, confirmed in person — a fair deal for both sides.",
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
        <h3 className="font-heading text-xl font-bold text-card-foreground">
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

function StorySection({
  kicker,
  heading,
  sub,
  spots,
}: {
  kicker: string;
  heading: string;
  sub: string;
  spots: Spot[];
}) {
  return (
    <section className="section-padding">
      <div className="container-wrenchli">
        <SectionReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{kicker}</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold md:text-4xl">{heading}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">{sub}</p>
        </SectionReveal>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
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
        title="Wrenchli Films — Mobility for All"
        description="Six Wrenchli films across three stories — The Handoff, Right Job Right Place, and Seller & Buyer Garage — in 15- and 30-second cuts."
        path="/videos"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-accent">
              <Play className="h-4 w-4" /> Wrenchli Films
            </p>
            <h1 className="mt-4 font-heading text-3xl font-extrabold md:text-5xl lg:text-6xl">
              See the mission in motion
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Six films. Three stories, each in a 15- and a 30-second cut — different
              drivers, different situations. One promise: transparency for the people a
              surprise repair hits hardest.
            </p>
          </SectionReveal>
        </div>
      </section>

      <div className="bg-background text-foreground">
        <StorySection
          kicker="Both sides of the counter"
          heading="The Handoff"
          sub="A driver struggling to describe the problem. An advisor struggling to decode it. Wrenchli helps both."
          spots={HANDOFF}
        />
        <StorySection
          kicker="The DIY-or-shop math"
          heading="Right Job, Right Place"
          sub="A $20 part and an afternoon, or a real technician? Know which is which before you spend."
          spots={RIGHT_JOB}
        />
        <StorySection
          kicker="Proof you can sell on"
          heading="Seller & Buyer Garage"
          sub="A documented service history turns a car into a car someone else trusts enough to buy."
          spots={GARAGE}
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
