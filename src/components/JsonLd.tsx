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
        "Wrenchli is a free vehicle symptom assessment platform. Describe your car symptom in plain English and get likely causes, fair cost ranges, and exactly what to ask your shop — no account required.",
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
      serviceType: "Vehicle Symptom Assessment",
      name: "Wrenchli Free Vehicle Symptom Assessment",
      description:
        "Get a free AI-powered symptom assessment for your vehicle issue, with likely causes, urgency guidance, cost ranges, and DIY options — all in one place.",
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
              name: "AI Vehicle Symptom Assessment",
              description:
                "Describe symptoms or enter a DTC code to get an instant symptom assessment with likely causes and cost ranges.",
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
