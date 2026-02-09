import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Stethoscope, CarFront, CreditCard, Bookmark } from "lucide-react";

export default function MobileBottomBar() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isInsightsPage = pathname === "/vehicle-insights";

  // Build quote link with current diagnosis context from URL params
  const buildQuoteLink = () => {
    const params = new URLSearchParams();
    const year = searchParams.get("year");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const code = searchParams.get("code");
    const symptom = searchParams.get("symptom");

    if (year) params.set("year", year);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (code) params.set("code", code);

    // Use code or symptom as diagnosis title fallback
    const diagnosisTitle = code || symptom || "Vehicle Diagnosis";
    params.set("diagnosis", diagnosisTitle);
    params.set("vehicle", [year, make, model].filter(Boolean).join(" "));

    return `/get-quote?${params.toString()}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-[60px] items-center justify-around border-t border-border bg-background/80 backdrop-blur-md md:hidden">
      {isInsightsPage ? (
        <>
          <Link
            to={buildQuoteLink()}
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg bg-accent text-accent-foreground font-semibold text-sm"
          >
            <CreditCard className="h-4 w-4" />
            Get a Quote
          </Link>
          <Link
            to="/garage"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg border border-border bg-card font-semibold text-sm text-foreground"
          >
            <Bookmark className="h-4 w-4" />
            Save to Garage
          </Link>
        </>
      ) : (
        <>
          <Link
            to="/#quote"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg bg-accent text-accent-foreground font-semibold text-sm"
          >
            <Stethoscope className="h-4 w-4" />
            Get a Diagnosis
          </Link>
          <Link
            to="/vehicle-insights"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg border border-border bg-card font-semibold text-sm text-foreground"
          >
            <CarFront className="h-4 w-4" />
            DIY Diagnosis
          </Link>
        </>
      )}
    </div>
  );
}
