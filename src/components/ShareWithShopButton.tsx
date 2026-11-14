import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Share2, Loader2, CheckCircle, Copy, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { trackPlausibleEvent } from "@/lib/analytics";
import TransportationPanel, { MobilityAttributeChips } from "@/components/TransportationPanel";
import type { MobilityShop } from "@/lib/transportationLinks";
import { TRANSPORT_LIABILITY_LINE } from "@/lib/referralTransport";
import { INSPECTION_PRIVACY_DISCLOSURE } from "@/config/inspection";

interface ShareWithShopProps {
  diagnosisTitle: string;
  diagnosisCode?: string | null;
  diagnosisUrgency?: string | null;
  diyFeasibility?: string | null;
  diagnosisDetails?: any;
  vehicleYear?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleTrim?: string | null;
  vin?: string | null;
  estimatedCostLow?: number | null;
  estimatedCostHigh?: number | null;
  costEstimateDetails?: any;
  metroArea?: string | null;
  zipCode?: string | null;
  photoUrls?: string[];
  audioClipUrl?: string | null;
  videoFrameUrls?: string[];
  chatSummary?: string | null;
  customerNotes?: string | null;
  quoteRequestId?: string | null;
  className?: string;
  /**
   * Mobility Brief 2: "inspection" renders the mobile-inspector
   * variant of this pilot send — a kind-filtered picker (service
   * area and radius instead of an address, the inspector's own
   * agreed fee when one is set), the visit-details form, and the
   * pre-send privacy disclosure. The default "repair" is the
   * Phase 1 / Brief 1 / Brief 3 send, unchanged.
   */
  mode?: "repair" | "inspection";
  /**
   * Pilot mode (Referral Lifecycle Phase 1): the owner picks an ordered
   * preference list of 1 to 3 shops and the package is addressed to the
   * first shop only. Routing is SEQUENTIAL — the package escalates to
   * the next shop on decline or window expiry, never to several shops
   * at once. The referral_packages row is written WITHOUT the owner's
   * name, email, or phone on every path (those columns are never
   * written by this component at all).
   */
  pilot?: boolean;
}

/** Picker option: the provider row plus Brief 1's mobility
 *  attributes, rendered as shop-reported chips when set. */
interface ShopOption extends MobilityShop {
  id: string;
  name: string;
  provider_kind?: string | null;
  service_area_label?: string | null;
  service_radius_miles?: number | null;
  inspection_fee?: number | null;
}

const MAX_PILOT_SHOPS = 3;

export default function ShareWithShopButton(props: ShareWithShopProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [addressedNote, setAddressedNote] = useState<string | null>(null);

  // Pilot shop picker state
  const [shops, setShops] = useState<ShopOption[] | null>(null);
  const [shopsError, setShopsError] = useState(false);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);

  // Mobility Brief 3 (Option A): the owner can ask for pickup and
  // delivery of a car that can't be driven. The request lives on the
  // package; the shop arranges the tow or flatbed itself.
  const [needsTransport, setNeedsTransport] = useState(false);
  const [transportNote, setTransportNote] = useState("");
  const [onlyPickupShops, setOnlyPickupShops] = useState(false);

  // Mobility Brief 2 (inspection mode): the visit details and the
  // three minimum items. The minimum items are written ONLY to
  // inspection_details at send time; the token RPC serves them to
  // the inspector only after acceptance.
  const isInspection = props.mode === "inspection";
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleLocation, setVehicleLocation] = useState("");
  const [locationDescriptor, setLocationDescriptor] = useState("");
  const [locationZip, setLocationZip] = useState("");
  const [preferredWindows, setPreferredWindows] = useState("");
  const inspectionDetailsValid =
    !isInspection ||
    (firstName.trim() !== "" &&
      phone.trim() !== "" &&
      vehicleLocation.trim() !== "");

  useEffect(() => {
    if (!props.pilot) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select(
          "id, name, address, city, state, zip_code, lat, lng, offers_loaner, offers_shuttle, offers_pickup_delivery, mobility_notes, provider_kind, service_area_label, service_radius_miles, inspection_fee"
        )
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error) {
        setShopsError(true);
        setShops([]);
        return;
      }
      // Mobility Brief 2: the picker is kind-filtered. The filter
      // runs client-side over the (small) provider list so the
      // query shape stays the one Phase 1 established; a missing
      // provider_kind reads as the column default, 'shop'.
      const wantKind = isInspection ? "mobile_inspector" : "shop";
      setShops(
        ((data as ShopOption[] | null) ?? []).filter(
          (shop) => (shop.provider_kind ?? "shop") === wantKind
        )
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [props.pilot, isInspection]);

  const toggleShop = (shopId: string) => {
    setSelectedShopIds((prev) => {
      if (prev.includes(shopId)) return prev.filter((id) => id !== shopId);
      if (prev.length >= MAX_PILOT_SHOPS) return prev;
      return [...prev, shopId];
    });
  };

  // Brief 3 picker behavior: when the owner needs pickup and
  // delivery, shops that offer it surface first (stable sort — the
  // directory's name order is kept within each group), and the
  // owner can narrow the list to just those shops. Filtering is
  // display-only; an already-picked shop stays picked.
  const selectedShops = (shops ?? []).filter((s) =>
    selectedShopIds.includes(s.id)
  );
  const anySelectedOffersPickup = selectedShops.some(
    (s) => s.offers_pickup_delivery === true
  );
  const showNoOfferNotice =
    needsTransport && selectedShopIds.length > 0 && !anySelectedOffersPickup;
  const displayShops = (() => {
    if (!shops) return [];
    let list = shops;
    if (needsTransport) {
      list = [...list].sort(
        (a, b) =>
          Number(b.offers_pickup_delivery === true) -
          Number(a.offers_pickup_delivery === true)
      );
      if (onlyPickupShops) {
        list = list.filter((s) => s.offers_pickup_delivery === true);
      }
    }
    return list;
  })();

  const createPackage = async (
    userId: string,
    transport?: { requested: boolean; note: string | null }
  ) => {
    // Privacy (Phase 1, locked): customer_name / customer_email /
    // customer_phone are never written to referral_packages here.
    const { data, error } = await supabase
      .from("referral_packages" as any)
      .insert({
        user_id: userId,
        // Brief 3: the pickup/delivery request rides on the package
        // so every shop in the chain sees it. Only the pilot send
        // passes it; the legacy share path leaves the defaults.
        ...(transport
          ? {
              transport_requested: transport.requested,
              transport_note: transport.note,
            }
          : {}),
        diagnosis_title: props.diagnosisTitle,
        diagnosis_code: props.diagnosisCode || null,
        diagnosis_urgency: props.diagnosisUrgency || null,
        diagnosis_details: props.diagnosisDetails || {},
        diy_feasibility: props.diyFeasibility || null,
        vehicle_year: props.vehicleYear || null,
        vehicle_make: props.vehicleMake || null,
        vehicle_model: props.vehicleModel || null,
        vehicle_trim: props.vehicleTrim || null,
        vin: props.vin || null,
        estimated_cost_low: props.estimatedCostLow || null,
        estimated_cost_high: props.estimatedCostHigh || null,
        cost_estimate_details: props.costEstimateDetails || {},
        metro_area: props.metroArea || null,
        zip_code: props.zipCode || null,
        photo_urls: props.photoUrls || [],
        audio_clip_url: props.audioClipUrl || null,
        video_frame_urls: props.videoFrameUrls || [],
        chat_summary: props.chatSummary || null,
        customer_notes: props.customerNotes || null,
        quote_request_id: props.quoteRequestId || null,
      } as any)
      .select("id, token")
      .single();
    if (error) throw error;
    return data as any as { id: string; token: string };
  };

  const finishShare = async (url: string) => {
    // Funnel event of record: the assessment package was created to hand
    // to a shop. Only the vehicle make goes to Plausible — never the
    // token, the diagnosis text, or the VIN.
    trackPlausibleEvent(
      "handoff_sent",
      props.vehicleMake ? { vehicle_make: props.vehicleMake } : undefined
    );

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Wrenchli Repair Referral: ${props.diagnosisTitle}`,
          text: `View diagnostic details for ${[props.vehicleYear, props.vehicleMake, props.vehicleModel].filter(Boolean).join(" ")}`,
          url,
        });
      } catch {
        // User cancelled share — show copy fallback
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success("Referral link copied to clipboard!");
    }
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to share with a shop.");
        setLoading(false);
        return;
      }

      const pkg = await createPackage(user.id);
      const url = `${window.location.origin}/referral/${pkg.token}`;
      setShareUrl(url);
      await finishShare(url);
    } catch (e) {
      console.error("Share error:", e);
      toast.error("Failed to create referral package.");
    } finally {
      setLoading(false);
    }
  };

  const handlePilotSend = async () => {
    if (selectedShopIds.length === 0) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to send to a shop.");
        setLoading(false);
        return;
      }

      const pkg = await createPackage(
        user.id,
        isInspection
          ? undefined
          : {
              requested: needsTransport,
              note: needsTransport ? transportNote.trim() || null : null,
            }
      );

      // Addressed, sequential send: exactly ONE shop_referrals row is
      // created now (the owner's first choice). The remaining shops
      // live only in shop_chain and are reached one at a time by the
      // escalation engine (decline or end-of-next-business-day expiry).
      const firstShopId = selectedShopIds[0];
      const chainId = crypto.randomUUID();
      const { error: referralError } = await supabase
        .from("shop_referrals" as any)
        .insert({
          package_id: pkg.id,
          shop_id: firstShopId,
          owner_user_id: user.id,
          chain_id: chainId,
          shop_chain: selectedShopIds,
          preference_order: 1,
          referral_kind: isInspection ? "inspection" : "repair",
          // Brief 3: start this hop's transport thread. (A database
          // trigger does the same from the package flag, including
          // for escalation-created hops.)
          ...(needsTransport ? { transport_status: "requested" } : {}),
        } as any);

      // Mobility Brief 2: the inspection chain's details row —
      // the only place the visit minimum is written. It is keyed
      // by the chain so every hop of this chain resolves to the
      // same record, and it is never written to referral_packages.
      if (isInspection && !referralError) {
        const { error: detailsError } = await supabase
          .from("inspection_details" as any)
          .insert({
            chain_id: chainId,
            package_id: pkg.id,
            owner_user_id: user.id,
            vehicle_location_text: vehicleLocation.trim(),
            location_descriptor: locationDescriptor.trim() || null,
            location_zip: locationZip.trim() || props.zipCode || null,
            preferred_windows: preferredWindows.trim() || null,
            consumer_first_name: firstName.trim(),
            consumer_phone: phone.trim(),
          } as any);
        if (detailsError) {
          console.error("Inspection details insert failed:", detailsError);
          toast.error(
            "Your inspection request was sent, but the visit details could not be saved. Please contact Wrenchli support before the inspector accepts."
          );
        }
      }

      const url = `${window.location.origin}/referral/${pkg.token}`;
      setShareUrl(url);

      if (referralError) {
        console.error("Addressed referral insert failed:", referralError);
        toast.error(
          "Your package was created, but the addressed send failed. You can still share the link with the shop directly."
        );
        setAddressedNote(null);
      } else {
        const firstShopName =
          shops?.find((s) => s.id === firstShopId)?.name ||
          (isInspection ? "your first-choice inspector" : "your first-choice shop");
        setAddressedNote(
          isInspection
            ? selectedShopIds.length > 1
              ? `Sent to ${firstShopName} first. If they pass or do not respond by the end of the next business day, it goes to your next choice automatically. The inspector who accepts will see your first name, phone number, and the car's location — nobody sees them before that.`
              : `Sent to ${firstShopName}. They have until the end of the next business day to respond. When they accept, they will see your first name, phone number, and the car's location — nobody sees them before that.`
            : selectedShopIds.length > 1
              ? `Sent to ${firstShopName} first. If they pass or do not respond by the end of the next business day, it goes to your next choice automatically.`
              : `Sent to ${firstShopName}. They have until the end of the next business day to respond.`
        );
      }

      await finishShare(url);
    } catch (e) {
      console.error("Pilot send error:", e);
      toast.error("Failed to send referral package.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  if (shareUrl) {
    return (
      <div className={`rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3 ${props.className || ""}`}>
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">Referral Package Created!</span>
        </div>
        {addressedNote && <p className="text-xs text-muted-foreground">{addressedNote}</p>}
        {props.pilot && needsTransport && (
          <p className="text-xs text-muted-foreground">
            {anySelectedOffersPickup
              ? `Pickup and delivery requested. ${TRANSPORT_LIABILITY_LINE}`
              : "None of the shops you chose has said it offers pickup and delivery. Your pickup and delivery request still goes with your package, and each shop will see it."}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Share this link with a repair shop — they'll see your full assessment, photos, audio, and cost estimate.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 h-9 rounded-md border border-border bg-muted/50 px-3 text-xs font-mono truncate"
          />
          <Button size="sm" variant="outline" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
        {props.pilot && !isInspection && (
          <TransportationPanel
            shop={shops?.find((s) => s.id === selectedShopIds[0]) ?? null}
          />
        )}
      </div>
    );
  }

  if (props.pilot) {
    return (
      <div className={`rounded-xl border border-border bg-card p-4 space-y-3 ${props.className || ""}`}>
        <div>
          <p className="font-semibold text-sm">
            {isInspection
              ? "Have a mobile inspector look at it"
              : "Send this assessment to a shop"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isInspection ? (
              <>
                Pick up to {MAX_PILOT_SHOPS} mobile inspectors in the order you
                prefer. Your request goes to one inspector at a time — if the
                first one passes or does not respond by the end of the next
                business day, it moves to your next choice. The fee shown is
                that inspector&rsquo;s own fee, paid to the inspector.
              </>
            ) : (
              <>
                Pick up to {MAX_PILOT_SHOPS} shops in the order you prefer. Your package goes to
                one shop at a time — if the first shop passes or does not respond by the end of
                the next business day, it moves to your next choice. Your name and contact
                details are never included.
              </>
            )}
          </p>
        </div>

        {shops === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />{" "}
            {isInspection ? "Loading inspectors…" : "Loading shops…"}
          </p>
        ) : shops.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {shopsError
              ? isInspection
                ? "The inspector directory could not be loaded right now. Please try again later."
                : "The shop directory could not be loaded right now. Please try again later."
              : isInspection
                ? "No mobile inspectors are available to send to yet. Check back soon — pilot inspectors are being added."
                : "No participating shops are available to send to yet. Check back soon — pilot shops are being added."}
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {displayShops.map((shop) => {
                const orderIndex = selectedShopIds.indexOf(shop.id);
                const selected = orderIndex >= 0;
                const disabled =
                  !selected && selectedShopIds.length >= MAX_PILOT_SHOPS;
                return (
                  <li key={shop.id}>
                    <button
                      type="button"
                      onClick={() => toggleShop(shop.id)}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          selected
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {selected ? orderIndex + 1 : "•"}
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium block">{shop.name}</span>
                        {isInspection ? (
                          <span className="mt-1 block space-y-0.5 text-xs text-muted-foreground">
                            {shop.service_area_label && (
                              <span className="block">{shop.service_area_label}</span>
                            )}
                            {shop.service_radius_miles != null && (
                              <span className="block">
                                Travels up to {shop.service_radius_miles} miles
                              </span>
                            )}
                            {shop.inspection_fee != null && (
                              <span className="block font-medium text-foreground">
                                Inspection fee: $
                                {Number(shop.inspection_fee).toLocaleString()} —
                                this inspector&rsquo;s fee, paid to the inspector
                              </span>
                            )}
                          </span>
                        ) : (
                          <MobilityAttributeChips shop={shop} className="mt-1" />
                        )}
                      </span>
                      {selected && (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          Choice {orderIndex + 1}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {needsTransport && onlyPickupShops && displayShops.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No shops in the list have said they offer pickup and delivery.
              </p>
            )}
            {!isInspection && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={needsTransport}
                  onChange={(e) => setNeedsTransport(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="font-medium">
                  This car can&rsquo;t be driven — I need pickup and delivery
                </span>
              </label>
              {needsTransport && (
                <>
                  <p className="text-xs text-muted-foreground">
                    {TRANSPORT_LIABILITY_LINE}
                  </p>
                  <label className="block text-xs text-muted-foreground">
                    Where the car sits, and anything the driver should know
                    (optional)
                    <textarea
                      value={transportNote}
                      onChange={(e) => setTransportNote(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={onlyPickupShops}
                      onChange={(e) => setOnlyPickupShops(e.target.checked)}
                    />
                    Only show shops that offer pickup and delivery
                  </label>
                  {showNoOfferNotice && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      None of the shops you chose has said it offers pickup and
                      delivery.
                    </p>
                  )}
                </>
              )}
            </div>
            )}
            {isInspection && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  {INSPECTION_PRIVACY_DISCLOSURE}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-muted-foreground">
                    Your first name *
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="block text-xs text-muted-foreground">
                    Your phone number *
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                      autoComplete="tel"
                    />
                  </label>
                </div>
                <label className="block text-xs text-muted-foreground">
                  Where the car will be — the exact location for the visit *
                  <input
                    value={vehicleLocation}
                    onChange={(e) => setVehicleLocation(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    placeholder="Street address or a precise description"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-muted-foreground">
                    What kind of place is it?
                    <input
                      value={locationDescriptor}
                      onChange={(e) => setLocationDescriptor(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                      placeholder="Driveway, street parking, workplace lot…"
                    />
                  </label>
                  <label className="block text-xs text-muted-foreground">
                    ZIP code for the visit
                    <input
                      value={locationZip}
                      onChange={(e) => setLocationZip(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                      placeholder={props.zipCode || "ZIP"}
                    />
                  </label>
                </div>
                <label className="block text-xs text-muted-foreground">
                  When works for you? (preferred times)
                  <textarea
                    value={preferredWindows}
                    onChange={(e) => setPreferredWindows(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    placeholder="e.g. Weekday mornings, or Saturday after 10"
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  Before an inspector accepts, they see only the car, your
                  concern, the ZIP, the kind of place, and your preferred
                  times.
                </p>
              </div>
            )}
            <Button
              onClick={handlePilotSend}
              disabled={
                loading || selectedShopIds.length === 0 || !inspectionDetailsValid
              }
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isInspection
                ? `Send to ${selectedShopIds.length > 0 ? "first-choice inspector" : "an inspector"}`
                : `Send to ${selectedShopIds.length > 0 ? "first-choice shop" : "a shop"}`}
            </Button>
          </>
        )}

        {/* Mobility Brief 1: the transportation panel sits alongside
            the send control — unprefilled until the owner picks a
            shop, then pointed at their first choice. */}
        {!isInspection && (
          <TransportationPanel
            shop={shops?.find((s) => s.id === selectedShopIds[0]) ?? null}
          />
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleShare}
      disabled={loading}
      variant="outline"
      className={`border-accent text-accent hover:bg-accent/10 font-semibold ${props.className || ""}`}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
      Share with Shop
    </Button>
  );
}
