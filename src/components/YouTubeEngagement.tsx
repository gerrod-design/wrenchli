import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Loader2, Youtube, Eye, MousePointerClick, TrendingUp, Play } from "lucide-react";

interface VideoRow {
  video_id: string;
  title: string;
  channel: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface DailyPoint {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface EngagementData {
  totalImpressions: number;
  totalClicks: number;
  overallCTR: number;
  chatClicks: number;
  diyImpressions: number;
  diyClicks: number;
  dailyTrend: DailyPoint[];
  topVideos: VideoRow[];
}

export default function YouTubeEngagement() {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
      const tokenData = tokenKey ? JSON.parse(localStorage.getItem(tokenKey) || "{}") : null;
      const accessToken = tokenData?.access_token;
      if (!accessToken) { setError("No session"); setLoading(false); return; }

      const base = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const headers = { apikey: key, Authorization: `Bearer ${accessToken}` };

      // Fetch youtube-related analytics events
      const res = await fetch(
        `${base}/rest/v1/analytics_events?select=action,item_id,item_title,item_brand,timestamp,metadata&action=in.(youtube_video_impression,youtube_tutorial_click,chat_youtube_click)&order=timestamp.desc&limit=1000`,
        { headers },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const events: any[] = await res.json();

      const impressions = events.filter(e => e.action === "youtube_video_impression");
      const diyClicks = events.filter(e => e.action === "youtube_tutorial_click");
      const chatClicks = events.filter(e => e.action === "chat_youtube_click");
      const allClicks = [...diyClicks, ...chatClicks];

      const totalImpressions = impressions.length;
      const totalClicks = allClicks.length;
      const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Daily trend (last 30 days)
      const dailyMap: Record<string, { impressions: number; clicks: number }> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyMap[d.toISOString().slice(0, 10)] = { impressions: 0, clicks: 0 };
      }
      events.forEach(e => {
        const day = e.timestamp?.slice(0, 10);
        if (!dailyMap[day]) return;
        if (e.action === "youtube_video_impression") dailyMap[day].impressions++;
        else dailyMap[day].clicks++;
      });
      const dailyTrend: DailyPoint[] = Object.entries(dailyMap).map(([date, v]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...v,
        ctr: v.impressions > 0 ? Math.round((v.clicks / v.impressions) * 1000) / 10 : 0,
      }));

      // Per-video breakdown
      const videoMap = new Map<string, { title: string; channel: string; impressions: number; clicks: number }>();
      impressions.forEach(e => {
        const id = e.item_id || "unknown";
        const existing = videoMap.get(id) || { title: e.item_title || id, channel: e.item_brand || "", impressions: 0, clicks: 0 };
        existing.impressions++;
        videoMap.set(id, existing);
      });
      allClicks.forEach(e => {
        const id = e.item_id || "unknown";
        const existing = videoMap.get(id) || { title: e.item_title || id, channel: e.item_brand || "", impressions: 0, clicks: 0 };
        existing.clicks++;
        videoMap.set(id, existing);
      });
      const topVideos: VideoRow[] = Array.from(videoMap.entries())
        .map(([video_id, v]) => ({
          video_id,
          ...v,
          ctr: v.impressions > 0 ? Math.round((v.clicks / v.impressions) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10);

      setData({
        totalImpressions,
        totalClicks,
        overallCTR,
        chatClicks: chatClicks.length,
        diyImpressions: impressions.length,
        diyClicks: diyClicks.length,
        dailyTrend,
        topVideos,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-center py-12 text-muted-foreground">{error || "No data"}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Youtube className="h-5 w-5 text-destructive" />
        <h2 className="font-heading text-xl font-bold">YouTube Video Engagement</h2>
        <Badge variant="outline" className="text-xs">Last 30 days</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" /> Video Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalImpressions}</p>
            <p className="text-xs text-muted-foreground mt-1">Unique video card views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MousePointerClick className="h-4 w-4" /> Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalClicks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              DIY: {data.diyClicks} · Chat: {data.chatClicks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Overall CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{data.overallCTR.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Clicks / Impressions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Play className="h-4 w-4" /> Unique Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.topVideos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Videos shown to users</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-accent" /> Daily Impressions vs Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} name="Impressions" />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" /> Top Videos by Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topVideos.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.topVideos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="title"
                    type="category"
                    width={180}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.length > 30 ? v.slice(0, 28) + "…" : v}
                  />
                  <Tooltip formatter={(v: number, name: string) => [v, name === "impressions" ? "Impressions" : "Clicks"]} />
                  <Legend />
                  <Bar dataKey="impressions" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} name="Impressions" />
                  <Bar dataKey="clicks" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-muted-foreground text-sm">No video data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-video table */}
      {data.topVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-Video Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Video</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Channel</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Impressions</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Clicks</th>
                    <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topVideos.map((v) => (
                    <tr key={v.video_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 max-w-[300px] truncate">
                        <a
                          href={`https://youtube.com/watch?v=${v.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {v.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{v.channel || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{v.impressions}</td>
                      <td className="px-4 py-3 text-right font-mono">{v.clicks}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant={v.ctr >= 10 ? "default" : "outline"}
                          className={v.ctr >= 10 ? "bg-accent text-accent-foreground" : ""}
                        >
                          {v.ctr.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
