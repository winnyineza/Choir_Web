// Analytics tracking service - persistent data in Supabase, session ID in sessionStorage

import { dbGetAll, dbInsert, dbQuery, generateId, supabase, isSupabaseConfigured } from './supabaseDB';

const SESSION_KEY = 'choir_session';

export interface PageView {
  id: string;
  path: string;
  title: string;
  timestamp: string;
  referrer?: string;
  sessionId?: string;
}

export interface Session {
  id: string;
  startTime: string;
  lastActivity: string;
}

export interface AnalyticsData {
  pageViews: PageView[];
  totalViews: number;
  uniqueVisitors: number;
  sessions: Session[];
}

function getOrCreateSession(): string {
  if (typeof sessionStorage === 'undefined') return '';
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    return stored;
  }
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export async function trackSession(): Promise<void> {
  const sessionId = getOrCreateSession();
  if (!sessionId) return;

  if (!isSupabaseConfigured()) return;

  try {
    // Check if this session already exists
    const { data: existing } = await supabase
      .from('analytics_sessions')
      .select('id')
      .eq('id', sessionId)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const session: Session = {
        id: sessionId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };
      await dbInsert('choir_analytics_sessions', {
        id: session.id,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
      });
    }
  } catch (e) {
    console.debug('[Analytics] trackSession error:', e);
  }
}

export async function trackPageView(path: string, title: string): Promise<void> {
  const sessionId = getOrCreateSession();

  const pageView: PageView = {
    id: `pv_${generateId()}`,
    path,
    title,
    timestamp: new Date().toISOString(),
    referrer: document?.referrer || undefined,
    sessionId,
  };

  if (isSupabaseConfigured()) {
    try {
      await dbInsert('choir_analytics_page_views', {
        id: pageView.id,
        path: pageView.path,
        title: pageView.title,
        timestamp: pageView.timestamp,
        referrer: pageView.referrer,
        sessionId: pageView.sessionId,
      });

      // Update session last activity
      if (sessionId) {
        await supabase
          .from('analytics_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', sessionId);
      }
    } catch (e) {
      console.debug('[Analytics] trackPageView error:', e);
    }
  }
}

export async function getAllPageViews(): Promise<PageView[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await dbGetAll<PageView>('choir_analytics_page_views');
  } catch {
    return [];
  }
}

export async function getPageViewStats(): Promise<{
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  viewsByPage: { path: string; title: string; count: number }[];
  viewsByDay: { date: string; views: number }[];
  viewsByHour: { hour: number; views: number }[];
}> {
  const pageViews = await getAllPageViews();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Count views by time period
  const todayViews = pageViews.filter((pv) => pv.timestamp >= todayStart).length;
  const weekViews = pageViews.filter((pv) => pv.timestamp >= weekStart).length;
  const monthViews = pageViews.filter((pv) => pv.timestamp >= monthStart).length;

  // Count views by page
  const pageCountMap: Record<string, { title: string; count: number }> = {};
  pageViews.forEach((pv) => {
    if (!pageCountMap[pv.path]) {
      pageCountMap[pv.path] = { title: pv.title, count: 0 };
    }
    pageCountMap[pv.path].count++;
  });

  const viewsByPage = Object.entries(pageCountMap)
    .map(([path, { title, count }]) => ({ path, title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Views by day (last 7 days)
  const viewsByDay: { date: string; views: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    const dayViews = pageViews.filter(
      (pv) => pv.timestamp >= date.toISOString() && pv.timestamp < nextDate
    ).length;
    viewsByDay.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      views: dayViews,
    });
  }

  // Views by hour (today)
  const viewsByHour: { hour: number; views: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h).toISOString();
    const hourEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h + 1
    ).toISOString();
    const hourViews = pageViews.filter(
      (pv) => pv.timestamp >= hourStart && pv.timestamp < hourEnd
    ).length;
    viewsByHour.push({ hour: h, views: hourViews });
  }

  return {
    totalViews: pageViews.length,
    todayViews,
    weekViews,
    monthViews,
    viewsByPage,
    viewsByDay,
    viewsByHour,
  };
}

// Type for the AnalyticsDashboard component
export interface AnalyticsSummary {
  totalPageViews: number;
  uniquePages: number;
  totalEvents: number;
  totalSessions: number;
  pageViewsByDay: { date: string; views: number }[];
  topPages: { path: string; title: string; views: number }[];
  averageSessionDuration: number;
  recentActivity: (PageView | { name: string; category: string; timestamp: string })[];
  eventsByCategory: { category: string; count: number }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [pageViews, sessions] = await Promise.all([
    getAllPageViews(),
    isSupabaseConfigured()
      ? dbGetAll<Session>('choir_analytics_sessions')
      : Promise.resolve([]),
  ]);

  // Calculate unique pages
  const uniquePaths = new Set(pageViews.map((pv) => pv.path));

  // Get page views by day (last 30 days)
  const now = new Date();
  const pageViewsByDay: { date: string; views: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const nextDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    ).toISOString();
    const dayViews = pageViews.filter(
      (pv) => pv.timestamp >= date.toISOString() && pv.timestamp < nextDate
    ).length;
    pageViewsByDay.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: dayViews,
    });
  }

  // Get top pages
  const pageCountMap: Record<string, { title: string; count: number }> = {};
  pageViews.forEach((pv) => {
    if (!pageCountMap[pv.path]) {
      pageCountMap[pv.path] = { title: pv.title, count: 0 };
    }
    pageCountMap[pv.path].count++;
  });

  const topPages = Object.entries(pageCountMap)
    .map(([path, { title, count }]) => ({ path, title, views: count }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Calculate average session duration (in seconds)
  let avgDuration = 0;
  if (sessions.length > 0) {
    const durations = sessions
      .map((s) => {
        const start = new Date(s.startTime).getTime();
        const end = new Date(s.lastActivity).getTime();
        return (end - start) / 1000; // seconds
      })
      .filter((d) => d > 0);

    if (durations.length > 0) {
      avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    }
  }

  // Get recent activity (last 20 page views)
  const recentActivity = [...pageViews].reverse().slice(0, 20);

  // Group by category (using path as pseudo-category)
  const categoryMap: Record<string, number> = {};
  pageViews.forEach((pv) => {
    const category =
      pv.path === '/' ? 'home' : pv.path.replace('/', '').split('/')[0] || 'other';
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });

  const eventsByCategory = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalPageViews: pageViews.length,
    uniquePages: uniquePaths.size,
    totalEvents: pageViews.length,
    totalSessions: sessions.length,
    pageViewsByDay,
    topPages,
    averageSessionDuration: Math.round(avgDuration),
    recentActivity,
    eventsByCategory,
  };
}
