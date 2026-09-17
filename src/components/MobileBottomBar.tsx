import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Stethoscope, CarFront, Bookmark } from "lucide-react";

export default function MobileBottomBar() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isInsightsPage = pathname === "/vehicle-insights";
  const isFindShopsPage = pathname === "/find-shops";


  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-[60px] items-center justify-around border-t border-border bg-background/95 backdrop-blur-md md:hidden" style={{ WebkitTransform: "translate3d(0,0,0)" }}>
      {isInsightsPage ? (
        <>
          <Link
            to="/#quote"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg bg-accent text-accent-foreground font-semibold text-sm"
          >
            <Stethoscope className="h-4 w-4" />
            Free Assessment
          </Link>
          <Link
            to="/garage"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg border border-border bg-card font-semibold text-sm text-foreground"
          >
            <Bookmark className="h-4 w-4" />
            Save to Garage
          </Link>
        </>
      ) : isFindShopsPage ? (
        <>
          <Link
            to="/#quote"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg bg-accent text-accent-foreground font-semibold text-sm"
          >
            <Stethoscope className="h-4 w-4" />
            Free Assessment
          </Link>
          <Link
            to="/garage"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg border border-border bg-card font-semibold text-sm text-foreground"
          >
            <Bookmark className="h-4 w-4" />
            My Garage
          </Link>
        </>
      ) : (
        <>
          <Link
            to="/#quote"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-1 rounded-lg bg-accent text-accent-foreground font-semibold text-sm"
          >
            <Stethoscope className="h-4 w-4" />
            Assessment
          </Link>
          <Link
            to="/garage"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-1 rounded-lg border border-border bg-card font-semibold text-sm text-foreground"
          >
            <Bookmark className="h-4 w-4" />
            My Garage
          </Link>
          <Link
            to="/vehicle-insights"
            className="flex h-12 flex-1 items-center justify-center gap-2 mx-1 rounded-lg border border-border bg-card font-semibold text-sm text-foreground"
          >
            <CarFront className="h-4 w-4" />
            DIY
          </Link>
        </>
      )}
    </div>
  );
}
