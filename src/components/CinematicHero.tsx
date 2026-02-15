import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroVideo from "@/assets/hero-video.mp4";
import heroPoster from "@/assets/hero-poster.jpg";
import heroHome from "@/assets/hero-home.jpg";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useIsSaveData() {
  const [save, setSave] = useState(false);
  useEffect(() => {
    const conn = (navigator as any).connection;
    if (conn?.saveData) setSave(true);
    else if (conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") setSave(true);
  }, []);
  return save;
}

export default function CinematicHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isSaveData = useIsSaveData();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showVideo = !prefersReducedMotion && !isSaveData && !isMobile;

  const handleScrollDown = () => {
    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" });
  };

  const fadeUp = (delay: number, y = 20) => ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: "easeOut" as const },
  });

  return (
    <section className="relative w-full overflow-hidden hero-height">
      {/* Background Video (desktop only) */}
      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
          poster={heroPoster}
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      )}

      {/* Mobile fallback: poster image with subtle zoom */}
      {!showVideo && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center animate-subtle-zoom"
          style={{ backgroundImage: `url(${isMobile ? heroHome : heroPoster})` }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-[1] hero-overlay" />

      {/* Content */}
      <div className="relative z-[2] flex flex-col items-center justify-center h-full px-6 text-center max-w-[900px] mx-auto">
        {/* WRENCHLI wordmark */}
        <motion.p
          {...fadeUp(0.3)}
          className="font-heading text-base md:text-xl font-bold tracking-[0.35em] md:tracking-[0.5em] text-white/90 uppercase"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
        >
          WRENCHLI
        </motion.p>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.8)}
          className="mt-5 md:mt-6 font-heading text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] text-white"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
        >
          Vehicle Repair.
          <br />
          Finally <span className="text-accent">Fixed.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(1.2, 15)}
          className="mt-5 md:mt-6 text-base md:text-xl leading-relaxed text-white/90 max-w-[600px]"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)" }}
        >
          Fixing the broken vehicle repair experience.
          <br />
          Coming soon to Detroit.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          {...fadeUp(1.6, 10)}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base md:text-lg transition-transform hover:scale-[1.02] shadow-[0_4px_15px_hsl(var(--accent)/0.4)]"
          >
            <Link to="/#quote">Get Your Free Diagnosis</Link>
          </Button>
        </motion.div>


        {/* Scroll indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.0, duration: 0.3 }}
          onClick={handleScrollDown}
          className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors"
          aria-label="Scroll down"
        >
          <ChevronDown className="h-8 w-8 animate-bounce" />
        </motion.button>
      </div>

    </section>
  );
}
