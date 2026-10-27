// Minimal browser-global stubs for server-side prerendering.
//
// A few components read Web Storage during render (e.g. ChatBot's
// useState initializer reads localStorage). In Node that identifier does
// not exist and would crash the render. These stubs give those reads an
// empty, inert store. `window`/`document` are deliberately NOT faked:
// feature detection elsewhere in the app (Supabase client storage,
// geolocation) keys off their absence and falls back correctly.

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  readonly length: number;
};

function makeStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
}

const g = globalThis as Record<string, unknown>;
if (typeof g.localStorage === "undefined") g.localStorage = makeStorage();
if (typeof g.sessionStorage === "undefined") g.sessionStorage = makeStorage();
