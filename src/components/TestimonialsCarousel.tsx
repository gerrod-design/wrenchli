import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";

const testimonials = [
  {
    name: "Marcus J.",
    location: "Detroit, MI",
    quote:
      "I used to dread taking my car in because I never knew if I was getting ripped off. Wrenchli showed me three quotes side by side — I saved over $400 on my transmission repair.",
    rating: 5,
    vehicle: "2018 Ford F-150",
  },
  {
    name: "Aisha T.",
    location: "Dearborn, MI",
    quote:
      "The diagnosis tool nailed my issue before I even went to the shop. Walked in knowing exactly what was wrong and what it should cost. Game changer.",
    rating: 5,
    vehicle: "2020 Honda Civic",
  },
  {
    name: "Dave R.",
    location: "Warren, MI",
    quote:
      "Finally, a platform that treats car owners like adults. Transparent pricing, honest shops, no BS. This is how it should've always been.",
    rating: 5,
    vehicle: "2016 Chevy Malibu",
  },
  {
    name: "Priya S.",
    location: "Ann Arbor, MI",
    quote:
      "The financing option was a lifesaver. My brakes needed replacing and I couldn't afford it all at once. Wrenchli made it manageable.",
    rating: 4,
    vehicle: "2019 Toyota Camry",
  },
  {
    name: "Carlos M.",
    location: "Southfield, MI",
    quote:
      "I recommended my mechanic through Wrenchli and now he's getting way more business. Everybody wins.",
    rating: 5,
    vehicle: "2017 Dodge Ram",
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
            What Car Owners Are Saying
          </h2>
          <p className="mt-2 text-center text-primary-foreground/60 text-sm">
            Real feedback from drivers in the Detroit area
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
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating
                        ? "fill-accent text-accent"
                        : "text-primary-foreground/20"
                    }`}
                  />
                ))}
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
