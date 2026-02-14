// Announcement Service - Manage announcements for members (Supabase)

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, generateId } from './supabaseDB';

const ANNOUNCEMENTS_KEY = "choir_announcements";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "event";
  priority: "normal" | "high" | "urgent";
  audience: "all" | "members" | "admins";
  startDate: string;
  endDate?: string; // Optional expiry
  createdBy: string;
  createdAt: string;
  isPinned: boolean;
  isActive: boolean;
}

// Get all announcements
export async function getAllAnnouncements(): Promise<Announcement[]> {
  return dbGetAll<Announcement>(ANNOUNCEMENTS_KEY);
}

// Get active announcements (for display)
export async function getActiveAnnouncements(audience: "all" | "members" | "admins" = "all"): Promise<Announcement[]> {
  const announcements = await getAllAnnouncements();
  const now = new Date();
  return announcements
    .filter(a => {
      if (!a.isActive) return false;
      if (new Date(a.startDate) > now) return false;
      if (a.endDate && new Date(a.endDate) < now) return false;
      if (audience !== "all" && a.audience !== "all" && a.audience !== audience) return false;
      return true;
    })
    .sort((a, b) => {
      // Pinned first, then by priority, then by date
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

// Get announcement by ID
export async function getAnnouncementById(id: string): Promise<Announcement | undefined> {
  const announcement = await dbGetById<Announcement>(ANNOUNCEMENTS_KEY, id);
  return announcement ?? undefined;
}

// Create announcement
export async function createAnnouncement(announcement: Omit<Announcement, "id" | "createdAt">): Promise<Announcement> {
  const newAnnouncement: Announcement = {
    ...announcement,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  return dbInsert<Announcement>(ANNOUNCEMENTS_KEY, newAnnouncement);
}

// Update announcement
export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
  try {
    const existing = await dbGetById<Announcement>(ANNOUNCEMENTS_KEY, id);
    if (!existing) return null;
    return dbUpdate<Announcement>(ANNOUNCEMENTS_KEY, id, { ...existing, ...updates });
  } catch {
    return null;
  }
}

// Delete announcement
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    await dbDelete(ANNOUNCEMENTS_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// Toggle pin status
export async function toggleAnnouncementPin(id: string): Promise<Announcement | null> {
  const announcement = await getAnnouncementById(id);
  if (!announcement) return null;

  return updateAnnouncement(id, { isPinned: !announcement.isPinned });
}

// Toggle active status
export async function toggleAnnouncementActive(id: string): Promise<Announcement | null> {
  const announcement = await getAnnouncementById(id);
  if (!announcement) return null;

  return updateAnnouncement(id, { isActive: !announcement.isActive });
}

// Get announcement stats
export async function getAnnouncementStats() {
  const announcements = await getAllAnnouncements();
  const active = await getActiveAnnouncements();

  return {
    total: announcements.length,
    active: active.length,
    pinned: announcements.filter(a => a.isPinned).length,
    urgent: active.filter(a => a.priority === "urgent").length,
  };
}
