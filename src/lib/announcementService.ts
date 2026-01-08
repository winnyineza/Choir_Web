// Announcement Service - Manage announcements for members

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
export function getAllAnnouncements(): Announcement[] {
  const data = localStorage.getItem(ANNOUNCEMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

// Get active announcements (for display)
export function getActiveAnnouncements(audience: "all" | "members" | "admins" = "all"): Announcement[] {
  const now = new Date();
  return getAllAnnouncements()
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
export function getAnnouncementById(id: string): Announcement | undefined {
  return getAllAnnouncements().find(a => a.id === id);
}

// Create announcement
export function createAnnouncement(announcement: Omit<Announcement, "id" | "createdAt">): Announcement {
  const announcements = getAllAnnouncements();
  const newAnnouncement: Announcement = {
    ...announcement,
    id: `ann-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  
  announcements.push(newAnnouncement);
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  
  return newAnnouncement;
}

// Update announcement
export function updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
  const announcements = getAllAnnouncements();
  const index = announcements.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  announcements[index] = { ...announcements[index], ...updates };
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  
  return announcements[index];
}

// Delete announcement
export function deleteAnnouncement(id: string): boolean {
  const announcements = getAllAnnouncements();
  const filtered = announcements.filter(a => a.id !== id);
  
  if (filtered.length === announcements.length) return false;
  
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(filtered));
  return true;
}

// Toggle pin status
export function toggleAnnouncementPin(id: string): Announcement | null {
  const announcement = getAnnouncementById(id);
  if (!announcement) return null;
  
  return updateAnnouncement(id, { isPinned: !announcement.isPinned });
}

// Toggle active status
export function toggleAnnouncementActive(id: string): Announcement | null {
  const announcement = getAnnouncementById(id);
  if (!announcement) return null;
  
  return updateAnnouncement(id, { isActive: !announcement.isActive });
}

// Get announcement stats
export function getAnnouncementStats() {
  const announcements = getAllAnnouncements();
  const active = getActiveAnnouncements();
  
  return {
    total: announcements.length,
    active: active.length,
    pinned: announcements.filter(a => a.isPinned).length,
    urgent: active.filter(a => a.priority === "urgent").length,
  };
}

