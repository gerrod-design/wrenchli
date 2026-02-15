import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  MousePointer,
  DollarSign,
  Target,
  BarChart3,
  Activity,
} from "lucide-react";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";

const AnalyticsDashboard = ({
  dateRange = {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
}: {
  dateRange?: { start: string; end: string };
}) => {
  const { metrics, loading } = useRevenueAnalytics(dateRange);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data available for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Clicks</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold mt-1">${metrics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Revenue Per Click</span>
            </div>
            <div className="text-2xl font-bold mt-1">${metrics.averageRevenuePerClick.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Conversion Rate</span>
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Performing Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.topPerformingCategories.length === 0 ? (
            <p className="text-muted-foreground text-sm">No category data yet.</p>
          ) : (
            <div className="space-y-4">
              {metrics.topPerformingCategories.map((cat, i) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={i === 0 ? "default" : "secondary"}>#{i + 1}</Badge>
                    <span className="font-medium capitalize">{cat.category.replace("_", " ")}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${cat.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{cat.clicks} clicks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
