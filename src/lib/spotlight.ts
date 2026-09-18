/**
 * Detroit Shop Spotlight — shared types and helpers.
 *
 * Data comes ONLY from the spotlight_* tables (hand-verified independent
 * listings). Never from the legacy find-shops path or the paused
 * shop-marketplace tables.
 */

export interface SpotlightShop {
  id: string;
  slug: string;
  name: string;
  address_line1: string | null;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  website_url: string | null;
  hours_json: Record<string, string> | null;
  specialties: string[];
  description: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  listing_status: string;
  verified_at: string | null;
}

export interface SpotlightTechnician {
  id: string;
  shop_id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  specialties: string[];
  years_experience: number | null;
  ase_certifications: string[];
  mi_cert_number: string | null;
  mi_cert_verified: boolean;
  status: string;
  /** Null until real Wrenchli-verified outcome data exists. Never seeded. */
  wrenchli_job_count: number | null;
  wrenchli_rating_avg: number | null;
}

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** Normalizes hours_json into an ordered [label, value] list for display. */
export function formatHours(
  hours: Record<string, string> | null
): { label: string; value: string }[] {
  if (!hours) return [];
  return DAY_ORDER.filter((d) => hours[d]).map((d) => ({
    label: DAY_LABELS[d],
    value: hours[d],
  }));
}

/** Builds initials for the technician avatar fallback. */
export function techInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
