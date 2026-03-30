import { Play } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Check if a URL is a YouTube link */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

interface YouTubePreviewCardProps {
  href: string;
  title?: string;
}

export default function YouTubePreviewCard({ href, title }: YouTubePreviewCardProps) {
  const videoId = extractYouTubeId(href);
  if (!videoId) return null;

  const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  const displayTitle = title || "Watch on YouTube";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent({
          event_type: "ad_click",
          category: "diy_product",
          action: "chat_youtube_click",
          item_id: videoId,
          item_title: displayTitle,
          item_url: href,
          metadata: { placement: "chat_inline" },
        });
      }}
      className="group flex gap-2.5 items-start rounded-lg border border-border bg-background/60 p-2 my-1.5 hover:bg-accent/40 transition-colors no-underline"
    >
      <div className="relative flex-shrink-0 w-28 h-[72px] rounded-md overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={displayTitle}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <Play className="h-4 w-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-xs font-medium text-foreground leading-snug line-clamp-2 !my-0">
          {displayTitle}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 !my-0">youtube.com</p>
      </div>
    </a>
  );
}
