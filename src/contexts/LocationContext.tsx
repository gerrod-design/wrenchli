import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface UserLocation {
  state: "MI" | "OH" | null;
  city: string | null;
  zip: string | null;
  region: string; // "Michigan", "Ohio", or "Michigan & Ohio"
  loading: boolean;
}

const defaultLocation: UserLocation = {
  state: null,
  city: null,
  zip: null,
  region: "Michigan & Ohio",
  loading: true,
};

const LocationContext = createContext<UserLocation>(defaultLocation);

export function useLocation() {
  return useContext(LocationContext);
}

/** Maps state abbreviation → friendly region name */
function stateToRegion(state: string | null): string {
  if (state === "MI") return "Michigan";
  if (state === "OH") return "Ohio";
  return "Michigan & Ohio";
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation>(defaultLocation);

  const detect = useCallback(async () => {
    // Check sessionStorage first
    const cached = sessionStorage.getItem("wrenchli_location");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLocation({ ...parsed, loading: false });
        return;
      } catch {
        // ignore
      }
    }

    // Try browser geolocation
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 600000, // 10 min cache
        })
      );

      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { headers: { "User-Agent": "Wrenchli/1.0" } }
      );

      if (res.ok) {
        const data = await res.json();
        const stateCode = data.address?.state;
        let abbrev: "MI" | "OH" | null = null;
        if (stateCode === "Michigan" || stateCode === "MI") abbrev = "MI";
        else if (stateCode === "Ohio" || stateCode === "OH") abbrev = "OH";

        const result: UserLocation = {
          state: abbrev,
          city: data.address?.city || data.address?.town || data.address?.village || null,
          zip: data.address?.postcode || null,
          region: stateToRegion(abbrev),
          loading: false,
        };

        sessionStorage.setItem("wrenchli_location", JSON.stringify(result));
        setLocation(result);
        return;
      }
    } catch {
      // Geolocation denied or Nominatim failed — fall back gracefully
    }

    setLocation((prev) => ({ ...prev, loading: false }));
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  return (
    <LocationContext.Provider value={location}>
      {children}
    </LocationContext.Provider>
  );
}
