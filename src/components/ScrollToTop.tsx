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
      // The element can be found before the page layout has settled
      // (hero media and fonts still loading above it): the smooth scroll
      // is then clamped or lands short, and nothing re-checks, so a cold
      // landing can end at the top of the page with the target section
      // below the fold (audit R-65, intermittent on desktop cold loads).
      // After the first scroll, verify the landing and keep retrying
      // briefly until the element is actually at the top of the viewport.
      const verifyLanding = () => {
        if (!/^#[A-Za-z][\w-]*$/.test(hash)) return;
        const el = document.querySelector(hash);
        if (!el) return;
        if (el.getBoundingClientRect().top > 24 && attempts++ < 20) {
          el.scrollIntoView({ behavior: "smooth" });
          timer = setTimeout(verifyLanding, 150);
        }
      };
      const tryScroll = () => {
        if (!/^#[A-Za-z][\w-]*$/.test(hash)) return;
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          timer = setTimeout(verifyLanding, 350);
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
