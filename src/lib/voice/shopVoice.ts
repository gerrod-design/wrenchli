// ── Shop-talk voice layer: the swappable seam ──
// Option B inbound build spec (2026-11-02): the Phase 1 architecture must
// keep the voice layer swappable, because a tool Lynette Foxhall built is
// aligned with this layer and build-versus-adopt for voice gets decided
// when it is evaluated. The /for-shops/talk page talks only to this
// interface, never to a provider directly.
//
// Phase 1 ships with the unavailable provider below: the "Talk now" rung
// is present on the page and routes the visitor to the chat rung, with a
// plain note that voice is not live yet. To bring voice live, implement
// ShopVoiceProvider for the chosen provider and return it from
// getShopVoiceProvider() — no page changes needed.

export interface ShopVoiceProvider {
  /** Stable provider id, e.g. "none", "webrtc-provider-x". */
  readonly id: string;
  /** True when a visitor can start a voice conversation right now. */
  isAvailable(): boolean;
}

class UnavailableShopVoiceProvider implements ShopVoiceProvider {
  readonly id = "none";
  isAvailable(): boolean {
    return false;
  }
}

const unavailableProvider = new UnavailableShopVoiceProvider();

/** The voice provider the talk page should use today. */
export function getShopVoiceProvider(): ShopVoiceProvider {
  return unavailableProvider;
}
