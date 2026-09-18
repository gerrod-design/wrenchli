import { UserRound } from "lucide-react";
import TechnicianCard from "./TechnicianCard";
import type { SpotlightTechnician } from "@/lib/spotlight";

/**
 * Technician section for a shop detail page.
 * Honest empty state when the shop hasn't added technicians yet —
 * the environment exists, the people arrive via the claim flow.
 */
export default function TechnicianSection({
  technicians,
}: {
  technicians: SpotlightTechnician[];
}) {
  return (
    <section aria-label="Technicians" className="mt-10">
      <h2 className="font-heading text-xl font-bold md:text-2xl">
        Meet the technicians
      </h2>
      {technicians.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed p-6 text-center">
          <UserRound className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            This shop hasn't added its technicians yet. Shops add their
            certified techs — with ASE credentials and Michigan certification
            numbers — when they claim their page.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {technicians.map((t) => (
            <TechnicianCard key={t.id} tech={t} />
          ))}
        </div>
      )}
    </section>
  );
}
