import { Link } from "react-router-dom";
import { Search, CarFront } from "lucide-react";

export default function MobileBottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-[60px] items-center justify-around border-t border-border bg-background/80 backdrop-blur-md md:hidden">
      <Link
        to="/#waitlist"
        className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg bg-accent text-accent-foreground font-semibold text-sm"
      >
        <Search className="h-4 w-4" />
        Get a Quote
      </Link>
      <Link
        to="/vehicle-insights"
        className="flex h-12 flex-1 items-center justify-center gap-2 mx-2 rounded-lg border border-border bg-card font-semibold text-sm text-foreground"
      >
        <CarFront className="h-4 w-4" />
        DIY Diagnosis
      </Link>
    </div>
  );
}
