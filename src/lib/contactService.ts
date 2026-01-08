// Contact Form Service - Store and manage contact form submissions

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
export function getAllContactSubmissions(): ContactSubmission[] {
  const data = localStorage.getItem(CONTACT_KEY);
  return data ? JSON.parse(data) : [];
}

// Get unread count
export function getUnreadCount(): number {
  return getAllContactSubmissions().filter(s => !s.isRead).length;
}

// Get submission by ID
export function getContactSubmissionById(id: string): ContactSubmission | undefined {
  return getAllContactSubmissions().find(s => s.id === id);
}

// Create submission
export function createContactSubmission(
  data: Omit<ContactSubmission, "id" | "createdAt" | "isRead">
): ContactSubmission {
  const submissions = getAllContactSubmissions();
  
  const newSubmission: ContactSubmission = {
    ...data,
    id: `contact-${Date.now()}`,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  
  submissions.unshift(newSubmission); // Add to beginning (newest first)
  localStorage.setItem(CONTACT_KEY, JSON.stringify(submissions));
  
  return newSubmission;
}

// Mark as read
export function markAsRead(id: string): ContactSubmission | null {
  const submissions = getAllContactSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  submissions[index].isRead = true;
  localStorage.setItem(CONTACT_KEY, JSON.stringify(submissions));
  
  return submissions[index];
}

// Mark as replied
export function markAsReplied(id: string, notes?: string): ContactSubmission | null {
  const submissions = getAllContactSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  submissions[index].isRead = true;
  submissions[index].repliedAt = new Date().toISOString();
  if (notes) submissions[index].notes = notes;
  localStorage.setItem(CONTACT_KEY, JSON.stringify(submissions));
  
  return submissions[index];
}

// Delete submission
export function deleteContactSubmission(id: string): boolean {
  const submissions = getAllContactSubmissions();
  const filtered = submissions.filter(s => s.id !== id);
  
  if (filtered.length === submissions.length) return false;
  
  localStorage.setItem(CONTACT_KEY, JSON.stringify(filtered));
  return true;
}

// Mark all as read
export function markAllAsRead(): void {
  const submissions = getAllContactSubmissions();
  submissions.forEach(s => s.isRead = true);
  localStorage.setItem(CONTACT_KEY, JSON.stringify(submissions));
}

// Get stats
export function getContactStats() {
  const submissions = getAllContactSubmissions();
  return {
    total: submissions.length,
    unread: submissions.filter(s => !s.isRead).length,
    replied: submissions.filter(s => s.repliedAt).length,
    thisWeek: submissions.filter(s => {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(s.createdAt).getTime() > weekAgo;
    }).length,
  };
}

