import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-[140px] right-4 z-30 hidden items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:flex md:bottom-6 md:h-11 md:w-11"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
