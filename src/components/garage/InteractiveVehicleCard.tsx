import { useState } from "react";
import type { AssessmentSummary } from "@/lib/handoffLink";
import { Link, useNavigate } from "react-router-dom";
import { MoreHorizontal, Trash2, Edit2, Search, AlertTriangle, Clock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CloudVehicle } from "@/hooks/useCloudVehicles";
import { formatReadingDate, formatReadingLabel, type MileageReading } from "@/lib/mileage";
import { useResolvedVehiclePhoto } from "@/hooks/useVehicleOwnerPhoto";
import VehicleSilhouette, { DEFAULT_COLOR } from "@/components/vehicle/VehicleSilhouette";
import { cn } from "@/lib/utils";

// ─── Body type detection ────────────────────────────────────────
const TRUCK_MODELS = ["f-150","f-250","f-350","silverado","sierra","ram","tundra","tacoma","titan","frontier","colorado","canyon","ranger","gladiator","ridgeline","maverick"];
const SUV_MODELS = ["explorer","tahoe","suburban","expedition","4runner","highlander","pathfinder","pilot","rav4","cr-v","equinox","traverse","blazer","durango","wrangler","grand cherokee","cherokee","compass","rogue","murano","tucson","santa fe","sportage","sorento","telluride","palisade","bronco","forester","outback","ascent","cx-5","cx-9","cx-50","tiguan","atlas","escape","edge","trailblazer","model x","model y","q5","q7","x3","x5","glc","gle","gls","rdx","mdx","rx","nx","ux"];
const MINIVAN_MODELS = ["sienna","odyssey","pacifica","carnival","grand caravan"];
const COUPE_MODELS = ["mustang","camaro","corvette","challenger","86","brz","supra","370z","400z","rc","q60","a5","c-class coupe","4 series"];
const HATCHBACK_MODELS = ["civic hatchback","golf","gti","corolla hatchback","mazda3","veloster","impreza hatchback"];

function detectBodyType(make: string, model: string): string {
  const m = model.toLowerCase();
  const mk = make.toLowerCase();
  if (mk === "ram") return "truck";
  if (TRUCK_MODELS.some((t) => m.includes(t))) return "truck";
  if (MINIVAN_MODELS.some((t) => m.includes(t))) return "minivan";
  if (SUV_MODELS.some((t) => m.includes(t))) return "suv";
  if (COUPE_MODELS.some((t) => m.includes(t))) return "coupe";
  if (HATCHBACK_MODELS.some((t) => m.includes(t))) return "hatchback";
  return "sedan";
}

// ─── Health ring ────────────────────────────────────────────────
function HealthRing({
  size = 48,
  assessmentCount = 0,
  latestAssessmentDate = null,
}: {
  size?: number;
  assessmentCount?: number;
  latestAssessmentDate?: string | null;
}) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // R-70: the ring reflects this vehicle's linked assessments — a full
  // accent ring with the count when any exist; grey 0% when none. It is a
  // presence indicator, not an invented health score.
  const hasAssessments = assessmentCount > 0;
  const color = hasAssessments ? "#E07B39" : "rgba(255,255,255,0.2)";
  const percent = hasAssessments ? 100 : 0;
  const offset = circumference - (percent / 100) * circumference;
  const tooltipText = hasAssessments
    ? latestAssessmentDate
      ? `${assessmentCount} assessment${assessmentCount === 1 ? "" : "s"} · latest ${new Date(latestAssessmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : `${assessmentCount} assessment${assessmentCount === 1 ? "" : "s"}`
    : "No assessments yet";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative flex items-center justify-center cursor-default"
            style={{ width: size, height: size }}
          >
            <svg width={size} height={size} className="rotate-[-90deg]">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            {hasAssessments ? (
              <span className="absolute text-[11px] font-semibold text-white/90">{assessmentCount}</span>
            ) : (
              <span className="absolute text-[10px] text-white/40">—</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="bg-[#1a1a24] text-white/80 border-white/10 text-xs"
        >
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Mileage staleness ──────────────────────────────────────────
function isMileageStale(updatedAt: string): boolean {
  return Date.now() - new Date(updatedAt).getTime() > 90 * 24 * 60 * 60 * 1000;
}

// ─── Stat divider ───────────────────────────────────────────────
function StatDivider() {
  return <div className="w-px h-4 bg-white/10 shrink-0" />;
}

// ─── Component ──────────────────────────────────────────────────
interface Props {
  vehicle: CloudVehicle;
  /** Batch 5 (R-50, spec Q1): the derived latest ledger reading. The card
   * face shows the sourced reading and its date only — no estimate, and
   * "No reading on record yet" when the ledger is empty. */
  latestReading?: MileageReading | null;
  /** R-70: this vehicle's linked assessments (count + latest date), read
   *  by user_vehicle_id — null when none are linked. */
  assessmentSummary?: AssessmentSummary | null;
  unreadRecalls: number;
  onDelete: (id: string) => void;
  onEdit: (v: CloudVehicle) => void;
}

export default function InteractiveVehicleCard({ vehicle, latestReading, unreadRecalls, assessmentSummary, onDelete, onEdit }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const bodyType = detectBodyType(vehicle.make, vehicle.model);
  // Owner photo only: user_vehicles.photo_url holds a private-storage path
  // (resolved to a signed URL at render) or a direct URL. No stock imagery —
  // when the owner has not added a photo, the card shows a silhouette.
  const { url: displayPhotoUrl, loading: photoLoading } = useResolvedVehiclePhoto(vehicle.photo_url);

  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const subtitle = vehicle.nickname
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`
    : vehicle.trim
      ? `${vehicle.year} · ${vehicle.trim}`
      : String(vehicle.year);

  const stale = latestReading ? isMileageStale(latestReading.reading_date) : false;
  const age = new Date().getFullYear() - vehicle.year;

  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden transition-all duration-300 ease-out",
        hovered
          ? "shadow-[0_20px_60px_-12px_rgba(224,123,57,0.15)] -translate-y-1"
          : "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 400)}
    >
      {/* ── Hero section ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-8"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 55%, #1a1d27 0%, #0F1117 70%)",
        }}
      >
        {/* Health ring — top-right */}
        <div className="absolute top-4 right-4 z-10">
          <HealthRing size={48} assessmentCount={assessmentSummary?.count ?? 0} latestAssessmentDate={assessmentSummary?.latestDate ?? null} />
        </div>

        {/* Menu — top-right below health ring */}
        <div className="absolute top-4 right-16 z-10">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-white/10 bg-[#1a1d27] shadow-2xl py-1.5 backdrop-blur-xl">
              <button
                onClick={() => { onEdit(vehicle); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Vehicle
              </button>
              <button
                onClick={() => { onEdit(vehicle); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" /> Vehicle Photo
              </button>
              <button
                onClick={() => { onDelete(vehicle.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove Vehicle
              </button>
            </div>
          )}
        </div>

        {/* Recall badge — top-left overlay */}
        {unreadRecalls > 0 && (
          <div className="absolute top-4 left-6 z-10">
            <button
              onClick={() => {
                const el = document.getElementById("recall-alerts-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 shadow-lg shadow-accent/20 hover:bg-accent/90 transition-colors"
            >
              <AlertTriangle className="h-3 w-3 text-white" />
              <span className="text-[11px] font-bold text-white tracking-wide">
                {unreadRecalls} Open Recall{unreadRecalls !== 1 ? "s" : ""}
              </span>
            </button>
          </div>
        )}

        {/* Vehicle photo hero or fallback */}
        {displayPhotoUrl ? (
          <div
            className={cn(
              "relative w-full h-48 transition-transform duration-500 ease-out",
              hovered ? "-translate-y-1" : ""
            )}
          >
            <img
              src={displayPhotoUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Dark gradient overlay for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, transparent 30%, #0F1117 100%)",
              }}
            />
          </div>
        ) : (
          <div
            data-testid="vehicle-photo-fallback"
            className={cn(
              "relative w-full h-48 flex flex-col items-center justify-center gap-3 transition-transform duration-500 ease-out",
              hovered ? "-translate-y-1" : ""
            )}
          >
            {photoLoading ? (
              <div className="w-8 h-8 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
            ) : (
              <>
                <VehicleSilhouette
                  bodyType={bodyType}
                  color={DEFAULT_COLOR.hex}
                  className="w-56 h-24 opacity-60"
                />
                <button
                  type="button"
                  onClick={() => onEdit(vehicle)}
                  className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Add a photo of your car
                </button>
              </>
            )}
          </div>
        )}

        {/* Vehicle name — hero text */}
        <div className="mt-5 text-center">
          <h3 className="font-heading text-xl font-extrabold text-white tracking-tight leading-tight">
            {displayName}
          </h3>
          <p className="text-xs text-white/40 mt-1 tracking-wide uppercase font-medium">
            {subtitle}
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-medium",
                stale ? "text-accent animate-pulse" : "text-white/60"
              )}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              title={
                latestReading
                  ? `${formatReadingLabel(latestReading, "mi")}${stale ? " — no newer reading in 90+ days" : ""}`
                  : "No mileage reading on record yet"
              }
            >
              {latestReading
                ? `${Math.round(latestReading.odometer_miles).toLocaleString()} mi · ${formatReadingDate(latestReading.reading_date)}`
                : "No reading on record yet"
              }
            </span>
          </div>
          <StatDivider />
          <span
            className="text-xs text-white/60 font-medium"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {age} yr{age !== 1 ? "s" : ""} old
          </span>
          <StatDivider />
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-white/30" />
            <span
              className="text-xs text-white/60 font-medium"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {assessmentSummary && assessmentSummary.count > 0
                ? `${assessmentSummary.count} assessment${assessmentSummary.count === 1 ? "" : "s"}`
                : "No assessments"}
            </span>
          </div>
        </div>
      </div>

      {/* ── CTAs ─────────────────────────────────────────────── */}
      <div className="bg-[#0F1117] px-6 pb-5 pt-1 space-y-2.5 border-t border-white/[0.04]">
        <Button
          className="w-full h-11 text-sm font-bold bg-accent text-white hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/10 transition-all"
          onClick={() =>
            navigate(`/?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&vehicleId=${vehicle.id}`)
          }
        >
          <Search className="mr-2 h-4 w-4" /> Start Assessment
        </Button>
        <Button
          asChild
          variant="ghost"
          className="w-full h-10 text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <Link to={`/garage/vehicles/${vehicle.id}`}>
            Vehicle Record & Baseline
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="w-full h-10 text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <Link to={`/vehicle-insights?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`}>
            View History
          </Link>
        </Button>
      </div>
    </div>
  );
}
