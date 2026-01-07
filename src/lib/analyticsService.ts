// Analytics Service - tracks page views, events, and user interactions
// Uses localStorage for demo purposes (in production, use a proper analytics service)

const ANALYTICS_KEY = "sop_analytics";

export interface PageView {
  path: string;
  title: string;
  timestamp: string;
  referrer?: string;
}

export interface AnalyticsEvent {
  name: string;
  category: string;
  data?: Record<string, any>;
  timestamp: string;
}

export interface AnalyticsData {
  pageViews: PageView[];
  events: AnalyticsEvent[];
  sessions: number;
  firstVisit: string;
  lastVisit: string;
}

function getAnalytics(): AnalyticsData {
  if (typeof window === "undefined") {
    return {
      pageViews: [],
      events: [],
      sessions: 0,
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
    };
  }

  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }

  const initial: AnalyticsData = {
    pageViews: [],
    events: [],
    sessions: 1,
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
  };

  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(initial));
  return initial;
}

function saveAnalytics(data: AnalyticsData): void {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
}

// Track a page view
export function trackPageView(path: string, title: string): void {
  const data = getAnalytics();
  
  // Limit stored page views to last 1000
  if (data.pageViews.length >= 1000) {
    data.pageViews = data.pageViews.slice(-500);
  }

  data.pageViews.push({
    path,
    title,
    timestamp: new Date().toISOString(),
    referrer: document.referrer || undefined,
  });

  data.lastVisit = new Date().toISOString();
  saveAnalytics(data);
}

// Track a custom event
export function trackEvent(
  name: string,
  category: string,
  eventData?: Record<string, any>
): void {
  const data = getAnalytics();

  // Limit stored events to last 500
  if (data.events.length >= 500) {
    data.events = data.events.slice(-250);
  }

  data.events.push({
    name,
    category,
    data: eventData,
    timestamp: new Date().toISOString(),
  });

  saveAnalytics(data);
}

// Increment session count (call on app load)
export function trackSession(): void {
  const data = getAnalytics();
  
  // Check if last visit was more than 30 minutes ago
  const lastVisit = new Date(data.lastVisit);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastVisit.getTime()) / (1000 * 60);

  if (diffMinutes > 30) {
    data.sessions += 1;
  }

  data.lastVisit = now.toISOString();
  saveAnalytics(data);
}

// Get analytics summary for dashboard
export interface AnalyticsSummary {
  totalPageViews: number;
  uniquePages: number;
  totalEvents: number;
  totalSessions: number;
  topPages: { path: string; views: number }[];
  pageViewsByDay: { date: string; views: number }[];
  eventsByCategory: { category: string; count: number }[];
  recentActivity: (PageView | AnalyticsEvent)[];
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const data = getAnalytics();

  // Count page views by path
  const pageViewCounts: Record<string, number> = {};
  data.pageViews.forEach((pv) => {
    pageViewCounts[pv.path] = (pageViewCounts[pv.path] || 0) + 1;
  });

  // Top pages
  const topPages = Object.entries(pageViewCounts)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Page views by day (last 30 days)
  const last30Days: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    last30Days[date.toISOString().split("T")[0]] = 0;
  }

  data.pageViews.forEach((pv) => {
    const date = pv.timestamp.split("T")[0];
    if (last30Days[date] !== undefined) {
      last30Days[date]++;
    }
  });

  const pageViewsByDay = Object.entries(last30Days).map(([date, views]) => ({
    date,
    views,
  }));

  // Events by category
  const eventCounts: Record<string, number> = {};
  data.events.forEach((e) => {
    eventCounts[e.category] = (eventCounts[e.category] || 0) + 1;
  });

  const eventsByCategory = Object.entries(eventCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Recent activity (last 20 items)
  const allActivity = [
    ...data.pageViews.map((pv) => ({ ...pv, type: "pageview" as const })),
    ...data.events.map((e) => ({ ...e, type: "event" as const })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return {
    totalPageViews: data.pageViews.length,
    uniquePages: Object.keys(pageViewCounts).length,
    totalEvents: data.events.length,
    totalSessions: data.sessions,
    topPages,
    pageViewsByDay,
    eventsByCategory,
    recentActivity: allActivity,
  };
}

// Clear all analytics data
export function clearAnalytics(): void {
  localStorage.removeItem(ANALYTICS_KEY);
}

// Pre-defined event categories
export const EventCategories = {
  TICKET: "ticket",
  NAVIGATION: "navigation",
  MEDIA: "media",
  SOCIAL: "social",
  DONATION: "donation",
  FORM: "form",
} as const;

// Pre-defined event names
export const EventNames = {
  // Ticket events
  TICKET_VIEW: "ticket_view",
  TICKET_SELECT: "ticket_select",
  TICKET_PURCHASE_START: "ticket_purchase_start",
  TICKET_PURCHASE_COMPLETE: "ticket_purchase_complete",
  
  // Media events
  VIDEO_PLAY: "video_play",
  ALBUM_VIEW: "album_view",
  MUSIC_STREAM_CLICK: "music_stream_click",
  
  // Social events
  SHARE_CLICK: "share_click",
  SOCIAL_LINK_CLICK: "social_link_click",
  
  // Donation events
  DONATION_START: "donation_start",
  DONATION_COMPLETE: "donation_complete",
  
  // Form events
  FORM_SUBMIT: "form_submit",
  NEWSLETTER_SUBSCRIBE: "newsletter_subscribe",
} as const;

