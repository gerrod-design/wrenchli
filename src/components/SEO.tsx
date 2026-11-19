import { Helmet } from "react-helmet-async";
import { isDevelopersDoor } from "@/lib/doorHost";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

const SITE = "https://www.wrenchli.net";
const DEFAULT_OG = `${SITE}/og-default.png`;

export default function SEO({ title, description, path, ogImage, ogTitle, ogDescription }: SEOProps) {
  // Developer-door canonicals are self-referential (segmentation
  // Phase 1, 2026-11-19): on developers.wrenchli.net the developer
  // pages live at door-relative URLs (/ and /gpt-actions), so their
  // canonical points at the door, not at the www page they moved from.
  // Everywhere else the canonical is exactly what it has always been.
  const doorPath =
    path === "/developers"
      ? "/"
      : path.startsWith("/developers/")
        ? path.slice("/developers".length)
        : null;
  const url =
    isDevelopersDoor() && doorPath !== null
      ? `https://developers.wrenchli.net${doorPath}`
      : `${SITE}${path}`;
  // Some pages pass a title that already ends with the brand name;
  // appending the suffix again produced "| Wrenchli | Wrenchli"
  // (front-door fix 9).
  const fullTitle =
    path === "/" || title.trimEnd().endsWith("Wrenchli") ? title : `${title} | Wrenchli`;
  const image = ogImage || DEFAULT_OG;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Wrenchli" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
