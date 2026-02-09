import { useGarage } from "@/hooks/useGarage";

/** Small orange badge showing the count of saved vehicles */
export default function GarageBadge() {
  const { vehicles } = useGarage();
  if (vehicles.length === 0) return null;

  return (
    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold leading-none px-1">
      {vehicles.length}
    </span>
  );
}
