/**
 * FTC-compliant affiliate disclosure for pages with affiliate links.
 * Must be visible without scrolling when affiliate links are visible.
 * Text is locked verbatim per the product rulebook (registry §1.8).
 */
export const AFFILIATE_DISCLOSURE_TEXT =
  "Some links on this page are affiliate links. If you purchase through them, Wrenchli may earn a small commission at no additional cost to you.";

const AffiliateDisclosure = () => (
  <p className="text-xs text-muted-foreground mt-3">
    {AFFILIATE_DISCLOSURE_TEXT}
  </p>
);

export default AffiliateDisclosure;
