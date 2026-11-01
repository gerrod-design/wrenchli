import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

/**
 * Records one home-built page_view row for every route change.
 *
 * Before this, a page_view was written only where a page happened to call
 * trackEvent itself (e.g. FinancingOptions), so the analytics_events log
 * could not answer "how many visits did this page get." Plausible counts
 * visitor pageviews on its own; this keeps the home-built log's coverage
 * complete so the two reconcile. Fires once per distinct path + query
 * string, including the initial landing route; hash-only changes and
 * re-renders of the same route do not re-fire.
 */
export default function PageViewTracker() {
  const location = useLocation();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    void trackEvent({
      event_type: "page_view",
      category: "navigation",
      action: "page_view",
    });
  }, [location.pathname, location.search]);

  return null;
}
