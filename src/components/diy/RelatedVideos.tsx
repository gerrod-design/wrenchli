import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Youtube } from "lucide-react";

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

  const { data: videos, isLoading } = useQuery({
    queryKey: ["youtube-search", searchQuery],
    queryFn: () => fetchVideos(searchQuery),
    staleTime: 1000 * 60 * 30, // 30 min cache
    retry: 1,
  });

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

  if (!videos || videos.length === 0) return null;

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
