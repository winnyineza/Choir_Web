import { addAuditLog, type AdminUser } from "./adminService";
import { dbQuery, dbUpsert, isSupabaseConfigured } from "./supabaseDB";

export type NotificationChannel = "email" | "sms";

export interface NotificationPreference {
  userId: string;
  channels: NotificationChannel[];
}

export interface NotificationPayload {
  to: string;
  subject: string;
  message: string;
  channel: NotificationChannel;
  meta?: Record<string, string | number>;
}

// localStorage fallback for browser-only when Supabase not configured (theme, etc. stay in localStorage)
const KEY = "serenades_notification_preferences";

function getPrefsFromStorage(): NotificationPreference[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePrefsToStorage(prefs: NotificationPreference[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export async function setNotificationPreference(
  pref: NotificationPreference,
  actor?: AdminUser
): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await dbUpsert("serenades_notification_preferences", {
        id: pref.userId, // Use userId as id for upsert-by-user
        userId: pref.userId,
        channels: pref.channels,
      });
      if (actor) {
        addAuditLog(actor, "UPDATE_SETTINGS", `Updated notification preferences for ${pref.userId}`);
      }
      return;
    } catch (e) {
      console.debug("[Notification] Supabase save failed, falling back to localStorage:", e);
    }
  }

  const prefs = getPrefsFromStorage();
  const idx = prefs.findIndex((p) => p.userId === pref.userId);
  if (idx >= 0) {
    prefs[idx] = pref;
  } else {
    prefs.push(pref);
  }
  savePrefsToStorage(prefs);
  if (actor) addAuditLog(actor, "UPDATE_SETTINGS", `Updated notification preferences for ${pref.userId}`);
}

export async function getNotificationPreference(
  userId: string
): Promise<NotificationPreference | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const rows = await dbQuery<{ id: string; userId: string; channels: NotificationChannel[] }>(
        "serenades_notification_preferences",
        "user_id",
        userId
      );
      if (rows.length > 0) {
        return { userId: rows[0].userId, channels: rows[0].channels || [] };
      }
      return undefined;
    } catch {
      // Fall through to localStorage
    }
  }

  return getPrefsFromStorage().find((p) => p.userId === userId);
}

// NOTE: In this demo environment we stub sending. Wire to SendGrid/Resend/Twilio in production.
export async function sendNotification(
  payload: NotificationPayload,
  actor?: AdminUser
): Promise<{ ok: boolean; message: string }> {
  // Simulate async call
  await new Promise((res) => setTimeout(res, 50));
  if (actor) {
    addAuditLog(actor, "SETTINGS", `Sent ${payload.channel} notification to ${payload.to}: ${payload.subject}`);
  }
  return { ok: true, message: "Queued (stub)" };
}

// Utility to send templated birthday reminders and leave/event reminders
export async function sendTemplatedNotification(
  template: "birthday_reminder" | "birthday_today" | "leave_approval" | "event_reminder" | "receipt",
  data: Record<string, string | number>,
  to: string,
  channel: NotificationChannel,
  actor?: AdminUser
) {
  const subjectMap: Record<typeof template, string> = {
    birthday_reminder: "Upcoming Birthday Reminder",
    birthday_today: "Happy Birthday!",
    leave_approval: "Leave Request Update",
    event_reminder: "Event Reminder",
    receipt: "Payment Receipt",
  };
  const subject = subjectMap[template];
  const message = Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return sendNotification({ to, subject, message, channel, meta: data }, actor);
}
