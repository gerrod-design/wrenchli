import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MoreHorizontal, Trash2, Edit2, Search, AlertTriangle, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CloudVehicle } from "@/hooks/useCloudVehicles";
import VehicleSilhouette from "@/components/vehicle/VehicleSilhouette";
import { cn } from "@/lib/utils";

// ─── Body type detection from make/model ────────────────────────
const TRUCK_MODELS = ["f-150", "f-250", "f-350", "silverado", "sierra", "ram", "tundra", "tacoma", "titan", "frontier", "colorado", "canyon", "ranger", "gladiator", "ridgeline", "maverick"];
const SUV_MODELS = ["explorer", "tahoe", "suburban", "expedition", "4runner", "highlander", "pathfinder", "pilot", "rav4", "cr-v", "equinox", "traverse", "blazer", "durango", "wrangler", "grand cherokee", "cherokee", "compass", "rogue", "murano", "tucson", "santa fe", "sportage", "sorento", "telluride", "palisade", "bronco", "forester", "outback", "ascent", "cx-5", "cx-9", "cx-50", "tiguan", "atlas", "escape", "edge", "trailblazer", "model x", "model y", "q5", "q7", "x3", "x5", "glc", "gle", "gls", "rdx", "mdx", "rx", "nx", "ux"];
const MINIVAN_MODELS = ["sienna", "odyssey", "pacifica", "carnival", "grand caravan"];
const COUPE_MODELS = ["mustang", "camaro", "corvette", "challenger", "86", "brz", "supra", "370z", "400z", "rc", "q60", "a5", "c-class coupe", "4 series"];
const HATCHBACK_MODELS = ["civic hatchback", "golf", "gti", "corolla hatchback", "mazda3", "veloster", "impreza hatchback"];

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

// ─── Health ring colors by urgency ──────────────────────────────
type UrgencyLevel = "monitor" | "schedule" | "soon" | "immediate";

const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  monitor: "#22c55e",
  schedule: "#eab308",
  soon: "#E07B39",
  immediate: "#ef4444",
};

function HealthRing({
  percent,
  color,
  size = 80,
  label,
}: {
  percent: number;
  color: string;
  size?: number;
  label: string;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
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
      <span
        className="absolute text-[9px] font-semibold text-center leading-tight px-1"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Mileage staleness check ────────────────────────────────────
function isMileageStale(updatedAt: string): boolean {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return diff > 90 * 24 * 60 * 60 * 1000; // 90 days
}

// ─── Component ──────────────────────────────────────────────────
interface Props {
  vehicle: CloudVehicle;
  unreadRecalls: number;
  onDelete: (id: string) => void;
  onEdit: (v: CloudVehicle) => void;
}

export default function InteractiveVehicleCard({ vehicle, unreadRecalls, onDelete, onEdit }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const subtitle = vehicle.nickname
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`
    : vehicle.trim || "";

  const bodyType = detectBodyType(vehicle.make, vehicle.model);
  const stale = vehicle.current_mileage ? isMileageStale(vehicle.updated_at) : false;
  const age = new Date().getFullYear() - vehicle.year;

  // Mock urgency — in a real app you'd derive this from the last assessment
  // For now: no assessments = grey
  const hasAssessments = false; // Placeholder — wire to real data when available
  const healthPercent = hasAssessments ? 75 : 0;
  const healthColor = hasAssessments ? URGENCY_COLORS.monitor : "hsl(var(--muted-foreground))";
  const healthLabel = hasAssessments ? "Good" : "No\nassessments";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border overflow-hidden transition-all duration-200",
        hovered && "border-accent/40 shadow-lg shadow-accent/5"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 300)}
    >
      {/* Dark header with vehicle silhouette */}
      <div className="relative bg-[#0F1117] px-4 pt-4 pb-3 flex items-center gap-4">
        {/* Silhouette with hover micro-interaction */}
        <div
          className={cn(
            "relative transition-transform duration-300 ease-out shrink-0",
            hovered ? "translate-x-1 -translate-y-0.5" : ""
          )}
        >
          <VehicleSilhouette
            bodyType={bodyType}
            color="#E07B39"
            className="w-28 h-14"
          />
          {/* Recall badge overlay */}
          {unreadRecalls > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const el = document.getElementById("recall-alerts-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 animate-pulse"
              title={`${unreadRecalls} open recall${unreadRecalls !== 1 ? "s" : ""}`}
            >
              <AlertTriangle className="h-2.5 w-2.5 text-white" />
              <span className="text-[9px] font-bold text-white">{unreadRecalls}</span>
            </button>
          )}
        </div>

        {/* Health ring */}
        <HealthRing
          percent={healthPercent}
          color={healthColor}
          label={healthLabel}
          size={72}
        />

        {/* Menu button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-white/50 hover:text-white rounded transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-card shadow-lg py-1">
              <button
                onClick={() => { onEdit(vehicle); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-card-foreground hover:bg-muted transition-colors"
              >
                <Edit2 className="h-3 w-3" /> Edit Vehicle
              </button>
              <button
                onClick={() => { onDelete(vehicle.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Delete Vehicle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Light bottom section */}
      <div className="bg-white px-4 py-3 space-y-2.5">
        {/* Vehicle name */}
        <div>
          <h3 className="font-heading text-sm font-bold truncate">{displayName}</h3>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>

        {/* Mileage & age row */}
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "text-xs text-muted-foreground flex items-center gap-1",
              stale && "animate-pulse text-accent"
            )}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            title={stale ? "Mileage hasn't been updated in 90+ days — tap Edit to refresh" : undefined}
          >
            <Gauge className="h-3 w-3" />
            {vehicle.current_mileage
              ? `${vehicle.current_mileage.toLocaleString()} mi`
              : "— mi"
            }
          </span>
          <span
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {vehicle.year} · {age} yr{age !== 1 ? "s" : ""} old
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() =>
              navigate(`/?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`)
            }
          >
            <Search className="mr-1 h-3 w-3" /> Run Assessment
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 text-xs"
          >
            <Link to={`/vehicle-insights?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`}>
              View Assessments
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
