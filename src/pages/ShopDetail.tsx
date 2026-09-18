import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { ShopJsonLd } from "@/components/JsonLd";
import SectionReveal from "@/components/SectionReveal";
import ListingBadge from "@/components/shops/ListingBadge";
import GoogleRating from "@/components/shops/GoogleRating";
import ClaimShopForm from "@/components/shops/ClaimShopForm";
import TechnicianSection from "@/components/shops/TechnicianSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  ArrowLeft,
  Store,
} from "lucide-react";
import {
  formatHours,
  type SpotlightShop,
  type SpotlightTechnician,
} from "@/lib/spotlight";

/**
 * Spotlight shop detail page.
 *
 * Reads ONLY the spotlight_shops / spotlight_technicians tables.
 * Truth rules: badge always shown, Google rating only with attribution,
 * technician section shows the honest empty state when no techs exist.
 */
export default function ShopDetail() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: shop,
    isLoading: shopLoading,
    isError: shopError,
  } = useQuery({
    queryKey: ["spotlight-shop", slug],
    queryFn: async (): Promise<SpotlightShop | null> => {
      const { data, error } = await supabase
        .from("spotlight_shops")
        .select("*")
        .eq("slug", slug ?? "")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: technicians } = useQuery({
    queryKey: ["spotlight-technicians", shop?.id],
    queryFn: async (): Promise<SpotlightTechnician[]> => {
      if (!shop) return [];
      const { data, error } = await supabase
        .from("spotlight_technicians")
        .select("*")
        .eq("shop_id", shop.id)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!shop,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  if (shopLoading) {
    return (
      <main className="pb-[60px] md:pb-0">
        <div className="container-wrenchli section-padding max-w-3xl">
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <Skeleton className="h-5 w-1/3 rounded-lg mt-4" />
          <Skeleton className="h-64 rounded-xl mt-8" />
        </div>
      </main>
    );
  }

  if (shopError || !shop) {
    return (
      <main className="pb-[60px] md:pb-0">
        <SEO
          title="Shop not found"
          description="The requested Detroit shop listing could not be found."
          path={`/shops/${slug ?? ""}`}
        />
        <div className="container-wrenchli section-padding max-w-xl text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h1 className="font-heading text-2xl font-bold mt-4">
            We couldn't find that shop listing
          </h1>
          <p className="mt-2 text-muted-foreground">
            The listing may have been removed, or the directory is still being
            verified.
          </p>
          <Link
            to="/shops"
            className="inline-flex items-center gap-1 mt-6 text-wrenchli-trust-blue font-semibold hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Detroit shops
          </Link>
        </div>
      </main>
    );
  }

  const hours = formatHours(shop.hours_json);
  const address = [shop.address_line1, `${shop.city}, ${shop.state}${shop.zip ? ` ${shop.zip}` : ""}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title={`${shop.name} — Detroit Auto Repair`}
        description={
          shop.description ??
          `${shop.name} is an independent auto repair shop in Detroit, Michigan. View specialties, hours, ratings, and technician profiles.`
        }
        path={`/shops/${shop.slug}`}
      />
      <ShopJsonLd shop={shop} technicians={technicians ?? []} />

      <div className="container-wrenchli section-padding max-w-3xl">
        <SectionReveal>
          <Link
            to="/shops"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Detroit shops
          </Link>

          <div className="mb-3">
            <ListingBadge status={shop.listing_status} />
          </div>
          <h1 className="font-heading text-3xl font-extrabold md:text-4xl">
            {shop.name}
          </h1>
          <div className="mt-3">
            <GoogleRating
              rating={shop.google_rating}
              reviewCount={shop.google_review_count}
            />
          </div>

          {shop.description && (
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {shop.description}
            </p>
          )}
        </SectionReveal>

        <SectionReveal delay={80}>
          <Card className="mt-8">
            <CardContent className="p-5 md:p-6 space-y-4">
              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-wrenchli-trust-blue mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{address}</p>
                </div>
              )}
              {shop.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-wrenchli-trust-blue flex-shrink-0" />
                  <a
                    href={`tel:${shop.phone.replace(/[^+\d]/g, "")}`}
                    className="text-sm font-semibold text-wrenchli-trust-blue hover:underline"
                  >
                    {shop.phone}
                  </a>
                </div>
              )}
              {shop.website_url && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-wrenchli-trust-blue flex-shrink-0" />
                  <a
                    href={shop.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-wrenchli-trust-blue hover:underline break-all"
                  >
                    {shop.website_url.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {shop.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {shop.specialties.map((sp) => (
                    <Badge key={sp} variant="secondary">
                      {sp}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SectionReveal>

        {hours.length > 0 && (
          <SectionReveal delay={120}>
            <section aria-label="Hours" className="mt-8">
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-wrenchli-trust-blue" /> Hours
              </h2>
              <dl className="mt-3 divide-y divide-border rounded-xl border">
                {hours.map((h) => (
                  <div
                    key={h.label}
                    className="flex justify-between px-4 py-2.5 text-sm"
                  >
                    <dt className="text-muted-foreground">{h.label}</dt>
                    <dd className="font-medium">{h.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </SectionReveal>
        )}

        <SectionReveal delay={160}>
          <TechnicianSection technicians={technicians ?? []} />
        </SectionReveal>

        <SectionReveal delay={200}>
          <div className="mt-10">
            <ClaimShopForm shopName={shop.name} shopSlug={shop.slug} />
          </div>
        </SectionReveal>

        {shop.verified_at && (
          <p className="mt-8 text-xs text-muted-foreground text-center">
            {"Listing hand-verified on "}
            {(() => {
              // verified_at is a date-only value; parse it as a local date so
              // UTC-midnight timestamps don't render as the previous day.
              const [y, m, d] = shop.verified_at.slice(0, 10).split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            })()}
            {". Ratings shown are Google ratings, not Wrenchli ratings."}
          </p>
        )}
      </div>
    </main>
  );
}
