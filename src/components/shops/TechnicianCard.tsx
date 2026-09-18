import { BadgeCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  techInitials,
  type SpotlightTechnician,
} from "@/lib/spotlight";

/**
 * A real technician profile, rendered only from shop-supplied data.
 * The Wrenchli-tracked rating block appears ONLY when real outcome data
 * exists (wrenchli_job_count != null). Otherwise it is omitted entirely —
 * never shown as zero, never invented.
 */
export default function TechnicianCard({
  tech,
}: {
  tech: SpotlightTechnician;
}) {
  const hasOutcomeData =
    tech.wrenchli_job_count != null && tech.wrenchli_rating_avg != null;

  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {tech.photo_url ? (
            <img
              src={tech.photo_url}
              alt={`${tech.full_name}`}
              className="h-14 w-14 rounded-full object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div
              className="h-14 w-14 rounded-full bg-wrenchli-trust-blue/10 flex items-center justify-center font-heading font-bold text-wrenchli-trust-blue flex-shrink-0"
              aria-hidden
            >
              {techInitials(tech.full_name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-heading font-semibold leading-tight">
              {tech.full_name}
            </p>
            {tech.years_experience != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {tech.years_experience} yrs experience
              </p>
            )}
          </div>
        </div>

        {hasOutcomeData && (
          <div className="mt-4 rounded-lg bg-wrenchli-green/10 border border-wrenchli-green/20 px-3 py-2 flex items-center gap-2">
            <Star className="h-4 w-4 fill-accent text-accent flex-shrink-0" />
            <p className="text-sm">
              <span className="font-bold">
                {tech.wrenchli_rating_avg!.toFixed(1)}
              </span>{" "}
              <span className="text-muted-foreground">
                across {tech.wrenchli_job_count} Wrenchli-tracked jobs
              </span>
            </p>
          </div>
        )}

        {tech.ase_certifications.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Certifications
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tech.ase_certifications.map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  <BadgeCheck className="h-3 w-3 mr-1 text-wrenchli-trust-blue" />
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {tech.mi_cert_number && (
          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <BadgeCheck
              className={`h-3.5 w-3.5 ${
                tech.mi_cert_verified
                  ? "text-wrenchli-green"
                  : "text-muted-foreground"
              }`}
            />
            MI cert #{tech.mi_cert_number}
            {tech.mi_cert_verified ? " · verified" : " · shop-reported"}
          </p>
        )}

        {tech.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tech.specialties.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        )}

        {tech.bio && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {tech.bio}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
