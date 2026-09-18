import { Star } from "lucide-react";

/**
 * Renders a Google rating ONLY with attribution. Never render a shop rating
 * without this component — unattributed ratings imply Wrenchli endorsement.
 * Returns null when no rating data exists (blank beats wrong).
 */
export default function GoogleRating({
  rating,
  reviewCount,
  size = "md",
}: {
  rating: number | null;
  reviewCount: number | null;
  size?: "sm" | "md";
}) {
  if (rating == null) return null;
  const starClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textClass = size === "sm" ? "text-xs" : "text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${textClass} text-muted-foreground`}
      aria-label={`${rating} out of 5 stars on Google${
        reviewCount != null ? `, based on ${reviewCount} reviews` : ""
      }`}
    >
      <Star className={`${starClass} fill-accent text-accent`} aria-hidden />
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      <span>
        on Google
        {reviewCount != null && ` · ${reviewCount.toLocaleString()} reviews`}
      </span>
    </span>
  );
}
