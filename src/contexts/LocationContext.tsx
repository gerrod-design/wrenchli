import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface UserLocation {
  state: string | null; // USPS abbreviation of any U.S. state, when resolved
  city: string | null;
  zip: string | null;
  region: string; // resolved state's full name, or "your area" until resolved
  loading: boolean;
}

const defaultLocation: UserLocation = {
  state: null,
  city: null,
  zip: null,
  region: "your area",
  loading: true,
};

const LocationContext = createContext<UserLocation>(defaultLocation);

export function useLocation() {
  return useContext(LocationContext);
}

/** Full state name (as returned by reverse geocoders) → USPS abbreviation */
const STATE_ABBREV: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI",
  Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
  "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

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
        const stateName: string | null = data.address?.state || null;
        const abbrev: string | null = stateName
          ? STATE_ABBREV[stateName] || (/^[A-Z]{2}$/.test(stateName) ? stateName : null)
          : null;

        const result: UserLocation = {
          state: abbrev,
          city: data.address?.city || data.address?.town || data.address?.village || null,
          zip: data.address?.postcode || null,
          region: stateName || "your area",
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
