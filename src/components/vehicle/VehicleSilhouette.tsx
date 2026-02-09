import { cn } from "@/lib/utils";

// ─── Color palette ──────────────────────────────────────────────
export interface VehicleColor {
  name: string;
  hex: string;
}

export const VEHICLE_COLORS: VehicleColor[] = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f5f5f0" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Gray", hex: "#6b6b6b" },
  { name: "Charcoal", hex: "#3d3d3d" },
  { name: "Red", hex: "#b91c1c" },
  { name: "Blue", hex: "#1e40af" },
  { name: "Navy", hex: "#1a2744" },
  { name: "Brown", hex: "#6b4226" },
  { name: "Gold/Beige", hex: "#c9a96e" },
  { name: "Green", hex: "#2d5a27" },
  { name: "Orange", hex: "#d95b00" },
];

export const DEFAULT_COLOR = VEHICLE_COLORS[2]; // Silver

// ─── Body type mapping ──────────────────────────────────────────
export type BodyType = "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "convertible" | "wagon" | "van" | "minivan";

const BODY_MAP: Record<string, BodyType> = {
  "sedan": "sedan",
  "saloon": "sedan",
  "sport utility": "suv",
  "suv": "suv",
  "crossover": "suv",
  "cuv": "suv",
  "pickup": "truck",
  "truck": "truck",
  "coupe": "coupe",
  "hatchback": "hatchback",
  "convertible": "convertible",
  "wagon": "wagon",
  "van": "van",
  "cargo van": "van",
  "minivan": "minivan",
  "mini van": "minivan",
};

export function mapBodyClass(bodyClass: string): BodyType {
  const lower = bodyClass.toLowerCase();
  for (const [key, type] of Object.entries(BODY_MAP)) {
    if (lower.includes(key)) return type;
  }
  return "sedan"; // default fallback
}

// ─── SVG path data per body type ────────────────────────────────
const SILHOUETTES: Record<BodyType, { body: string; windows: string; wheelX: [number, number] }> = {
  sedan: {
    body: "M40,95 Q30,95 28,90 L25,85 Q20,80 20,75 L20,65 Q20,55 30,50 L60,38 Q70,34 90,32 L150,28 Q175,26 200,28 L260,32 Q290,34 310,38 L340,50 Q350,55 350,65 L350,75 Q350,80 345,85 L342,90 Q340,95 330,95 Z",
    windows: "M70,48 Q80,40 100,36 L155,30 Q170,29 185,30 L195,31 Q200,31 200,36 L200,48 Z M210,48 L210,34 Q220,32 260,36 L300,44 Q310,48 310,52 L310,48 Z",
    wheelX: [95, 280],
  },
  suv: {
    body: "M35,100 Q25,100 23,95 L20,90 Q15,85 15,78 L15,55 Q15,48 25,42 L55,30 Q65,26 85,24 L155,20 Q180,18 210,20 L280,24 Q310,26 330,30 L355,42 Q365,48 365,55 L365,78 Q365,85 360,90 L357,95 Q355,100 345,100 Z",
    windows: "M65,42 Q75,34 95,28 L160,22 Q175,21 190,22 L200,23 Q205,23 205,30 L205,42 Z M215,42 L215,26 Q230,24 275,28 L320,36 Q330,40 330,44 L330,42 Z",
    wheelX: [90, 300],
  },
  truck: {
    body: "M35,100 Q25,100 23,95 L20,90 Q15,85 15,78 L15,55 Q15,48 25,42 L50,30 Q60,26 80,24 L140,20 Q155,18 170,22 L175,28 Q178,35 178,42 L178,55 L355,55 Q365,55 368,60 L370,70 Q372,78 370,85 L368,90 Q365,95 360,100 L345,100 Z",
    windows: "M60,42 Q70,34 90,28 L145,22 Q155,20 165,24 L168,30 Q170,36 168,42 Z",
    wheelX: [90, 305],
  },
  coupe: {
    body: "M40,92 Q30,92 28,87 L25,82 Q20,77 20,72 L20,62 Q20,55 30,50 L80,35 Q95,28 120,26 L170,24 Q195,22 220,24 L280,28 Q310,32 330,40 L350,52 Q358,58 358,65 L358,72 Q358,77 353,82 L350,87 Q348,92 338,92 Z",
    windows: "M90,45 Q100,36 125,30 L175,26 Q190,25 200,26 L205,27 Q208,28 208,33 L208,45 Z M218,45 L218,30 Q235,28 275,34 L320,44 Q328,48 328,50 Z",
    wheelX: [95, 290],
  },
  hatchback: {
    body: "M40,95 Q30,95 28,90 L25,85 Q20,80 20,75 L20,65 Q20,55 30,50 L60,38 Q70,34 90,32 L150,28 Q175,26 200,28 L250,32 Q270,34 290,40 L320,52 Q330,58 330,65 L330,75 Q330,80 325,85 L322,90 Q320,95 310,95 Z",
    windows: "M70,48 Q80,40 100,36 L155,30 Q170,29 185,30 L195,31 Q200,31 200,36 L200,48 Z M210,48 L210,34 Q225,32 260,38 L290,46 Q298,50 298,52 Z",
    wheelX: [90, 265],
  },
  convertible: {
    body: "M40,90 Q30,90 28,85 L25,80 Q20,75 20,70 L20,62 Q20,56 28,52 L60,42 Q70,38 90,36 L130,34 Q145,34 160,34 L200,34 Q220,34 250,36 L290,40 Q320,44 340,52 Q348,56 348,62 L348,70 Q348,75 343,80 L340,85 Q338,90 328,90 Z",
    windows: "M75,48 Q85,42 105,38 L135,36 Q145,36 155,36 L160,36 Q162,36 162,38 L162,48 Z",
    wheelX: [92, 280],
  },
  wagon: {
    body: "M40,95 Q30,95 28,90 L25,85 Q20,80 20,75 L20,65 Q20,55 30,50 L60,38 Q70,34 90,32 L150,28 Q175,26 200,28 L260,30 Q290,30 320,30 L340,30 Q348,30 350,38 L352,50 Q354,58 354,65 L354,75 Q354,80 349,85 L346,90 Q344,95 334,95 Z",
    windows: "M70,48 Q80,40 100,36 L155,30 Q170,29 185,30 L195,31 Q200,31 200,36 L200,48 Z M210,48 L210,34 Q225,32 260,32 L310,32 Q320,32 322,36 L325,42 Q328,48 328,50 Z",
    wheelX: [95, 290],
  },
  van: {
    body: "M30,105 Q20,105 18,100 L15,95 Q10,88 10,80 L10,45 Q10,35 20,28 L45,18 Q55,14 75,12 L160,8 Q180,6 200,8 L320,12 Q345,14 360,20 L370,28 Q378,35 378,45 L378,80 Q378,88 373,95 L370,100 Q368,105 358,105 Z",
    windows: "M55,30 Q65,22 85,16 L165,10 Q180,9 195,10 L205,11 Q210,11 210,18 L210,38 Z M220,38 L220,14 Q240,12 310,16 L350,24 Q358,28 358,34 Z",
    wheelX: [85, 310],
  },
  minivan: {
    body: "M30,100 Q20,100 18,95 L15,90 Q10,84 10,76 L10,50 Q10,40 20,34 L50,22 Q60,18 80,16 L160,12 Q180,10 200,12 L310,16 Q340,18 355,24 L365,32 Q370,38 370,50 L370,76 Q370,84 365,90 L362,95 Q360,100 350,100 Z",
    windows: "M60,34 Q70,26 90,20 L165,14 Q180,13 195,14 L205,15 Q210,15 210,22 L210,38 Z M220,38 L220,18 Q240,16 305,20 L345,28 Q352,32 352,36 Z",
    wheelX: [85, 300],
  },
};

// ─── Component ──────────────────────────────────────────────────
interface VehicleSilhouetteProps {
  bodyType?: BodyType | string;
  color?: string; // hex color
  className?: string;
  /** Show scanning animation overlay */
  scanning?: boolean;
}

export default function VehicleSilhouette({
  bodyType = "sedan",
  color = DEFAULT_COLOR.hex,
  className,
  scanning = false,
}: VehicleSilhouetteProps) {
  const type = (Object.keys(SILHOUETTES).includes(bodyType) ? bodyType : "sedan") as BodyType;
  const { body, windows, wheelX } = SILHOUETTES[type];

  // Lighter version of the color for highlight
  const highlightColor = `${color}40`;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 380 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Shadow */}
        <ellipse cx="190" cy="110" rx="140" ry="6" fill="rgba(0,0,0,0.08)" />

        {/* Car body */}
        <path
          d={body}
          fill={color}
          className="transition-[fill] duration-200 ease-out"
          style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.2))` }}
        />

        {/* Highlight gradient on top */}
        <path
          d={body}
          fill={`url(#bodyHighlight-${type})`}
          className="transition-[fill] duration-200 ease-out"
        />

        {/* Windows */}
        <path d={windows} fill="rgba(30, 58, 95, 0.82)" />

        {/* Window reflection */}
        <path d={windows} fill="url(#windowReflection)" opacity="0.3" />

        {/* Wheels */}
        {wheelX.map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy={type === "van" || type === "minivan" ? 105 : 95} r={type === "van" || type === "minivan" ? 18 : 16} fill="#2a2a2a" />
            <circle cx={cx} cy={type === "van" || type === "minivan" ? 105 : 95} r={type === "van" || type === "minivan" ? 8 : 7} fill="#555" />
            <circle cx={cx} cy={type === "van" || type === "minivan" ? 105 : 95} r={3} fill="#777" />
          </g>
        ))}

        {/* Scanning line */}
        {scanning && (
          <rect className="animate-vehicle-scan" x="0" y="0" width="5" height="120" fill="url(#scanGradient)" />
        )}

        <defs>
          <linearGradient id={`bodyHighlight-${type}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="50%" stopColor="white" stopOpacity="0.02" />
            <stop offset="100%" stopColor="black" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="windowReflection" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor="hsl(170, 73%, 36%)" stopOpacity="0.5" />
            <stop offset="60%" stopColor="hsl(170, 73%, 36%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
