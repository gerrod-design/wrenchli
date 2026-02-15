import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Shield } from "lucide-react";
import type { ServiceRecommendation } from "@/data/adRecommendations";

const ServiceAdCard = ({
  service,
  layout = "vertical",
  onTrack,
}: {
  service: ServiceRecommendation;
  layout?: "vertical" | "horizontal";
  onTrack?: () => void;
}) => {
  if (layout === "horizontal") {
    return (
      <Card className="hover:shadow-sm transition-shadow duration-200" role="article" aria-label={`Service: ${service.company} — ${service.service}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-muted rounded flex items-center justify-center shrink-0" aria-hidden="true">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{service.company}</h4>
                {service.badge && (
                  <Badge className="text-xs bg-primary text-primary-foreground px-1 py-0">{service.badge}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-accent" aria-label={`Price: ${service.price}`}>{service.price}</span>
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <a
                    href={service.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onTrack}
                    aria-label={`${service.cta} from ${service.company} (opens in new tab)`}
                  >
                    {service.cta}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200" role="article" aria-label={`Service: ${service.company} — ${service.service}`}>
      <CardContent className="p-4 text-center space-y-3">
        <div className="w-16 h-10 bg-muted rounded mx-auto flex items-center justify-center" aria-hidden="true">
          <Shield className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <h4 className="font-semibold text-sm">{service.company}</h4>
            {service.badge && (
              <Badge className="text-xs bg-primary text-primary-foreground px-1 py-0">{service.badge}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
          <div className="flex items-center justify-center gap-1 mb-2" role="img" aria-label={`Rated ${service.rating} out of 5 stars, ${service.reviewCount.toLocaleString()} reviews`}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                aria-hidden="true"
                className={`h-3 w-3 ${i < Math.floor(service.rating) ? "text-ad-star fill-current" : "text-muted-foreground/30"}`}
              />
            ))}
            <span className="text-xs text-muted-foreground">({service.reviewCount.toLocaleString()})</span>
          </div>
          <span className="text-sm font-bold text-accent block" aria-label={`Price: ${service.price}`}>{service.price}</span>
          <Button size="sm" className="w-full text-xs mt-2" asChild>
            <a
              href={service.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onTrack}
              aria-label={`${service.cta} from ${service.company} (opens in new tab)`}
            >
              {service.cta}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceAdCard;
