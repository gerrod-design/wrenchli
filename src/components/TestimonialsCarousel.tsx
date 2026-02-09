import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";

const testimonials = [
  {
    name: "Marcus J.",
    location: "Detroit, MI",
    quote:
      "I've been overcharged so many times I just stopped trusting shops. If Wrenchli can actually show me real prices side by side before I walk in, that changes everything for me.",
    vehicle: "2018 Ford F-150",
  },
  {
    name: "Aisha T.",
    location: "Dearborn, MI",
    quote:
      "I love the idea of a diagnosis tool that tells me what's probably wrong before I go in. Half the stress is not knowing if the shop is making stuff up. This would fix that.",
    vehicle: "2020 Honda Civic",
  },
  {
    name: "Dave R.",
    location: "Warren, MI",
    quote:
      "Nobody's doing this for car owners right now — giving us real transparency. When I heard about Wrenchli I thought, finally, someone gets it. I'd use this every time.",
    vehicle: "2016 Chevy Malibu",
  },
  {
    name: "Priya S.",
    location: "Ann Arbor, MI",
    quote:
      "Financing built right into the repair process? That's huge. I've put off brake work because I couldn't afford it all at once. Something like Wrenchli would make it so much easier.",
    vehicle: "2019 Toyota Camry",
  },
  {
    name: "Carlos M.",
    location: "Southfield, MI",
    quote:
      "My mechanic is amazing but nobody knows about him. A platform where I can recommend him and he actually gets found? I'd sign up for that in a heartbeat.",
    vehicle: "2017 Dodge Ram",
  },
  {
    name: "Tamika W.",
    location: "Livonia, MI",
    quote:
      "I've been going back and forth on whether to fix my car or just get a new one. If Wrenchli could break down the real cost of both options side by side, that would save me so much stress and guesswork.",
    vehicle: "2014 Nissan Altima",
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  const t = testimonials[current];

  return (
    <section className="section-padding bg-primary">
      <div className="container-wrenchli max-w-3xl">
        <SectionReveal>
          <h2 className="font-heading text-2xl font-bold text-center text-primary-foreground md:text-4xl">
            What Drivers Are Telling Us
          </h2>
          <p className="mt-2 text-center text-primary-foreground/60 text-sm">
            Feedback from interviews with drivers across Metro Detroit
          </p>
        </SectionReveal>

        <div
          className="mt-10 relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 backdrop-blur-sm p-8 md:p-10 min-h-[260px] flex flex-col justify-between transition-all duration-300">
            <Quote className="h-8 w-8 text-accent/60 mb-4 shrink-0" />

            <blockquote className="text-primary-foreground text-lg md:text-xl leading-relaxed font-body flex-1">
              "{t.quote}"
            </blockquote>

            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-heading font-semibold text-primary-foreground">
                  {t.name}
                </p>
                <p className="text-sm text-primary-foreground/50">
                  {t.vehicle} · {t.location}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 bg-accent"
                      : "w-2 bg-primary-foreground/25 hover:bg-primary-foreground/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Next testimonial"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
