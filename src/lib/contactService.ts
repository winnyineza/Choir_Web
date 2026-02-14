// Contact Form Service - Store and manage contact form submissions

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete } from './supabaseDB';

const CONTACT_KEY = "choir_contact_submissions";

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  repliedAt?: string;
  notes?: string;
}

// Get all submissions
export async function getAllContactSubmissions(): Promise<ContactSubmission[]> {
  const data = await dbGetAll<ContactSubmission>(CONTACT_KEY);
  return data || [];
}

// Get unread count
export async function getUnreadCount(): Promise<number> {
  const submissions = await getAllContactSubmissions();
  return submissions.filter((s) => !s.isRead).length;
}

// Get submission by ID
export async function getContactSubmissionById(id: string): Promise<ContactSubmission | null> {
  return dbGetById<ContactSubmission>(CONTACT_KEY, id);
}

// Create submission
export async function createContactSubmission(
  data: Omit<ContactSubmission, "id" | "createdAt" | "isRead">
): Promise<ContactSubmission> {
  const newSubmission: Omit<ContactSubmission, "id" | "createdAt"> = {
    ...data,
    isRead: false,
  };

  return dbInsert<ContactSubmission>(CONTACT_KEY, newSubmission);
}

// Mark as read
export async function markAsRead(id: string): Promise<ContactSubmission | null> {
  try {
    return await dbUpdate<ContactSubmission>(CONTACT_KEY, id, { isRead: true });
  } catch {
    return null;
  }
}

// Mark as replied
export async function markAsReplied(id: string, notes?: string): Promise<ContactSubmission | null> {
  try {
    const updates: Partial<ContactSubmission> = {
      isRead: true,
      repliedAt: new Date().toISOString(),
    };
    if (notes) updates.notes = notes;
    return await dbUpdate<ContactSubmission>(CONTACT_KEY, id, updates);
  } catch {
    return null;
  }
}

// Delete submission
export async function deleteContactSubmission(id: string): Promise<boolean> {
  try {
    await dbDelete(CONTACT_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// Mark all as read
export async function markAllAsRead(): Promise<void> {
  const submissions = await getAllContactSubmissions();
  const unread = submissions.filter((s) => !s.isRead);
  for (const s of unread) {
    try {
      await dbUpdate<ContactSubmission>(CONTACT_KEY, s.id, { isRead: true });
    } catch {
      // continue
    }
  }
}

// Get stats
export async function getContactStats(): Promise<{
  total: number;
  unread: number;
  replied: number;
  thisWeek: number;
}> {
  const submissions = await getAllContactSubmissions();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    total: submissions.length,
    unread: submissions.filter((s) => !s.isRead).length,
    replied: submissions.filter((s) => s.repliedAt).length,
    thisWeek: submissions.filter((s) => new Date(s.createdAt).getTime() > weekAgo).length,
  };
}
