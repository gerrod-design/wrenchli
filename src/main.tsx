import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { installClientErrorReporting } from "./lib/clientErrorReporter";
import "./index.css";

installClientErrorReporting();

// Prerendered pages ship a static description / og:description for no-JS
// crawlers, and react-helmet-async does not remove tags it did not create —
// left alone, the live DOM would carry both the static tag and Helmet's
// (the duplicate-description defect). Helmet owns these tags at runtime
// (App-level default + per-page SEO), so drop the static ones at boot.
document
  .querySelectorAll(
    'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]'
  )
  .forEach((el) => {
    if (!el.hasAttribute("data-rh")) el.remove();
  });

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
