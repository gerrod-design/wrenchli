// SSR-only stand-in for leaflet, aliased in by vite.config.ts for the
// prerender build only (the client build always gets the real package).
//
// The real leaflet module reads `window` at import time and crashes in
// Node. ShopMap (the only consumer) calls leaflet exclusively inside
// effects and event handlers, which never run during server rendering,
// so an inert chainable stub is enough to let the module graph load.

/* eslint-disable @typescript-eslint/no-explicit-any */
const chain: any = {
  addTo: () => chain,
  setView: () => chain,
  on: () => chain,
  bindPopup: () => chain,
  openPopup: () => chain,
  setLatLng: () => chain,
  remove: () => undefined,
  invalidateSize: () => undefined,
};

const L = {
  map: () => chain,
  tileLayer: () => chain,
  layerGroup: () => chain,
  divIcon: () => ({}),
  marker: () => chain,
  icon: () => ({}),
};

export default L;
