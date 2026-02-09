import { Link, useLocation } from "react-router-dom";
import { Stethoscope, CarFront, CreditCard, Bookmark } from "lucide-react";

export default function MobileBottomBar() {
  const { pathname } = useLocation();
  const isInsightsPage = pathname === "/vehicle-insights";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-[60px] items-center justify-around border-t border-border bg-background/80 backdrop-blur-md md:hidden">
      {isInsightsPage ? (
        <>
          <Link
            to="/for-shops#apply"
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
