import type { ReactNode } from "react";
import { Bus, Car, ExternalLink, KeyRound } from "lucide-react";
import {
  AVIS_URL,
  TURO_URL,
  SMART_TRIP_PLANNER_URL,
  lyftRideUrl,
  mobilityAttributes,
  shopFormattedAddress,
  transitDirectionsUrl,
  uberRideUrl,
  type MobilityShop,
} from "@/lib/transportationLinks";

/**
 * Mobility attribute chips (Mobility Brief 1). Rendered only for
 * attributes the shop actually has set — an unset attribute renders
 * nothing, never a "no" claim. The default framing carries the
 * shop-reported attribution inside the chip itself (picker cards,
 * Garage referral status); `framing="short"` is for contexts whose
 * heading already carries the attribution.
 */
export function MobilityAttributeChips({
  shop,
  framing = "chip",
  className,
}: {
  shop: MobilityShop;
  framing?: "chip" | "short";
  className?: string;
}) {
  const attributes = mobilityAttributes(shop);
  if (attributes.length === 0) return null;
  return (
    <span className={`flex flex-wrap gap-1 ${className || ""}`}>
      {attributes.map((attr) => (
        <span
          key={attr.key}
          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          {framing === "chip" ? attr.chipLabel : attr.shortLabel}
        </span>
      ))}
    </span>
  );
}

interface TransportationPanelProps {
  /** The shop the panel points at, when one is known (the owner's
   *  first pick in the wizard; the accepted hop's shop in the
   *  Garage). Null renders the unprefilled variant. */
  shop?: MobilityShop | null;
  /** Consumer ZIP for the "directions home" transit variant —
   *  ZIP-level only, never a street address (Brief 1 privacy). */
  homeZip?: string | null;
  /** Show the "getting your car back" variant (directions home)
   *  alongside directions to the shop. */
  showHomeDirections?: boolean;
  className?: string;
}

function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
      >
        {children}
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    </li>
  );
}

/**
 * "While your car is down" — the alternative transportation panel
 * (Mobility Brief 1, approved 2026-11-13 for both placements:
 * wizard results / Plan step and the Garage referral status).
 *
 * Links and shop-reported facts only. No booking, no fares, no
 * prices, no affiliate parameters, and no wording that implies
 * any platform endorses or works with Wrenchli. The panel never
 * blocks and never renders a dead button: with no shop and no
 * location it degrades to plain outbound links.
 */
export default function TransportationPanel({
  shop,
  homeZip,
  showHomeDirections = false,
  className,
}: TransportationPanelProps) {
  const shopAddress = shop ? shopFormattedAddress(shop) : "";
  const attributes = shop ? mobilityAttributes(shop) : [];
  const notes = shop?.mobility_notes?.trim();
  const homeDirections = Boolean(showHomeDirections && homeZip);

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 space-y-3 ${className || ""}`}
      data-testid="transportation-panel"
    >
      <div>
        <p className="font-semibold text-sm">Other ways to get around</p>
        <p className="text-xs text-muted-foreground mt-1">
          {shop
            ? `While your car is at ${shop.name}, or on its way there and back. `
            : ""}
          These links open in each provider's own app or website. Wrenchli does not
          book rides or rentals, and no fares or prices are shown here.
        </p>
      </div>

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
          <Car className="h-3.5 w-3.5" /> Ride services
        </p>
        <ul className="space-y-1">
          <PanelLink href={uberRideUrl(shop)}>
            {shop ? "Uber — ride to the shop" : "Uber — request a ride"}
          </PanelLink>
          {shop && (
            <PanelLink href={uberRideUrl(shop, "fromShop")}>
              Uber — ride home from the shop
            </PanelLink>
          )}
          <PanelLink href={lyftRideUrl()}>Lyft — request a ride</PanelLink>
        </ul>
      </div>

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
          <Bus className="h-3.5 w-3.5" /> Public transit
        </p>
        <ul className="space-y-1">
          <PanelLink href={transitDirectionsUrl(shopAddress || null)}>
            {shop ? "Transit directions to the shop" : "Transit directions"}
          </PanelLink>
          {homeDirections && (
            <PanelLink href={transitDirectionsUrl(homeZip)}>
              Transit directions home
            </PanelLink>
          )}
          <PanelLink href={SMART_TRIP_PLANNER_URL}>SMART Trip Planner</PanelLink>
        </ul>
      </div>

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
          <KeyRound className="h-3.5 w-3.5" /> Car rentals
        </p>
        <ul className="space-y-1">
          <PanelLink href={AVIS_URL}>Avis — rent a car</PanelLink>
          <PanelLink href={TURO_URL}>Turo — rent a car</PanelLink>
        </ul>
      </div>

      {shop && (attributes.length > 0 || notes) && (
        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            This shop offers, as reported by the shop
          </p>
          {attributes.length > 0 && (
            <MobilityAttributeChips shop={shop} framing="short" />
          )}
          {notes && <p className="text-sm text-muted-foreground">{notes}</p>}
        </div>
      )}
    </div>
  );
}
