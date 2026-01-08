// Event Reminders Service
// Manages event reminders using localStorage and browser notifications

const REMINDERS_KEY = "choir_event_reminders";

export interface EventReminder {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  reminderTime: Date; // When to show the reminder
  type: "1hour" | "1day" | "1week";
  notified: boolean;
  userEmail?: string;
}

// Get all reminders
export function getAllReminders(): EventReminder[] {
  const data = localStorage.getItem(REMINDERS_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

// Get reminders for a specific event
export function getEventReminders(eventId: string): EventReminder[] {
  return getAllReminders().filter(r => r.eventId === eventId);
}

// Check if user has set a reminder for an event
export function hasReminder(eventId: string, type: EventReminder["type"]): boolean {
  return getAllReminders().some(r => r.eventId === eventId && r.type === type);
}

// Add a reminder
export function addReminder(
  eventId: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation: string,
  type: EventReminder["type"],
  userEmail?: string
): EventReminder {
  const reminders = getAllReminders();
  
  // Calculate reminder time
  const eventDateTime = new Date(`${eventDate}T${eventTime || "00:00"}`);
  let reminderTime = new Date(eventDateTime);
  
  switch (type) {
    case "1hour":
      reminderTime.setHours(reminderTime.getHours() - 1);
      break;
    case "1day":
      reminderTime.setDate(reminderTime.getDate() - 1);
      break;
    case "1week":
      reminderTime.setDate(reminderTime.getDate() - 7);
      break;
  }

  const reminder: EventReminder = {
    id: `reminder-${Date.now()}`,
    eventId,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    reminderTime,
    type,
    notified: false,
    userEmail,
  };

  reminders.push(reminder);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  
  return reminder;
}

// Remove a reminder
export function removeReminder(eventId: string, type: EventReminder["type"]): void {
  const reminders = getAllReminders().filter(
    r => !(r.eventId === eventId && r.type === type)
  );
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// Remove all reminders for an event
export function removeAllEventReminders(eventId: string): void {
  const reminders = getAllReminders().filter(r => r.eventId !== eventId);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// Mark a reminder as notified
export function markReminderNotified(reminderId: string): void {
  const reminders = getAllReminders().map(r => 
    r.id === reminderId ? { ...r, notified: true } : r
  );
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// Get due reminders (not yet notified and reminder time has passed)
export function getDueReminders(): EventReminder[] {
  const now = new Date();
  return getAllReminders().filter(r => {
    const reminderTime = new Date(r.reminderTime);
    return !r.notified && reminderTime <= now;
  });
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Show a browser notification
export function showNotification(reminder: EventReminder): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const typeLabels = {
    "1hour": "in 1 hour",
    "1day": "tomorrow",
    "1week": "in 1 week",
  };

  const notification = new Notification(`🎵 Event Reminder: ${reminder.eventTitle}`, {
    body: `${reminder.eventTitle} is coming up ${typeLabels[reminder.type]}!\n${reminder.eventDate} at ${reminder.eventTime}\n${reminder.eventLocation}`,
    icon: "/favicon.ico",
    tag: reminder.id,
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

// Check and process due reminders
export function checkAndProcessReminders(): void {
  const dueReminders = getDueReminders();
  
  dueReminders.forEach(reminder => {
    showNotification(reminder);
    markReminderNotified(reminder.id);
  });
}

// Clean up old reminders (past events)
export function cleanupOldReminders(): void {
  const now = new Date();
  const reminders = getAllReminders().filter(r => {
    const eventDate = new Date(`${r.eventDate}T${r.eventTime || "23:59"}`);
    return eventDate > now;
  });
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// Format reminder type for display
export function formatReminderType(type: EventReminder["type"]): string {
  switch (type) {
    case "1hour": return "1 hour before";
    case "1day": return "1 day before";
    case "1week": return "1 week before";
    default: return type;
  }
}

