import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}

const SITE = "https://wrenchli.net";
const DEFAULT_OG = `${SITE}/og-default.png`;

export default function SEO({ title, description, path, ogImage }: SEOProps) {
  const url = `${SITE}${path}`;
  const fullTitle = path === "/" ? title : `${title} | Wrenchli`;
  const image = ogImage || DEFAULT_OG;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Wrenchli" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
