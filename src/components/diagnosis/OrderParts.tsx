import { useState } from "react";
import { ExternalLink, Wrench, Lightbulb, AlertTriangle, ChevronDown, MapPin } from "lucide-react";
import { getPartsForDiagnosis, buildRetailerUrl } from "@/data/partsLibrary";
import { cn } from "@/lib/utils";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import { trackAdClick } from "@/lib/adClickTracker";

import type { RetailerId } from "@/data/partsLibrary";

const retailers: { id: RetailerId; label: string; bg: string; text: string; subLabel?: string }[] = [
  { id: "amazon", label: "Amazon", subLabel: "Order online (2-3 days)", bg: "hsl(30 100% 50%)", text: "hsl(0 0% 10%)" },
];

const pickupRetailers: { id: string; label: string; subLabel: string; bg: string; text: string; urlBuilder: (query: string) => string; destination: string }[] = [
  {
    id: "autozone",
    label: "AutoZone",
    subLabel: "Same-day pickup",
    bg: "hsl(0 72% 45%)",
    text: "white",
    urlBuilder: (q) => `https://www.autozone.com/searchresult?searchtext=${encodeURIComponent(q)}`,
    destination: "autozone",
  },
  {
    id: "oreilly-pickup",
    label: "O'Reilly",
    subLabel: "Same-day pickup",
    bg: "hsl(142 71% 29%)",
    text: "white",
    urlBuilder: (q) => `https://www.oreillyauto.com/search?q=${encodeURIComponent(q)}`,
    destination: "orielly",
  },
];

interface OrderPartsProps {
  diagnosisTitle: string;
  vehicle: string;
}

export default function OrderParts({ diagnosisTitle, vehicle }: OrderPartsProps) {
  const info = getPartsForDiagnosis(diagnosisTitle);
  const [showTools, setShowTools] = useState(false);

  if (!info) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Parts data isn't available for this specific issue yet. Try searching directly:
        </p>
        <a
          href={buildRetailerUrl("amazon", diagnosisTitle.replace(/\s+/g, "+"), vehicle)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-wrenchli-teal hover:underline"
        >
          Search Amazon <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <h5 className="text-sm font-bold text-foreground">
        🛒 Parts You May Need for {diagnosisTitle} — {vehicle}
      </h5>

      {/* Parts list */}
      <div className="space-y-2.5">
        {info.parts.map((part, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {part.name}
                  {!part.required && (
                    <span className="ml-1.5 text-[10px] font-normal text-muted-foreground italic">
                      (if needed)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Estimated price: {part.estimatedPrice}</p>
              </div>
            </div>

            {part.note && (
              <p className="text-[11px] text-muted-foreground italic">💡 {part.note}</p>
            )}

            {/* Retailer buttons */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground">Get the parts you need:</p>
              <div className="flex flex-wrap gap-1.5">
                {retailers.map((r) => (
                  <a
                    key={r.id}
                    href={buildRetailerUrl(r.id, part.searchQuery, vehicle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
                    style={{ backgroundColor: r.bg, color: r.text }}
                  >
                    {r.label} — {r.subLabel} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Need it today? Pick up locally:</p>
              <div className="flex flex-wrap gap-1.5">
                {pickupRetailers.map((r) => (
                  <a
                    key={r.id}
                    href={r.urlBuilder(part.searchQuery + " " + vehicle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackAdClick({ click_type: "browse_parts", part_name: part.name, destination: r.destination })}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
                    style={{ backgroundColor: r.bg, color: r.text }}
                  >
                    <MapPin className="h-2.5 w-2.5" /> {r.label} — {r.subLabel}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tools needed — collapsible */}
      {info.tools.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <button
            onClick={() => setShowTools(!showTools)}
            className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Wrench className="h-3 w-3 text-wrenchli-teal" /> 🔧 Tools You'll Need
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", showTools && "rotate-180")} />
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              showTools ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="px-3 pb-3 space-y-2.5">
              <ul className="space-y-0.5">
                {info.tools.map((tool, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>

              {/* Safety note */}
              <div className="flex gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                <p className="text-[11px] text-foreground">
                  <span className="font-semibold">⚠️ Safety note:</span> Always use jack stands when working under a vehicle. Never rely on a jack alone. Work on a flat, level surface.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro tip */}
      {info.proTip && (
        <div className="flex gap-2 rounded-lg border border-wrenchli-teal/20 bg-wrenchli-teal/5 p-3">
          <Lightbulb className="h-4 w-4 shrink-0 text-wrenchli-teal mt-0.5" />
          <p className="text-[11px] text-foreground">
            <span className="font-semibold">Pro tip:</span> {info.proTip}
          </p>
        </div>
      )}

      {/* Affiliate disclosure */}
      <AffiliateDisclosure />
    </div>
  );
}
