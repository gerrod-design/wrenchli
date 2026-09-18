import { Badge } from "@/components/ui/badge";

/**
 * Truth-in-advertising badge. Rendered on EVERY spotlight listing card and
 * detail page. An unclaimed or claimed-pending shop must never appear to be
 * a Wrenchli partner.
 */
export const INDEPENDENT_BADGE_TEXT =
  "Independent listing — not a Wrenchli partner yet";

export default function ListingBadge({ status }: { status: string }) {
  if (status === "partner") {
    return (
      <Badge className="bg-wrenchli-green/15 text-wrenchli-green border-wrenchli-green/30">
        Wrenchli partner
      </Badge>
    );
  }
  if (status === "claimed") {
    return (
      <Badge variant="outline" className="text-xs">
        Claimed by shop — verification pending
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      {INDEPENDENT_BADGE_TEXT}
    </Badge>
  );
}
