/**
 * Transportation panel link builders (Mobility Brief 1, 2026-11-13).
 *
 * The "While your car is down" panel is links and shop-reported
 * facts only: no booking, no fares or price estimates, no affiliate
 * parameters anywhere. Privacy rule (locked in the brief): the only
 * address ever embedded in a third-party URL is the SHOP's public
 * address. The consumer's location is resolved on their own device
 * by the provider's app (Uber `my_location` pickup, omitted Maps
 * origin); the finest consumer location ever used is a ZIP code,
 * and only as the destination of the "directions home" transit
 * variant. No consumer data is collected by these builders.
 */

export interface MobilityShop {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  offers_loaner?: boolean | null;
  offers_shuttle?: boolean | null;
  offers_pickup_delivery?: boolean | null;
  mobility_notes?: string | null;
}

/** "1 Woodward Ave, Detroit, MI 48226" — composed from whichever
 *  public address parts the provider row carries. */
export function shopFormattedAddress(shop: MobilityShop): string {
  const locality = [shop.city, shop.state].filter(Boolean).join(", ");
  const cityStateZip = [locality, shop.zip_code].filter(Boolean).join(" ");
  return [shop.address, cityStateZip].filter(Boolean).join(", ");
}

export interface MobilityAttribute {
  key: "loaner" | "shuttle" | "pickup_delivery";
  /** Short label, used under an attributing heading ("This shop
   *  offers, as reported by the shop"). */
  shortLabel: string;
  /** Self-attributing chip label, used where no heading carries
   *  the shop-reported framing (picker cards, referral status). */
  chipLabel: string;
}

const ATTRIBUTE_DEFS: (MobilityAttribute & {
  isSet: (shop: MobilityShop) => boolean;
})[] = [
  {
    key: "loaner",
    shortLabel: "Loaner cars",
    chipLabel: "Shop-reported: loaner cars",
    isSet: (s) => s.offers_loaner === true,
  },
  {
    key: "shuttle",
    shortLabel: "Shuttle service",
    chipLabel: "Shop-reported: shuttle service",
    isSet: (s) => s.offers_shuttle === true,
  },
  {
    key: "pickup_delivery",
    shortLabel: "Pickup and delivery",
    chipLabel: "Shop-reported: pickup and delivery",
    isSet: (s) => s.offers_pickup_delivery === true,
  },
];

/** The shop's mobility attributes that are actually set. An unset
 *  attribute produces nothing — never a "no" claim. */
export function mobilityAttributes(shop: MobilityShop): MobilityAttribute[] {
  return ATTRIBUTE_DEFS.filter((def) => def.isSet(shop)).map(
    ({ key, shortLabel, chipLabel }) => ({ key, shortLabel, chipLabel })
  );
}

export function hasMobilityAttributes(shop: MobilityShop): boolean {
  return mobilityAttributes(shop).length > 0 || Boolean(shop.mobility_notes?.trim());
}

/**
 * Uber universal link (form verified against Uber's developer
 * documentation, Brief 1 research 2026-11-09). No `client_id`:
 * affiliate attribution is a commercial agreement and is out of
 * scope for V1.
 *
 * - "toShop": pickup is the rider's own location (`my_location`,
 *   resolved on their device), dropoff is the shop.
 * - "fromShop": pickup is the shop, dropoff is left for the rider
 *   to enter in Uber (their home address never passes through a
 *   Wrenchli-built URL).
 * With no shop, the link opens Uber's rider flow with only the
 * device-resolved pickup set.
 */
export function uberRideUrl(
  shop?: MobilityShop | null,
  direction: "toShop" | "fromShop" = "toShop"
): string {
  const parts: string[] = ["action=setPickup"];
  const point = (
    role: "pickup" | "dropoff",
    target: MobilityShop | "my_location"
  ) => {
    if (target === "my_location") {
      parts.push(`${role}[latitude]=my_location`);
      return;
    }
    if (target.lat != null && target.lng != null) {
      parts.push(`${role}[latitude]=${target.lat}`, `${role}[longitude]=${target.lng}`);
    }
    parts.push(`${role}[nickname]=${encodeURIComponent(target.name)}`);
    const address = shopFormattedAddress(target);
    if (address) {
      parts.push(`${role}[formatted_address]=${encodeURIComponent(address)}`);
    }
  };

  if (!shop) {
    point("pickup", "my_location");
  } else if (direction === "toShop") {
    point("pickup", "my_location");
    point("dropoff", shop);
  } else {
    point("pickup", shop);
  }
  return `https://m.uber.com/ul/?${parts.join("&")}`;
}

/**
 * Lyft ships as a PLAIN link in V1 (fallback recorded at build
 * time, 2026-11-13). Lyft's documented `lyft://` prefill scheme
 * comes from its deprecated SDK program, and no build-time test
 * available here could prove a current Lyft app build still
 * honors it — an unproven scheme link can render as a dead button,
 * which the panel never does. The plain rider page was verified
 * live at build time. Copy never promises a prefilled Lyft ride.
 */
export const LYFT_RIDE_URL = "https://www.lyft.com/rider";

export function lyftRideUrl(): string {
  return LYFT_RIDE_URL;
}

/**
 * Google Maps transit directions (URLs API form verified against
 * Google's documentation, Brief 1 research 2026-11-09). Origin is
 * always omitted, so Maps starts from the rider's own location.
 * `destination` is either the shop's public address or — for the
 * "directions home" variant only — the consumer's ZIP code, never
 * a street address. With no destination the link opens the Maps
 * directions form.
 */
export function transitDirectionsUrl(destination?: string | null): string {
  const base = "https://www.google.com/maps/dir/?api=1&travelmode=transit";
  return destination
    ? `${base}&destination=${encodeURIComponent(destination)}`
    : base;
}

/** SMART's own Trip Planner on smartbus.org, linked unprefilled:
 *  whether the planner accepts prefilled origin/destination
 *  parameters is unverified (Brief 1 research 2026-11-09). The URL
 *  itself was verified live on smartbus.org at build time. */
export const SMART_TRIP_PLANNER_URL = "https://www.smartbus.org/Services/Trip-Planner";

/** Avis (traditional rental). Prefill parameters are unverified,
 *  so V1 links to Avis's booking home, verified live at build
 *  time. No affiliate parameters. */
export const AVIS_URL = "https://www.avis.com/en/home";

/** Turo (P2P rental). Prefill parameters are unverified, so V1
 *  links to Turo's home/search surface, verified live at build
 *  time. No affiliate parameters. */
export const TURO_URL = "https://turo.com";

/** Minimal hop shape the Garage panel logic needs. */
export interface ReferralHopLike {
  shop_id: string;
  status: string;
  preference_order: number;
}

/**
 * Which shop the Garage panel points at for one referral chain:
 * the accepted hop's shop once a shop has accepted (the car is
 * actually going in); before that, the shop of the outcome /
 * completion hop during the confirmation window, then the active
 * hop, then the latest hop on the owner's list.
 */
export function pickPanelShop(
  hops: ReferralHopLike[],
  shopById: Record<string, MobilityShop>
): MobilityShop | null {
  if (hops.length === 0) return null;
  const ordered = [...hops].sort((a, b) => a.preference_order - b.preference_order);
  const byStatus = (statuses: string[]) =>
    ordered.find((h) => statuses.includes(h.status));
  const hop =
    byStatus(["accepted"]) ??
    byStatus(["outcome_reported"]) ??
    byStatus(["completed"]) ??
    byStatus(["sent", "viewed"]) ??
    ordered[ordered.length - 1];
  return shopById[hop.shop_id] ?? null;
}

/** The "getting your car back" variant: once a hop has reported an
 *  outcome or completed, the panel also offers directions home. */
export function chainShowsHomeDirections(hops: ReferralHopLike[]): boolean {
  return hops.some((h) => h.status === "outcome_reported" || h.status === "completed");
}
