import { Helmet } from "react-helmet-async";

const SITE = "https://wrenchli.net";

/** Organization + WebSite + Service structured data for the homepage */
export function HomeJsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Wrenchli",
      url: SITE,
      logo: `${SITE}/favicon.png`,
      description:
        "Wrenchli connects vehicle owners with transparent repair pricing, instant shop quotes, DIY guides, and flexible financing — launching in Michigan and Ohio.",
      sameAs: [],
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@wrenchli.com",
        contactType: "customer support",
      },
      areaServed: [
        { "@type": "State", name: "Michigan" },
        { "@type": "State", name: "Ohio" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Wrenchli",
      url: SITE,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Vehicle Repair Diagnosis & Quoting",
      name: "Wrenchli Free Vehicle Diagnosis",
      description:
        "Get a free AI-powered diagnosis for your vehicle issue, compare repair costs from local shops, and explore DIY options — all in one place.",
      provider: {
        "@type": "Organization",
        name: "Wrenchli",
        url: SITE,
      },
      areaServed: [
        { "@type": "State", name: "Michigan" },
        { "@type": "State", name: "Ohio" },
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free vehicle symptom assessment",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Wrenchli Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "AI Vehicle Diagnosis",
              description:
                "Describe symptoms or enter a DTC code to get an instant diagnosis with cost estimates.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Shop Quote Comparison",
              description:
                "Compare repair quotes from vetted local shops side by side.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "DIY Repair Guides",
              description:
                "Step-by-step video tutorials and parts links for repairs you can do yourself.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Repair Financing",
              description:
                "Flexible payment plans for vehicle repairs. All credit types welcome.",
            },
          },
        ],
      },
    },
  ];

  return (
    <Helmet>
      {data.map((d, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(d)}
        </script>
      ))}
    </Helmet>
  );
}

/** FAQPage structured data */
export function FaqJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
