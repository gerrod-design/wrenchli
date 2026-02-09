import { useCountUp } from "@/hooks/useCountUp";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface StatCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

export default function StatCounter({ end, suffix = "", prefix = "", label }: StatCounterProps) {
  const { ref, isVisible } = useScrollReveal(0.3);
  const count = useCountUp(end, 2000, isVisible);

  return (
    <div ref={ref} className="text-center">
      <div className="font-stats text-4xl font-bold text-accent md:text-5xl lg:text-6xl">
        {prefix}{count}{suffix}
      </div>
      <p className="mt-2 text-sm text-primary-foreground/70 md:text-base">{label}</p>
    </div>
  );
}
