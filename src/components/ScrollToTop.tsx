import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    // Always scroll to top first
    window.scrollTo(0, 0);

    // Then, if there's a hash, scroll to that element after a brief delay
    if (hash) {
      requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  }, [pathname, hash]);

  return null;
}
