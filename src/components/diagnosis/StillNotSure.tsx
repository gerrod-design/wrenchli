import { Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface StillNotSureProps {
  vehicle: string;
}

export default function StillNotSure({ vehicle }: StillNotSureProps) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8 text-center">
      <Wrench className="mx-auto h-8 w-8 text-accent mb-3" />
      <h3 className="font-heading text-lg font-bold">Still not sure what's wrong?</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
        That's completely okay — vehicle problems can be tricky to diagnose without seeing it in person. Get quotes from trusted local shops who can perform a full diagnostic inspection.
      </p>
      <Button
        size="lg"
        className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
        asChild
      >
        <Link to={`/get-quote?type=diagnostic&vehicle=${encodeURIComponent(vehicle)}`}>
          Get a Professional Diagnostic Quote <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
