// JSON-LD structured data for the prerendered public pages.
//
// Every object here is built from the same source the page itself renders
// (FAQ entries from src/data/faq.ts, blog metadata from src/lib/blog.ts,
// homepage copy from src/pages/DesignPreview.tsx), so the structured data
// describes the visible page content and cannot drift from it.
//
// Copy rules (standing): Wrenchli performs a preliminary symptom
// assessment — never "diagnose"; the assessment is always free; the
// service is available nationally; the referral pilot is open nationally
// to independent shops. Wrenchli is not a repair shop, so no
// LocalBusiness / AutoRepair types are used.

import { consumerFaqs, shopFaqs } from "@/data/faq";
import { getPostBySlug, type BlogPost } from "@/lib/blog";

export const SITE_BASE = "https://www.wrenchli.net";

const organization = {
  "@type": "Organization",
  "@id": `${SITE_BASE}/#organization`,
  name: "Wrenchli",
  legalName: "Wrenchli, Inc.",
  url: `${SITE_BASE}/`,
  logo: `${SITE_BASE}/icon-512.png`,
  email: "support@wrenchli.net",
  description:
    "Wrenchli is a free vehicle symptom assessment platform for vehicle owners across the United States, providing likely causes, urgency levels, and fair cost ranges before they visit a repair shop.",
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE_BASE}/#website`,
  name: "Wrenchli",
  url: `${SITE_BASE}/`,
  publisher: { "@id": `${SITE_BASE}/#organization` },
  inLanguage: "en-US",
};

// Describes the free symptom assessment offered on the homepage, in the
// homepage's own words ("Free, instant symptom assessment. Describe
// what's wrong and get a structured report with likelihood scores, cost
// estimates, and exactly what to ask your shop.").
const assessmentService = {
  "@type": "Service",
  "@id": `${SITE_BASE}/#assessment`,
  name: "Free Vehicle Symptom Assessment",
  serviceType: "Vehicle symptom assessment",
  provider: { "@id": `${SITE_BASE}/#organization` },
  url: `${SITE_BASE}/`,
  description:
    "Free, instant symptom assessment. Describe what's wrong and get a structured report with likelihood scores, cost estimates, and exactly what to ask your shop. This is a preliminary symptom assessment, not a professional inspection.",
  areaServed: { "@type": "Country", name: "United States" },
  audience: { "@type": "Audience", audienceType: "Vehicle owners" },
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
};

function faqPage() {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_BASE}/faq#webpage`,
    url: `${SITE_BASE}/faq`,
    mainEntity: [...consumerFaqs, ...shopFaqs].map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

function article(post: BlogPost) {
  const url = `${SITE_BASE}/blog/${post.slug}`;
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Wrenchli",
      logo: { "@type": "ImageObject", url: `${SITE_BASE}/icon-512.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    image: `${SITE_BASE}/og-default.png`,
    keywords: post.tags.join(", "),
    inLanguage: "en-US",
  };
}

/** JSON-LD documents to embed in the prerendered HTML for a route. */
export function jsonLdForRoute(path: string): Record<string, unknown>[] {
  if (path === "/") {
    return [
      { "@context": "https://schema.org", ...organization },
      { "@context": "https://schema.org", ...website },
      { "@context": "https://schema.org", ...assessmentService },
    ];
  }
  if (path === "/faq") {
    return [{ "@context": "https://schema.org", ...faqPage() }];
  }
  if (path.startsWith("/blog/")) {
    const post = getPostBySlug(path.slice("/blog/".length));
    if (post) return [{ "@context": "https://schema.org", ...article(post) }];
  }
  return [];
}
