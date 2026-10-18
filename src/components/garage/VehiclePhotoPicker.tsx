import { useId } from "react";
import { Camera, Upload, Trash2 } from "lucide-react";
import VehicleSilhouette, { DEFAULT_COLOR } from "@/components/vehicle/VehicleSilhouette";
import { cn } from "@/lib/utils";

export interface VehiclePhotoPickerProps {
  /** Resolved/preview image URL to show, or null for the silhouette empty state. */
  displayUrl: string | null;
  /** Whether an owner photo exists (stored) or a file is currently selected. */
  hasPhoto: boolean;
  /** Called with the chosen file from either input. */
  onSelectFile: (file: File) => void;
  /** When provided, renders a Remove button (omit in contexts where removal is meaningless). */
  onRemove?: () => void;
  /** Disables inputs/buttons while an upload is in flight. */
  busy?: boolean;
  /** Body type passed to the silhouette placeholder, e.g. "suv". */
  bodyType?: string;
  /** Visual tone: "dark" for the dark vehicle card / dialogs on dark bg, "light" for standard dialogs. Default "light". */
  tone?: "dark" | "light";
}

const TONE_CLASSES: Record<
  "dark" | "light",
  { placeholderBg: string; hint: string; button: string; remove: string }
> = {
  dark: {
    placeholderBg: "bg-white/5",
    hint: "text-white/50",
    button: "border-white/20 text-white hover:bg-white/10",
    remove: "border-white/20 text-white hover:bg-white/10",
  },
  light: {
    placeholderBg: "bg-muted",
    hint: "text-muted-foreground",
    button: "border-input text-foreground hover:bg-accent",
    remove: "border-input text-foreground hover:bg-accent",
  },
};

export default function VehiclePhotoPicker({
  displayUrl,
  hasPhoto,
  onSelectFile,
  onRemove,
  busy = false,
  bodyType,
  tone = "light",
}: VehiclePhotoPickerProps): JSX.Element {
  const reactId = useId();
  const cameraInputId = `${reactId}-camera`;
  const uploadInputId = `${reactId}-upload`;
  const classes = TONE_CLASSES[tone];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (file) {
      onSelectFile(file);
    }
  };

  const labelBaseClasses =
    "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer transition-colors";

  return (
    <div className="w-full">
      <div className="w-full h-44 rounded-xl overflow-hidden">
        {displayUrl ? (
          <img src={displayUrl} alt="Your vehicle" className="w-full h-44 object-cover" />
        ) : (
          <div
            className={cn(
              "w-full h-44 flex items-center justify-center",
              classes.placeholderBg,
            )}
          >
            <VehicleSilhouette
              bodyType={bodyType ?? "sedan"}
              color={DEFAULT_COLOR.hex}
              className="w-52 h-24 opacity-70"
            />
          </div>
        )}
      </div>

      <p className={cn("mt-2 text-xs", classes.hint)}>
        Front 3/4 view — whole car in frame works best.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          htmlFor={cameraInputId}
          className={cn(labelBaseClasses, classes.button, busy && "pointer-events-none opacity-50")}
        >
          <Camera className="h-4 w-4" />
          Take photo
          <input
            id={cameraInputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={busy}
            onChange={handleFileChange}
          />
        </label>

        <label
          htmlFor={uploadInputId}
          className={cn(labelBaseClasses, classes.button, busy && "pointer-events-none opacity-50")}
        >
          <Upload className="h-4 w-4" />
          Upload photo
          <input
            id={uploadInputId}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={handleFileChange}
          />
        </label>

        {hasPhoto && onRemove && (
          <button
            type="button"
            className={cn(labelBaseClasses, classes.remove)}
            disabled={busy}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}
