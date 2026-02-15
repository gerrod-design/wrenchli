import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => (
  <div className="rounded-lg border bg-card p-3">
    <div className="flex gap-3">
      <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-3 rounded-full" />
          ))}
          <Skeleton className="h-3 w-10 ml-1" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  </div>
);

export const VehicleCardSkeleton = () => (
  <div className="rounded-lg border bg-card">
    <div className="p-4 space-y-3">
      <Skeleton className="w-full h-32 rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  </div>
);

export const ServiceCardSkeleton = ({ layout = "vertical" }: { layout?: "vertical" | "horizontal" }) => {
  if (layout === "horizontal") {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-8 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 text-center space-y-3">
      <Skeleton className="w-16 h-10 rounded mx-auto" />
      <Skeleton className="h-4 w-24 mx-auto" />
      <Skeleton className="h-3 w-full" />
      <div className="flex items-center justify-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-3 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-4 w-16 mx-auto" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
};

export const DIYSectionSkeleton = () => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
    <div className="mt-4 pt-4 border-t border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    </div>
  </div>
);

export const VehicleSectionSkeleton = () => (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
    <div className="mt-4 pt-4 border-t border-green-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    </div>
  </div>
);

export const ServiceSectionSkeleton = ({ layout = "grid" }: { layout?: "grid" | "horizontal" }) => {
  if (layout === "horizontal") {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>
        {[...Array(3)].map((_, i) => (
          <ServiceCardSkeleton key={i} layout="horizontal" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-2xl p-6 border border-border animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};
