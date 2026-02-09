import { cn } from "@/lib/utils";
import { VEHICLE_COLORS, type VehicleColor } from "./VehicleSilhouette";

interface Props {
  selected: string; // hex
  onSelect: (color: VehicleColor) => void;
}

export default function VehicleColorPicker({ selected, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">What color is your car?</p>
      <div className="flex flex-wrap gap-2">
        {VEHICLE_COLORS.map((c) => {
          const isSelected = selected === c.hex;
          const isWhite = c.hex === "#f5f5f0";
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => onSelect(c)}
              title={c.name}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition-all duration-150 hover:scale-110 md:h-8 md:w-8",
                isSelected
                  ? "scale-110 border-wrenchli-teal ring-2 ring-white ring-offset-1 ring-offset-wrenchli-teal"
                  : isWhite
                  ? "border-border hover:border-foreground/40"
                  : "border-transparent hover:border-foreground/30"
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={`${c.name}${isSelected ? " (selected)" : ""}`}
            />
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {VEHICLE_COLORS.find((c) => c.hex === selected)?.name || "Silver"} selected
      </p>
    </div>
  );
}
