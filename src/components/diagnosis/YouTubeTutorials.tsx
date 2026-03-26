import { ExternalLink, Play, Search, Loader2, Sparkles } from "lucide-react";
import type { YouTubeQuery } from "@/hooks/useSmartRepairIntel";

interface YouTubeTutorialsProps {
  diagnosisTitle: string;
  vehicle: string;
  smartQueries?: YouTubeQuery[] | null;
  loading?: boolean;
}

const angleEmoji: Record<string, string> = {
  model_specific: "🎯",
  technique: "🔧",
  troubleshooting: "🔍",
};

const angleLabel: Record<string, string> = {
  model_specific: "Your Vehicle",
  technique: "Step-by-Step",
  troubleshooting: "Troubleshooting",
};

function buildSearchVariations(title: string, vehicle: string) {
  const actionMap: Record<string, string> = {
    "worn brake pads": "replace brake pads",
    "check engine light": "diagnose check engine light",
    "engine overheating": "fix engine overheating",
    "vehicle vibration": "fix car vibration",
    "battery": "replace car battery",
    "oil": "change oil",
    "tire": "check tire pressure",
    "transmission": "fix transmission",
    "hvac": "fix car AC",
    "air conditioning": "fix car AC",
    "noise": "diagnose car noise",
  };

  const lowerTitle = title.toLowerCase();
  let actionVerb = title.toLowerCase();
  for (const [key, verb] of Object.entries(actionMap)) {
    if (lowerTitle.includes(key)) {
      actionVerb = verb;
      break;
    }
  }

  return [
    { label: `${title} ${vehicle} DIY tutorial`, query: `${title} ${vehicle} DIY tutorial` },
    { label: `How to ${actionVerb} ${vehicle}`, query: `how to ${actionVerb} ${vehicle}` },
    { label: `${vehicle} ${title} step by step`, query: `${vehicle} ${title} step by step` },
  ];
}

function buildYouTubeUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export default function YouTubeTutorials({ diagnosisTitle, vehicle, smartQueries, loading }: YouTubeTutorialsProps) {
  const useSmartQueries = smartQueries && smartQueries.length > 0;
  const fallbackVariations = buildSearchVariations(diagnosisTitle, vehicle);
  const generalQuery = `${diagnosisTitle} ${vehicle} DIY`;

  return (
    <div className="rounded-xl border bg-card p-4 md:p-5 space-y-4" style={{ borderColor: "hsl(0 0% 91%)" }}>
      <h4 className="font-heading text-base font-bold text-wrenchli-teal flex items-center gap-2">
        <Play className="h-4 w-4" />
        DIY Tutorials for {diagnosisTitle}
        {vehicle && <span className="font-normal text-muted-foreground text-sm">on {vehicle}</span>}
        {useSmartQueries && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-wrenchli-teal/10 px-2 py-0.5 text-[10px] font-medium text-wrenchli-teal">
            <Sparkles className="h-3 w-3" /> AI-Matched
          </span>
        )}
      </h4>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finding the best tutorials for your vehicle…
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {useSmartQueries
            ? smartQueries.map((v, i) => (
                <a
                  key={i}
                  href={buildYouTubeUrl(v.query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg bg-muted p-3 md:p-4 flex flex-col items-center text-center transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 text-lg">{angleEmoji[v.angle] || "▶️"}</div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-wrenchli-teal mb-1">
                    {angleLabel[v.angle] || "Tutorial"}
                  </p>
                  <p className="text-xs font-semibold leading-snug line-clamp-3">{v.label}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-wrenchli-teal">
                    Watch on YouTube <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              ))
            : fallbackVariations.map((v, i) => (
                <a
                  key={i}
                  href={buildYouTubeUrl(v.query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg bg-muted p-3 md:p-4 flex flex-col items-center text-center transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/10 transition-colors group-hover:bg-wrenchli-teal/20">
                    <Play className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-wrenchli-teal" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Search YouTube for:</p>
                  <p className="text-xs font-semibold mt-1 leading-snug">"{v.label}"</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-wrenchli-teal">
                    Watch on YouTube <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              ))}
        </div>
      )}

      <a
        href={buildYouTubeUrl(generalQuery)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 text-xs font-medium text-wrenchli-teal hover:underline"
      >
        <Search className="h-3.5 w-3.5" />
        Search YouTube for more videos →
      </a>

      <p className="text-[10px] text-muted-foreground leading-relaxed italic">
        Tutorial videos are sourced from YouTube creators and are not produced, reviewed, or endorsed by Wrenchli. Video quality, accuracy, and applicability to your specific vehicle may vary. Always verify repair procedures against your vehicle's service manual. Wrenchli is not responsible for any outcomes resulting from following third-party video instructions.
      </p>
    </div>
  );
}
