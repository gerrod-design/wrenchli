import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MoreHorizontal, Trash2, Edit2, Search, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CloudVehicle } from "@/hooks/useCloudVehicles";
import { useVehiclePhoto } from "@/hooks/useVehiclePhoto";
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
function HealthRing({ size = 48 }: { size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // No assessments: grey, 0%
  const color = "rgba(255,255,255,0.2)";
  const percent = 0;
  const offset = circumference - (percent / 100) * circumference;

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
            <span className="absolute text-[10px] text-white/40">—</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="bg-[#1a1a24] text-white/80 border-white/10 text-xs"
        >
          No assessments yet
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
    : vehicle.trim
      ? `${vehicle.year} · ${vehicle.trim}`
      : String(vehicle.year);

  const bodyType = detectBodyType(vehicle.make, vehicle.model);
  const stale = vehicle.current_mileage ? isMileageStale(vehicle.updated_at) : false;
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
          <HealthRing size={48} />
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

        {/* Vehicle silhouette — large, centered */}
        <div
          className={cn(
            "relative mx-auto w-full max-w-[320px] transition-transform duration-500 ease-out",
            hovered ? "-translate-y-1" : ""
          )}
        >
          <VehicleSilhouette
            bodyType={bodyType}
            color="#E07B39"
            className="w-full h-auto aspect-[380/120]"
          />
          {/* Road shadow */}
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%] h-3 rounded-[50%] opacity-40"
            style={{
              background: "radial-gradient(ellipse at center, rgba(224,123,57,0.25) 0%, transparent 70%)",
            }}
          />
        </div>

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
              title={stale ? "Mileage hasn't been updated in 90+ days" : undefined}
            >
              {vehicle.current_mileage
                ? `${vehicle.current_mileage.toLocaleString()} mi`
                : "— mi"
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
              No assessments
            </span>
          </div>
        </div>
      </div>

      {/* ── CTAs ─────────────────────────────────────────────── */}
      <div className="bg-[#0F1117] px-6 pb-5 pt-1 space-y-2.5 border-t border-white/[0.04]">
        <Button
          className="w-full h-11 text-sm font-bold bg-accent text-white hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/10 transition-all"
          onClick={() =>
            navigate(`/?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`)
          }
        >
          <Search className="mr-2 h-4 w-4" /> Start Assessment
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
