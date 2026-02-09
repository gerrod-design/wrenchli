import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Search, ClipboardList, GitFork, Wrench, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/SectionReveal";
import heroPoster from "@/assets/hero-poster.jpg";
import heroVideo from "@/assets/hero-video.mp4";

const steps = [
  { step: 1, icon: Search, title: "Tell Us What's Wrong", desc: "Describe your issue in plain English or enter a diagnostic code from your OBD2 scanner.", startTime: 0, endTime: 18 },
  { step: 2, icon: ClipboardList, title: "Get Your Diagnosis", desc: "See what's likely wrong, how urgent it is, and what it might cost.", startTime: 18, endTime: 35 },
  { step: 3, icon: GitFork, title: "Explore Your Options", desc: "Watch a DIY tutorial and order parts, or get quotes from vetted local shops.", startTime: 35, endTime: 55 },
  { step: 4, icon: Wrench, title: "Fix It Your Way", desc: "Follow a video guide at your own pace, or book a shop appointment with financing.", startTime: 55, endTime: 72 },
  { step: 5, icon: CheckCircle, title: "Get Back on the Road", desc: "Whether you fixed it yourself or used a shop, you're back in control.", startTime: 72, endTime: 90 },
];

export default function HowItWorksVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Track video time and sync to steps
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const t = video.currentTime;
      const current = steps.find((s) => t >= s.startTime && t < s.endTime);
      if (current) {
        setActiveStep(current.step);
        setCompletedSteps((prev) => {
          const next = new Set(prev);
          steps.filter((s) => s.endTime <= t).forEach((s) => next.add(s.step));
          return next;
        });
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCompletedSteps(new Set(steps.map((s) => s.step)));
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const handleStepClick = useCallback((step: typeof steps[number]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = step.startTime;
    if (video.paused) video.play();
  }, []);

  return (
    <section className="section-padding bg-background">
      <div className="container-wrenchli">
        <SectionReveal>
          <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">How It Works</h2>
          <p className="mt-3 text-center text-muted-foreground md:text-lg">
            See how easy it is — in under 90 seconds.
          </p>
        </SectionReveal>

        {/* Desktop/Tablet: side by side — Mobile: stacked */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[55%_1fr] lg:gap-10 items-start">
          {/* Video Player */}
          <SectionReveal>
            <div
              className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-primary cursor-pointer group"
              onClick={handleVideoClick}
            >
              <video
                ref={videoRef}
                src={heroVideo}
                poster={heroPoster}
                playsInline
                preload="metadata"
                controls={isPlaying}
                className="w-full h-full object-cover"
              />

              {/* Play overlay — hidden when playing */}
              {!isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 transition-all">
                  {/* Play button */}
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
                    <Play className="h-7 w-7 text-primary ml-1 fill-primary" />
                  </div>

                  {/* Caption bar */}
                  <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-sm font-medium flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 fill-white" />
                      Watch: Your first diagnosis in 90 seconds
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SectionReveal>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((s, i) => {
              const isActive = activeStep === s.step;
              const isCompleted = completedSteps.has(s.step) && !isActive;

              return (
                <SectionReveal key={s.step} delay={i * 80}>
                  <button
                    onClick={() => handleStepClick(s)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 rounded-lg border-l-[3px] px-4 py-3 transition-all duration-300",
                      isActive
                        ? "border-l-accent bg-accent/5 opacity-100 translate-x-1"
                        : isCompleted
                          ? "border-l-accent/40 opacity-80"
                          : "border-l-border opacity-60 hover:opacity-80 hover:bg-muted/30"
                    )}
                  >
                    {/* Step number / check */}
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                        isActive || isCompleted
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : s.step}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "font-heading text-sm font-semibold transition-colors",
                          isActive ? "text-foreground" : "text-foreground/80"
                        )}>
                          {s.title}
                        </h3>
                        <s.icon className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-colors",
                          isActive ? "text-accent" : "text-muted-foreground"
                        )} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </button>
                </SectionReveal>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <SectionReveal>
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
              <Link to="/vehicle-insights">
                Get Your Free Diagnosis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
