import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Youtube } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface Video {
  video_id: string;
  title: string;
  description: string;
  thumbnail: string;
  channel: string;
  published_at: string;
  url: string;
}

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-search`;

async function fetchVideos(query: string): Promise<Video[]> {
  const resp = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ query, max_results: 4 }),
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.videos ?? [];
}

function decodeHtml(html: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function RelatedVideos({
  tutorialTitle,
  vehicleTypes,
}: {
  tutorialTitle: string;
  vehicleTypes?: string[] | null;
}) {
  const searchQuery = vehicleTypes?.length
    ? `${tutorialTitle} ${vehicleTypes[0]} DIY tutorial`
    : `${tutorialTitle} car DIY tutorial`;

  const { data: videos, isLoading, isError } = useQuery({
    queryKey: ["youtube-search", searchQuery],
    queryFn: () => fetchVideos(searchQuery),
    staleTime: 1000 * 60 * 30, // 30 min cache
    retry: 1,
  });

  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  if (isLoading) {
    return (
      <div>
        <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
          <Youtube className="h-5 w-5 text-destructive" /> Related Videos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !videos || videos.length === 0) {
    return (
      <div>
        <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
          <Youtube className="h-5 w-5 text-destructive" /> Related Videos
        </h2>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors group"
          onClick={() => {
            trackEvent({
              event_type: "ad_click",
              category: "diy_product",
              action: "youtube_fallback_click",
              label: tutorialTitle,
              item_url: fallbackUrl,
              metadata: { search_query: searchQuery },
            });
          }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <ExternalLink className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-medium text-sm group-hover:text-primary transition-colors">
              Search YouTube for "{tutorialTitle}"
            </p>
            <p className="text-xs text-muted-foreground">
              Find step-by-step video tutorials on YouTube
            </p>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
        <Youtube className="h-5 w-5 text-destructive" /> Related Videos
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {videos.map((v) => (
          <a
            key={v.video_id}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
            onClick={() => {
              trackEvent({
                event_type: "ad_click",
                category: "diy_product",
                action: "youtube_tutorial_click",
                label: tutorialTitle,
                item_id: v.video_id,
                item_title: decodeHtml(v.title),
                item_brand: v.channel,
                item_url: v.url,
                metadata: { search_query: searchQuery },
              });
            }}
          >
            <Card className="overflow-hidden border hover:shadow-md transition-shadow h-full">
              <div className="relative aspect-video bg-muted">
                <img
                  src={v.thumbnail}
                  alt={decodeHtml(v.title)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {decodeHtml(v.title)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{v.channel}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
