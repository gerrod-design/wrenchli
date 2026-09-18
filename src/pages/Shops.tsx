import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import ListingBadge from "@/components/shops/ListingBadge";
import GoogleRating from "@/components/shops/GoogleRating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight, Store } from "lucide-react";
import type { SpotlightShop } from "@/lib/spotlight";

/**
 * Detroit Shop Spotlight index.
 *
 * Reads ONLY the spotlight_shops table (hand-verified independent listings).
 * Every card carries the independent-listing badge unless the shop is an
 * active Wrenchli partner. Google ratings render only with attribution.
 * If the table is missing/empty, shows a graceful "being verified" state —
 * never a raw error, never invented listings.
 */
export default function Shops() {
  const [specialty, setSpecialty] = useState<string | null>(null);

  const {
    data: shops,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["spotlight-shops"],
    queryFn: async (): Promise<SpotlightShop[]> => {
      const { data, error } = await supabase
        .from("spotlight_shops")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const specialties = useMemo(() => {
    const set = new Set<string>();
    (shops ?? []).forEach((s) => s.specialties.forEach((sp) => set.add(sp)));
    return Array.from(set).sort();
  }, [shops]);

  const filtered = useMemo(() => {
    if (!specialty) return shops ?? [];
    return (shops ?? []).filter((s) => s.specialties.includes(specialty));
  }, [shops, specialty]);

  const showEmpty = !isLoading && (isError || (shops ?? []).length === 0);

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Detroit Auto Repair Shops — Independent Listings"
        description="Hand-verified independent auto repair shops in Detroit, Michigan. Browse specialties and ratings, and see which shops have certified technician profiles."
        path="/shops"
      />

      {/* Hero */}
      <section className="bg-wrenchli-trust-blue text-accent-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Store className="h-8 w-8 text-accent" />
            </div>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl">
              Detroit Auto Repair Shops
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-accent-foreground/80 leading-relaxed">
              Hand-verified independent repair shops across Detroit. These are
              independent listings — not Wrenchli partners yet. Shops can claim
              their page to add certified technician profiles.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : showEmpty ? (
            <div className="max-w-xl mx-auto text-center py-12">
              <Store className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h2 className="font-heading text-2xl font-bold mt-4">
                The Detroit shop directory is being verified
              </h2>
              <p className="mt-2 text-muted-foreground">
                We're hand-verifying independent repair shops across the city.
                Check back soon — every listing is confirmed open and accurate
                before it appears here.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-1 mt-6 text-wrenchli-trust-blue font-semibold hover:underline"
              >
                Back to the free assessment <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by specialty">
                  <Badge
                    variant={specialty === null ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => setSpecialty(null)}
                  >
                    All
                  </Badge>
                  {specialties.map((sp) => (
                    <Badge
                      key={sp}
                      variant={specialty === sp ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => setSpecialty(sp === specialty ? null : sp)}
                    >
                      {sp}
                    </Badge>
                  ))}
                </div>
              )}

              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No shops match that specialty yet.
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((shop, i) => (
                    <SectionReveal key={shop.id} delay={Math.min(i, 5) * 60}>
                      <Link
                        to={`/shops/${shop.slug}`}
                        className="block h-full group"
                        aria-label={`${shop.name} — view details`}
                      >
                        <Card className="h-full border border-border group-hover:shadow-md group-hover:border-wrenchli-trust-blue/40 transition-all">
                          <CardContent className="p-5">
                            <div className="mb-3">
                              <ListingBadge status={shop.listing_status} />
                            </div>
                            <h2 className="font-heading text-lg font-bold leading-snug group-hover:text-wrenchli-trust-blue transition-colors">
                              {shop.name}
                            </h2>
                            {(shop.zip || shop.city) && (
                              <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {shop.city}
                                {shop.zip ? ` ${shop.zip}` : ""}
                              </p>
                            )}
                            {shop.specialties.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {shop.specialties.slice(0, 3).map((sp) => (
                                  <Badge
                                    key={sp}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {sp}
                                  </Badge>
                                ))}
                                {shop.specialties.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{shop.specialties.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                            <div className="mt-3">
                              <GoogleRating
                                rating={shop.google_rating}
                                reviewCount={shop.google_review_count}
                                size="sm"
                              />
                            </div>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-wrenchli-trust-blue">
                              View details{" "}
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    </SectionReveal>
                  ))}
                </div>
              )}

              <p className="mt-10 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                Ratings shown are Google ratings with attribution — not
                Wrenchli ratings. Listings are hand-verified independent shops;
                none are Wrenchli partners yet.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
