// Simple analytics tracking service using localStorage

const STORAGE_KEY = "choir_analytics";
const SESSION_KEY = "choir_session";

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

function getAnalytics(): AnalyticsData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { pageViews: [], totalViews: 0, uniqueVisitors: 0, sessions: [] };
}

function saveAnalytics(data: AnalyticsData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getOrCreateSession(): string {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    return stored;
  }
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function trackSession(): void {
  const sessionId = getOrCreateSession();
  const data = getAnalytics();
  
  // Check if this session is already tracked
  const existingSession = data.sessions?.find(s => s.id === sessionId);
  if (!existingSession) {
    const session: Session = {
      id: sessionId,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
    data.sessions = data.sessions || [];
    data.sessions.push(session);
    data.uniqueVisitors++;
    
    // Keep only last 100 sessions
    if (data.sessions.length > 100) {
      data.sessions = data.sessions.slice(-100);
    }
    
    saveAnalytics(data);
  }
}

export function trackPageView(path: string, title: string): void {
  const sessionId = getOrCreateSession();
  const data = getAnalytics();
  const pageView: PageView = {
    id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    path,
    title,
    timestamp: new Date().toISOString(),
    referrer: document.referrer || undefined,
    sessionId,
  };
  
  data.pageViews.push(pageView);
  data.totalViews++;
  
  // Update session last activity
  const session = data.sessions?.find(s => s.id === sessionId);
  if (session) {
    session.lastActivity = new Date().toISOString();
  }
  
  // Keep only last 1000 page views to prevent localStorage overflow
  if (data.pageViews.length > 1000) {
    data.pageViews = data.pageViews.slice(-1000);
  }
  
  saveAnalytics(data);
}

export function getAllPageViews(): PageView[] {
  return getAnalytics().pageViews;
}

export function getPageViewStats(): {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  viewsByPage: { path: string; title: string; count: number }[];
  viewsByDay: { date: string; views: number }[];
  viewsByHour: { hour: number; views: number }[];
} {
  const data = getAnalytics();
  const pageViews = data.pageViews;
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  // Count views by time period
  const todayViews = pageViews.filter(pv => pv.timestamp >= todayStart).length;
  const weekViews = pageViews.filter(pv => pv.timestamp >= weekStart).length;
  const monthViews = pageViews.filter(pv => pv.timestamp >= monthStart).length;
  
  // Count views by page
  const pageCountMap: Record<string, { title: string; count: number }> = {};
  pageViews.forEach(pv => {
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
    const dateStr = date.toISOString().split('T')[0];
    const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    const dayViews = pageViews.filter(pv => 
      pv.timestamp >= date.toISOString() && pv.timestamp < nextDate
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
    const hourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h + 1).toISOString();
    const hourViews = pageViews.filter(pv => 
      pv.timestamp >= hourStart && pv.timestamp < hourEnd
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

// Generate some sample data for demonstration
export function seedAnalyticsData(): void {
  const data = getAnalytics();
  
  // Only seed if we have less than 50 views
  if (data.pageViews.length >= 50) return;
  
  const pages = [
    { path: "/", title: "Home" },
    { path: "/events", title: "Events" },
    { path: "/gallery", title: "Gallery" },
    { path: "/contact", title: "Contact" },
    { path: "/releases", title: "Music Releases" },
    { path: "/member-portal", title: "Member Portal" },
  ];
  
  const now = new Date();
  
  // Generate random page views over the last 7 days
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysAgo,
      hoursAgo,
      minutesAgo
    );
    
    const page = pages[Math.floor(Math.random() * pages.length)];
    
    data.pageViews.push({
      id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path: page.path,
      title: page.title,
      timestamp: timestamp.toISOString(),
    });
  }
  
  data.totalViews = data.pageViews.length;
  saveAnalytics(data);
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
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const data = getAnalytics();
  const pageViews = data.pageViews;
  const sessions = data.sessions || [];
  
  // Calculate unique pages
  const uniquePaths = new Set(pageViews.map(pv => pv.path));
  
  // Get page views by day (last 30 days)
  const now = new Date();
  const pageViewsByDay: { date: string; views: number }[] = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    const dayViews = pageViews.filter(pv => 
      pv.timestamp >= date.toISOString() && pv.timestamp < nextDate
    ).length;
    pageViewsByDay.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: dayViews,
    });
  }
  
  // Get top pages
  const pageCountMap: Record<string, { title: string; count: number }> = {};
  pageViews.forEach(pv => {
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
    const durations = sessions.map(s => {
      const start = new Date(s.startTime).getTime();
      const end = new Date(s.lastActivity).getTime();
      return (end - start) / 1000; // seconds
    }).filter(d => d > 0);
    
    if (durations.length > 0) {
      avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    }
  }
  
  return {
    totalPageViews: pageViews.length,
    uniquePages: uniquePaths.size,
    totalEvents: pageViews.length, // Events are essentially page views in this simple implementation
    totalSessions: sessions.length,
    pageViewsByDay,
    topPages,
    averageSessionDuration: Math.round(avgDuration),
  };
}
