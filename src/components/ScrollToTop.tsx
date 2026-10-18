import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    // Always scroll to top first
    window.scrollTo(0, 0);

    // Then, if there's a hash, scroll to that element. Cross-page landings
    // can commit this effect before the target page's content has mounted
    // (e.g. the homepage), so retry briefly until the element appears.
    if (hash) {
      let attempts = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const tryScroll = () => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else if (attempts++ < 20) {
          timer = setTimeout(tryScroll, 100);
        }
      };
      requestAnimationFrame(tryScroll);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [pathname, hash]);

  return null;
}
