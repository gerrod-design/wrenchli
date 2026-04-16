import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

import heroShop from "@/assets/hero-shop.jpg";

export default function CinematicHero() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
      {/* Single on-brand hero image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroShop})` }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-[1] hero-overlay" />

      {/* Content */}
      <div className="relative z-[2] flex flex-col items-center justify-center h-full px-6 text-center max-w-[900px] mx-auto">
        {/* Headline */}
        <motion.h1
          {...fadeUp(0.8)}
          className="mt-5 md:mt-6 font-heading text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.15] text-white"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
        >
          Hear a strange noise?
          <br />
          Find out what it means <span className="text-accent">before you go to the shop.</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          {...fadeUp(1.5, 10)}
          className="mt-5 text-base md:text-lg font-medium text-white max-w-[680px] leading-relaxed"
          style={{ textShadow: "0 3px 16px rgba(0,0,0,0.7), 0 1px 6px rgba(0,0,0,0.5)" }}
        >
          Describe your symptom in plain English — get likely causes, fair cost ranges, and questions to ask your mechanic. Free, instant, no account needed.
        </motion.p>


        {/* CTA Buttons */}
        <motion.div
          {...fadeUp(1.6, 10)}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <Button
            asChild
            size="lg"
            className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base md:text-lg transition-transform hover:scale-[1.02] shadow-[0_4px_15px_hsl(var(--accent)/0.4)]"
          >
            <Link to="/#quote">Start Your Free Assessment</Link>
          </Button>
          <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
          >
            <span className="text-accent text-lg leading-none">✓</span>
            Assessment always free
          </span>
          <p className="text-sm text-white/60 max-w-md text-center leading-relaxed">
            This is a symptom assessment, not a professional inspection. Use it to ask better questions at the shop — not to skip one.
          </p>
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
