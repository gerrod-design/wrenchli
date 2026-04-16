import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
          className="mt-5 md:mt-6 font-heading text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] text-white"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
        >
          Vehicle Repair
          <br />
          Finally <span className="text-accent">Fixed</span>
        </motion.h1>

        {/* Regional info */}
        <motion.p
          {...fadeUp(1.5, 10)}
          className="mt-4 text-base md:text-xl font-semibold text-white max-w-[600px]"
          style={{ textShadow: "0 3px 16px rgba(0,0,0,0.7), 0 1px 6px rgba(0,0,0,0.5)" }}
        >
          Affordable vehicle repair — transparent pricing, trusted shops.
        </motion.p>

        {/* Trust badges */}
        <motion.div
          {...fadeUp(1.7, 10)}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:text-base font-semibold text-white"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
        >
          {["Assessment always free", "DIY tutorials", "Shop quotes", "No account required"].map((label) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className="text-accent text-lg leading-none">✓</span>
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          {...fadeUp(1.6, 10)}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base md:text-lg transition-transform hover:scale-[1.02] shadow-[0_4px_15px_hsl(var(--accent)/0.4)]"
            >
              <Link to="/#quote">Get Your Free Diagnosis</Link>
            </Button>
          </div>
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
