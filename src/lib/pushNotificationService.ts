// Push Notification Service for PWA
// Handles notification permissions, subscriptions, and local + server push notifications

import { supabase, isSupabaseConfigured } from './supabase';

// VAPID public key for Web Push (generated via web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = 'BDACvyDTUHfI4ELQz6yaYei5gRBLR3Vm27-Ga_bkCwJK4wHiUJhas2vXTqArZkr0x7JymjODZaAvENkLiLOQfik';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: { action: string; title: string; icon?: string }[];
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Store the preference
      localStorage.setItem('push_notifications_enabled', 'true');
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

// Check if notifications are enabled
export function areNotificationsEnabled(): boolean {
  return localStorage.getItem('push_notifications_enabled') === 'true' && 
         getNotificationPermission() === 'granted';
}

// Disable notifications
export function disableNotifications(): void {
  localStorage.setItem('push_notifications_enabled', 'false');
}

// Enable notifications (if permission already granted)
export function enableNotifications(): void {
  if (getNotificationPermission() === 'granted') {
    localStorage.setItem('push_notifications_enabled', 'true');
  }
}

// Show a local notification
export async function showNotification(options: PushNotificationOptions): Promise<boolean> {
  if (!areNotificationsEnabled()) {
    console.log('Notifications disabled or not permitted');
    return false;
  }

  try {
    // Try using service worker for better reliability
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/icon-192x192.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction,
      actions: options.actions,
    });
    
    return true;
  } catch (error) {
    // Fallback to regular Notification API
    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        tag: options.tag,
        data: options.data,
      });
      return true;
    } catch (e) {
      console.error('Error showing notification:', e);
      return false;
    }
  }
}

// Schedule a notification (using setTimeout for simplicity)
export function scheduleNotification(
  options: PushNotificationOptions, 
  delayMs: number
): NodeJS.Timeout | null {
  if (!areNotificationsEnabled()) return null;
  
  return setTimeout(() => {
    showNotification(options);
  }, delayMs);
}

// Notification types for the choir app
export type NotificationType = 
  | 'event_reminder'
  | 'birthday'
  | 'contribution_due'
  | 'contribution_overdue'
  | 'announcement'
  | 'leave_status'
  | 'survey';

// Get notification preferences
export interface NotificationPreferences {
  eventReminders: boolean;
  birthdays: boolean;
  contributions: boolean;
  announcements: boolean;
  leaveStatus: boolean;
  surveys: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  eventReminders: true,
  birthdays: true,
  contributions: true,
  announcements: true,
  leaveStatus: true,
  surveys: true,
};

export function getNotificationPreferences(): NotificationPreferences {
  const stored = localStorage.getItem('notification_preferences');
  if (stored) {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  }
  return DEFAULT_PREFERENCES;
}

export function updateNotificationPreferences(updates: Partial<NotificationPreferences>): void {
  const current = getNotificationPreferences();
  const updated = { ...current, ...updates };
  localStorage.setItem('notification_preferences', JSON.stringify(updated));
}

// Helper to check if a specific notification type is enabled
export function isNotificationTypeEnabled(type: NotificationType): boolean {
  if (!areNotificationsEnabled()) return false;
  
  const prefs = getNotificationPreferences();
  
  switch (type) {
    case 'event_reminder':
      return prefs.eventReminders;
    case 'birthday':
      return prefs.birthdays;
    case 'contribution_due':
    case 'contribution_overdue':
      return prefs.contributions;
    case 'announcement':
      return prefs.announcements;
    case 'leave_status':
      return prefs.leaveStatus;
    case 'survey':
      return prefs.surveys;
    default:
      return true;
  }
}

// Pre-built notification helpers
export function notifyEventReminder(eventTitle: string, eventTime: string): Promise<boolean> {
  if (!isNotificationTypeEnabled('event_reminder')) return Promise.resolve(false);
  
  return showNotification({
    title: '📅 Event Reminder',
    body: `${eventTitle} is coming up at ${eventTime}`,
    tag: 'event-reminder',
    requireInteraction: true,
  });
}

export function notifyBirthday(names: string[]): Promise<boolean> {
  if (!isNotificationTypeEnabled('birthday')) return Promise.resolve(false);
  
  const nameList = names.length === 1 
    ? names[0] 
    : names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
  
  return showNotification({
    title: '🎂 Happy Birthday!',
    body: `Today we celebrate ${nameList}!`,
    tag: 'birthday',
  });
}

export function notifyContributionDue(amount: number, dueDate: string): Promise<boolean> {
  if (!isNotificationTypeEnabled('contribution_due')) return Promise.resolve(false);
  
  return showNotification({
    title: '💰 Contribution Reminder',
    body: `You have ${amount.toLocaleString()} RWF due on ${dueDate}`,
    tag: 'contribution-due',
    requireInteraction: true,
  });
}

export function notifyContributionOverdue(amount: number): Promise<boolean> {
  if (!isNotificationTypeEnabled('contribution_overdue')) return Promise.resolve(false);
  
  return showNotification({
    title: '⚠️ Overdue Contribution',
    body: `You have ${amount.toLocaleString()} RWF overdue. Please make payment soon.`,
    tag: 'contribution-overdue',
    requireInteraction: true,
  });
}

export function notifyAnnouncement(title: string, preview: string): Promise<boolean> {
  if (!isNotificationTypeEnabled('announcement')) return Promise.resolve(false);
  
  return showNotification({
    title: `📢 ${title}`,
    body: preview,
    tag: 'announcement',
  });
}

export function notifyLeaveStatus(status: 'approved' | 'denied'): Promise<boolean> {
  if (!isNotificationTypeEnabled('leave_status')) return Promise.resolve(false);
  
  return showNotification({
    title: status === 'approved' ? '✅ Leave Approved' : '❌ Leave Denied',
    body: `Your leave request has been ${status}.`,
    tag: 'leave-status',
  });
}

export function notifySurvey(surveyTitle: string): Promise<boolean> {
  if (!isNotificationTypeEnabled('survey')) return Promise.resolve(false);
  
  return showNotification({
    title: '📋 New Survey',
    body: `Please complete: ${surveyTitle}`,
    tag: 'survey',
  });
}

// ============ SERVER PUSH SUBSCRIPTION ============

// Subscribe this browser to server push notifications
export async function subscribeToPush(userId?: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  if (getNotificationPermission() !== 'granted') return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Save subscription to Supabase for server-side push
    if (isSupabaseConfigured() && subscription) {
      const subJson = subscription.toJSON();
      await supabase.from('push_subscriptions').upsert({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
        user_id: userId || 'anonymous',
        created_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });
    }

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

// Unsubscribe from server push
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from Supabase
      if (isSupabaseConfigured()) {
        const subJson = subscription.toJSON();
        await supabase.from('push_subscriptions')
          .delete()
          .eq('endpoint', subJson.endpoint);
      }
      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

// Check if currently subscribed to server push
export async function isPushSubscribed(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}
