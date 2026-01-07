import { useState, useEffect } from "react";
import { getAnalyticsSummary, type AnalyticsSummary } from "@/lib/analyticsService";
import {
  Eye,
  MousePointer,
  TrendingUp,
  Activity,
  BarChart3,
  Clock,
} from "lucide-react";

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    const loadAnalytics = () => {
      setAnalytics(getAnalyticsSummary());
    };

    loadAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Page Views",
      value: analytics.totalPageViews,
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      label: "Unique Pages",
      value: analytics.uniquePages,
      icon: BarChart3,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      label: "Total Events",
      value: analytics.totalEvents,
      icon: MousePointer,
      color: "text-purple-500",
      bgColor: "bg-purple-500/20",
    },
    {
      label: "Sessions",
      value: analytics.totalSessions,
      icon: Activity,
      color: "text-orange-500",
      bgColor: "bg-orange-500/20",
    },
  ];

  // Simple bar chart for page views by day
  const maxViews = Math.max(...analytics.pageViewsByDay.map((d) => d.views), 1);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="card-glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Views Chart */}
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Page Views (Last 30 Days)</h3>
          </div>

          <div className="h-48 flex items-end gap-1">
            {analytics.pageViewsByDay.map((day, i) => {
              const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
              const isToday = i === analytics.pageViewsByDay.length - 1;
              return (
                <div
                  key={day.date}
                  className="flex-1 group relative"
                  title={`${day.date}: ${day.views} views`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      isToday ? "bg-primary" : "bg-primary/40 hover:bg-primary/60"
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {day.date.split("-").slice(1).join("/")}
                    <br />
                    {day.views} views
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Top Pages */}
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Top Pages</h3>
          </div>

          <div className="space-y-3">
            {analytics.topPages.length > 0 ? (
              analytics.topPages.slice(0, 7).map((page, i) => {
                const percentage = (page.views / analytics.totalPageViews) * 100;
                return (
                  <div key={page.path} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground truncate max-w-[200px]">
                        {page.path === "/" ? "Home" : page.path}
                      </span>
                      <span className="text-muted-foreground">
                        {page.views} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center py-4">No page views yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Recent Activity</h3>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {analytics.recentActivity.length > 0 ? (
            analytics.recentActivity.map((activity, i) => {
              const isPageView = "path" in activity;
              const time = new Date(activity.timestamp);
              const timeAgo = getTimeAgo(time);

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isPageView ? "bg-blue-500/20" : "bg-purple-500/20"
                    }`}
                  >
                    {isPageView ? (
                      <Eye className="w-4 h-4 text-blue-500" />
                    ) : (
                      <MousePointer className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {isPageView
                        ? `Viewed ${(activity as any).path}`
                        : `${(activity as any).name} (${(activity as any).category})`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Events by Category */}
      {analytics.eventsByCategory.length > 0 && (
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <MousePointer className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Events by Category</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.eventsByCategory.map((cat) => (
              <div key={cat.category} className="text-center p-4 bg-secondary/30 rounded-xl">
                <p className="text-2xl font-bold text-primary">{cat.count}</p>
                <p className="text-sm text-muted-foreground capitalize">{cat.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

