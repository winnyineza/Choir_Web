// Data Service - Supabase-based data management (NO localStorage)

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, dbQuery, dbGetSettings, dbSaveSettings, generateId, supabase } from './supabaseDB';

// ============ TYPES ============

export interface EmergencyContact {
  name: string;
  relationship: "Spouse" | "Parent" | "Sibling" | "Child" | "Friend" | "Other";
  phone: string;
  altPhone?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  voice: "Soprano" | "Alto" | "Tenor" | "Bass";
  specialContributionClass?: "Class 1" | "Class 2" | "Class 3";
  status: "Active" | "Pending" | "Inactive";
  joinedDate: string;
  inviteStatus?: "not_invited" | "invited" | "accepted";
  photo?: string;
  dateOfBirth?: string;
  emergencyContact?: EmergencyContact;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: "Concert" | "Revival" | "Workshop" | "Fellowship" | "Other";
  image?: string;
  isFree: boolean;
  tickets: EventTicket[];
  createdAt: string;
  status?: "draft" | "published" | "cancelled";
  livestreamUrl?: string;
  isLive?: boolean;
}

export interface EventTicket {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
  sold: number;
  maxPerPerson: number;
  perks?: string[];
}

export interface GalleryItem {
  id: string;
  type: "photo" | "video";
  title: string;
  url: string;
  thumbnail?: string;
  category: string;
  albumName?: string;
  uploadedAt: string;
}

export interface Donation {
  id: string;
  name: string;
  email: string;
  amount: number;
  method: "momo" | "bank";
  message?: string;
  date: string;
  status: "pending" | "confirmed";
}

export interface Settings {
  choirName: string;
  email: string;
  phone: string;
  address: string;
  momoNumber: string;
  bankAccount: string;
  bankName: string;
  memberPortalPin: string;
  scannerPin: string;
  contributionLockDay: number; // Day of the next month when previous month locks (1-28, default 5)
  contributionCurrentMonthDueDay: number; // Day within the current month before it becomes overdue (1-28, default 10)
  contributionOverdueReminderIntervalDays: number; // Minimum days between overdue reminder emails for the same member
}

export interface EventStaff {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  email?: string;
  status: "active" | "inactive";
  assignedEvents: string[];
  createdAt: string;
  lastActiveAt?: string;
}

export interface ScanRecord {
  id: string;
  orderId: string;
  txRef: string;
  staffId: string;
  staffName: string;
  staffNationalId: string;
  eventId: string;
  scannedAt: string;
  ticketCount: number;
}

// ============ STORAGE KEYS (for supabaseDB config lookup) ============

const KEYS = {
  MEMBERS: "serenades_members",
  EVENTS: "serenades_events",
  GALLERY: "serenades_gallery",
  DONATIONS: "serenades_donations",
  SETTINGS: "serenades_settings",
  EVENT_STAFF: "serenades_event_staff",
  SCAN_RECORDS: "serenades_scan_records",
};

// ============ MEMBERS ============

export async function getAllMembers(): Promise<Member[]> {
  return dbGetAll<Member>(KEYS.MEMBERS);
}

export async function getMemberById(id: string): Promise<Member | null> {
  return dbGetById<Member>(KEYS.MEMBERS, id);
}

export async function addMember(member: Omit<Member, "id" | "joinedDate">): Promise<Member> {
  const newMember: Member = {
    ...member,
    id: generateId(),
    joinedDate: new Date().toISOString(),
    inviteStatus: "not_invited",
  };
  return dbInsert<Member>(KEYS.MEMBERS, newMember);
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  try {
    const existing = await dbGetById<Member>(KEYS.MEMBERS, id);
    if (!existing) return null;
    return dbUpdate<Member>(KEYS.MEMBERS, id, { ...existing, ...updates });
  } catch {
    return null;
  }
}

export async function deleteMember(id: string): Promise<boolean> {
  try {
    await dbDelete(KEYS.MEMBERS, id);
    return true;
  } catch {
    return false;
  }
}

export async function getMemberStats() {
  const members = await getAllMembers();
  return {
    total: members.length,
    active: members.filter((m) => m.status === "Active").length,
    pending: members.filter((m) => m.status === "Pending").length,
    byVoice: {
      soprano: members.filter((m) => m.voice === "Soprano").length,
      alto: members.filter((m) => m.voice === "Alto").length,
      tenor: members.filter((m) => m.voice === "Tenor").length,
      bass: members.filter((m) => m.voice === "Bass").length,
    },
  };
}

// ============ BIRTHDAYS ============

export async function getTodaysBirthdays(): Promise<Member[]> {
  const members = await getAllMembers();
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  return members.filter(m => {
    if (!m.dateOfBirth || m.status !== "Active") return false;
    const [, month, day] = m.dateOfBirth.split('-').map(Number);
    return month === todayMonth && day === todayDay;
  });
}

export async function getUpcomingBirthdays(days: number = 7): Promise<{ member: Member; daysUntil: number; date: string }[]> {
  const members = await getAllMembers();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBirthdays: { member: Member; daysUntil: number; date: string }[] = [];

  members.forEach(m => {
    if (!m.dateOfBirth || m.status !== "Active") return;

    const [, month, day] = m.dateOfBirth.split('-').map(Number);
    let birthday = new Date(today.getFullYear(), month - 1, day);
    birthday.setHours(0, 0, 0, 0);

    if (birthday < today) {
      birthday = new Date(today.getFullYear() + 1, month - 1, day);
    }

    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= days) {
      upcomingBirthdays.push({
        member: m,
        daysUntil: diffDays,
        date: birthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
  });

  return upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function getMemberAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ============ EVENTS ============

export async function getAllEvents(): Promise<Event[]> {
  return dbGetAll<Event>(KEYS.EVENTS);
}

export async function getUpcomingEvents(): Promise<Event[]> {
  const events = await getAllEvents();
  const now = new Date();
  return events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function addEvent(event: Omit<Event, "id" | "createdAt">): Promise<Event> {
  const newEvent: Event = {
    ...event,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  return dbInsert<Event>(KEYS.EVENTS, newEvent);
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
  try {
    const existing = await dbGetById<Event>(KEYS.EVENTS, id);
    if (!existing) return null;
    return dbUpdate<Event>(KEYS.EVENTS, id, { ...existing, ...updates });
  } catch {
    return null;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await dbDelete(KEYS.EVENTS, id);
    return true;
  } catch {
    return false;
  }
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const event = await dbGetById<Event>(KEYS.EVENTS, id);
  return event || undefined;
}

export async function getBookableEvents(): Promise<Event[]> {
  const events = await getAllEvents();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return events
    .filter((e) => {
      const eventDate = new Date(e.date);
      const isUpcoming = eventDate >= now;
      const isPublished = e.status !== "draft" && e.status !== "cancelled";
      return isUpcoming && isPublished;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Pure helpers (no async needed - operate on passed data)
export function hasAvailableTickets(event: Event): boolean {
  return event.tickets.some((t) => (t.available - (t.sold || 0)) > 0);
}

export function getAvailableCount(tier: EventTicket): number {
  return Math.max(0, tier.available - (tier.sold || 0));
}

export function isTierSoldOut(tier: EventTicket): boolean {
  return getAvailableCount(tier) === 0;
}

export function isEventSoldOut(event: Event): boolean {
  return !hasAvailableTickets(event);
}

export async function reduceTicketAvailability(
  eventId: string,
  ticketPurchases: { tierId: string; quantity: number }[]
): Promise<boolean> {
  const event = await getEventById(eventId);
  if (!event) return false;

  let updated = false;
  for (const purchase of ticketPurchases) {
    const ticketIndex = event.tickets.findIndex((t) => t.id === purchase.tierId);
    if (ticketIndex !== -1) {
      const ticket = event.tickets[ticketIndex];
      const currentSold = ticket.sold || 0;
      const remaining = ticket.available - currentSold;

      if (remaining >= purchase.quantity) {
        event.tickets[ticketIndex].sold = currentSold + purchase.quantity;
        updated = true;
      }
    }
  }

  if (updated) {
    await updateEvent(eventId, { tickets: event.tickets });
  }
  return updated;
}

export async function checkTicketAvailability(
  eventId: string,
  ticketRequests: { tierId: string; quantity: number }[]
): Promise<{ available: boolean; message: string }> {
  const event = await getEventById(eventId);
  if (!event) return { available: false, message: "Event not found" };

  const eventDate = new Date(event.date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (eventDate < now) return { available: false, message: "This event has already passed" };
  if (event.status === "cancelled") return { available: false, message: "This event has been cancelled" };

  for (const request of ticketRequests) {
    const ticket = event.tickets.find((t) => t.id === request.tierId);
    if (!ticket) return { available: false, message: `Ticket tier not found: ${request.tierId}` };

    const remaining = ticket.available - (ticket.sold || 0);
    if (remaining < request.quantity) {
      return { available: false, message: `Only ${remaining} ${ticket.name} ticket(s) remaining` };
    }
    if (request.quantity > ticket.maxPerPerson) {
      return { available: false, message: `Maximum ${ticket.maxPerPerson} ${ticket.name} tickets per person` };
    }
  }

  return { available: true, message: "Tickets available" };
}

// ============ GALLERY ============

export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  return dbGetAll<GalleryItem>(KEYS.GALLERY);
}

export async function getGalleryByType(type: "photo" | "video"): Promise<GalleryItem[]> {
  const items = await getAllGalleryItems();
  return items.filter((item) => item.type === type);
}

export async function addGalleryItem(item: Omit<GalleryItem, "id" | "uploadedAt">): Promise<GalleryItem> {
  const newItem: GalleryItem = {
    ...item,
    id: generateId(),
    uploadedAt: new Date().toISOString(),
  };
  return dbInsert<GalleryItem>(KEYS.GALLERY, newItem);
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  try {
    await dbDelete(KEYS.GALLERY, id);
    return true;
  } catch {
    return false;
  }
}

export async function getGalleryAlbums(): Promise<{ name: string; count: number; coverImage: string }[]> {
  const gallery = await getAllGalleryItems();
  const albumMap = new Map<string, { count: number; coverImage: string }>();

  gallery.forEach((item) => {
    if (item.type === "photo") {
      const parts = item.category.split(" | ");
      const albumName = parts.length > 1 ? parts[1] : item.category;

      if (!albumMap.has(albumName)) {
        albumMap.set(albumName, { count: 0, coverImage: item.url });
      }
      const album = albumMap.get(albumName)!;
      album.count++;
    }
  });

  return Array.from(albumMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    coverImage: data.coverImage,
  }));
}

export async function getGalleryByAlbum(albumName: string): Promise<GalleryItem[]> {
  const gallery = await getAllGalleryItems();
  return gallery.filter((item) => {
    if (item.type !== "photo") return false;
    const parts = item.category.split(" | ");
    const itemAlbum = parts.length > 1 ? parts[1] : item.category;
    return itemAlbum === albumName;
  });
}

// ============ DONATIONS ============

export async function getAllDonations(): Promise<Donation[]> {
  return dbGetAll<Donation>(KEYS.DONATIONS);
}

export async function addDonation(donation: Omit<Donation, "id" | "date">): Promise<Donation> {
  const newDonation: Donation = {
    ...donation,
    id: generateId(),
    date: new Date().toISOString(),
  };
  return dbInsert<Donation>(KEYS.DONATIONS, newDonation);
}

export async function confirmDonation(id: string): Promise<Donation | null> {
  try {
    return dbUpdate<Donation>(KEYS.DONATIONS, id, { status: "confirmed" } as any);
  } catch {
    return null;
  }
}

export async function getDonationStats() {
  const donations = await getAllDonations();
  const confirmed = donations.filter((d) => d.status === "confirmed");
  return {
    total: donations.length,
    confirmed: confirmed.length,
    pending: donations.filter((d) => d.status === "pending").length,
    totalAmount: confirmed.reduce((sum, d) => sum + d.amount, 0),
  };
}

// ============ SETTINGS ============

const DEFAULT_SETTINGS: Settings = {
  choirName: "The Serenades of Praise Choir",
  email: "theserenadeschoir@gmail.com",
  phone: "+250 780 623 144",
  address: "Kacyiru SDA Church, Kigali, Rwanda",
  momoNumber: "0780623144",
  bankAccount: "",
  bankName: "",
  memberPortalPin: "2024",
  scannerPin: "2024",
  contributionLockDay: 5,
  contributionCurrentMonthDueDay: 10,
  contributionOverdueReminderIntervalDays: 7,
};

export async function getSettings(): Promise<Settings> {
  return dbGetSettings<Settings>(DEFAULT_SETTINGS);
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await dbSaveSettings(updated);
  return updated;
}

// ============ DASHBOARD STATS ============

export async function getDashboardStats() {
  const members = await getAllMembers();
  const events = await getUpcomingEvents();
  const donations = await getDonationStats();

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const newMembersThisMonth = members.filter(
    (m) => new Date(m.joinedDate) >= thisMonth
  ).length;

  return {
    totalMembers: members.length,
    newMembersThisMonth,
    upcomingEvents: events.length,
    nextEvent: events[0]?.date ? new Date(events[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None",
    totalDonations: donations.totalAmount,
    donationChange: "+22%",
  };
}

// ============ CLEAR ALL DATA ============

export async function clearAllData(): Promise<void> {
  // Delete all rows from core tables
  const tables = ['members', 'events', 'gallery_items', 'donations', 'event_staff', 'scan_records'];
  for (const table of tables) {
    await supabase.from(table).delete().neq('id', '');
  }
}

// ============ EVENT STAFF ============

export async function getAllEventStaff(): Promise<EventStaff[]> {
  return dbGetAll<EventStaff>(KEYS.EVENT_STAFF);
}

export async function getEventStaffById(id: string): Promise<EventStaff | undefined> {
  const staff = await dbGetById<EventStaff>(KEYS.EVENT_STAFF, id);
  return staff || undefined;
}

export async function getEventStaffByNationalId(nationalId: string): Promise<EventStaff | undefined> {
  const allStaff = await getAllEventStaff();
  return allStaff.find((s) => s.nationalId === nationalId);
}

export async function getStaffForEvent(eventId: string): Promise<EventStaff[]> {
  const allStaff = await getAllEventStaff();
  return allStaff.filter(
    (s) => s.status === "active" && s.assignedEvents.includes(eventId)
  );
}

export async function addEventStaff(staff: Omit<EventStaff, "id" | "createdAt">): Promise<EventStaff> {
  const newStaff: EventStaff = {
    ...staff,
    id: `staff-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return dbInsert<EventStaff>(KEYS.EVENT_STAFF, newStaff);
}

export async function updateEventStaff(id: string, updates: Partial<EventStaff>): Promise<EventStaff | null> {
  try {
    const existing = await dbGetById<EventStaff>(KEYS.EVENT_STAFF, id);
    if (!existing) return null;
    return dbUpdate<EventStaff>(KEYS.EVENT_STAFF, id, { ...existing, ...updates });
  } catch {
    return null;
  }
}

export async function deleteEventStaff(id: string): Promise<boolean> {
  try {
    await dbDelete(KEYS.EVENT_STAFF, id);
    return true;
  } catch {
    return false;
  }
}

export async function assignStaffToEvent(staffId: string, eventId: string): Promise<boolean> {
  const staff = await getEventStaffById(staffId);
  if (!staff) return false;
  if (!staff.assignedEvents.includes(eventId)) {
    staff.assignedEvents.push(eventId);
    await updateEventStaff(staffId, { assignedEvents: staff.assignedEvents });
  }
  return true;
}

export async function removeStaffFromEvent(staffId: string, eventId: string): Promise<boolean> {
  const staff = await getEventStaffById(staffId);
  if (!staff) return false;
  staff.assignedEvents = staff.assignedEvents.filter((id) => id !== eventId);
  await updateEventStaff(staffId, { assignedEvents: staff.assignedEvents });
  return true;
}

// ============ SCAN RECORDS ============

export async function getAllScanRecords(): Promise<ScanRecord[]> {
  return dbGetAll<ScanRecord>(KEYS.SCAN_RECORDS);
}

export async function getScanRecordsForEvent(eventId: string): Promise<ScanRecord[]> {
  const records = await getAllScanRecords();
  return records.filter((r) => r.eventId === eventId);
}

export async function getScanRecordsByStaff(staffId: string): Promise<ScanRecord[]> {
  const records = await getAllScanRecords();
  return records.filter((r) => r.staffId === staffId);
}

export async function addScanRecord(record: Omit<ScanRecord, "id" | "scannedAt">): Promise<ScanRecord> {
  const newRecord: ScanRecord = {
    ...record,
    id: `scan-${Date.now()}`,
    scannedAt: new Date().toISOString(),
  };
  return dbInsert<ScanRecord>(KEYS.SCAN_RECORDS, newRecord);
}

export async function getScanRecordByOrderId(orderId: string): Promise<ScanRecord | undefined> {
  const records = await getAllScanRecords();
  return records.find((r) => r.orderId === orderId);
}

// ============ EVENT STATUS HELPERS ============

export function isEventPast(event: Event): boolean {
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

export async function getActiveEvents(): Promise<Event[]> {
  const events = await getAllEvents();
  return events.filter((e) => !isEventPast(e) && e.status !== "cancelled");
}

export async function getPastEvents(): Promise<Event[]> {
  const events = await getAllEvents();
  return events.filter((e) => isEventPast(e));
}
