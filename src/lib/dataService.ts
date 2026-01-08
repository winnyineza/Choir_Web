// Data Service - localStorage-based data management for admin panel

// ============ TYPES ============

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  voice: "Soprano" | "Alto" | "Tenor" | "Bass";
  status: "Active" | "Pending" | "Inactive";
  joinedDate: string;
  photo?: string;
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
  livestreamUrl?: string; // YouTube live stream URL
  isLive?: boolean; // Whether the event is currently streaming
}

export interface EventTicket {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
  sold: number; // Track sold tickets
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
  albumName?: string; // For grouping photos into albums
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
  scannerPin: string; // PIN for event staff to access ticket scanner
}

// Event Staff - for ticket scanning at entrance
export interface EventStaff {
  id: string;
  name: string;
  nationalId: string; // National ID number
  phone: string;
  email?: string;
  status: "active" | "inactive";
  assignedEvents: string[]; // Array of event IDs they're assigned to
  createdAt: string;
  lastActiveAt?: string;
}

// Scan record - tracks who scanned each ticket
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

// ============ STORAGE KEYS ============

const KEYS = {
  MEMBERS: "serenades_members",
  EVENTS: "serenades_events",
  GALLERY: "serenades_gallery",
  DONATIONS: "serenades_donations",
  SETTINGS: "serenades_settings",
  EVENT_STAFF: "serenades_event_staff",
  SCAN_RECORDS: "serenades_scan_records",
};

// ============ HELPER FUNCTIONS ============

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ============ MEMBERS ============

export function getAllMembers(): Member[] {
  return getFromStorage<Member[]>(KEYS.MEMBERS, []);
}

export function addMember(member: Omit<Member, "id" | "joinedDate">): Member {
  const members = getAllMembers();
  const newMember: Member = {
    ...member,
    id: generateId(),
    joinedDate: new Date().toISOString(),
  };
  members.push(newMember);
  saveToStorage(KEYS.MEMBERS, members);
  return newMember;
}

export function updateMember(id: string, updates: Partial<Member>): Member | null {
  const members = getAllMembers();
  const index = members.findIndex((m) => m.id === id);
  if (index === -1) return null;
  members[index] = { ...members[index], ...updates };
  saveToStorage(KEYS.MEMBERS, members);
  return members[index];
}

export function deleteMember(id: string): boolean {
  const members = getAllMembers();
  const filtered = members.filter((m) => m.id !== id);
  if (filtered.length === members.length) return false;
  saveToStorage(KEYS.MEMBERS, filtered);
  return true;
}

export function getMemberStats() {
  const members = getAllMembers();
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

// ============ EVENTS ============

export function getAllEvents(): Event[] {
  return getFromStorage<Event[]>(KEYS.EVENTS, []);
}

export function getUpcomingEvents(): Event[] {
  const events = getAllEvents();
  const now = new Date();
  return events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function addEvent(event: Omit<Event, "id" | "createdAt">): Event {
  const events = getAllEvents();
  const newEvent: Event = {
    ...event,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  saveToStorage(KEYS.EVENTS, events);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<Event>): Event | null {
  const events = getAllEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  events[index] = { ...events[index], ...updates };
  saveToStorage(KEYS.EVENTS, events);
  return events[index];
}

export function deleteEvent(id: string): boolean {
  const events = getAllEvents();
  const filtered = events.filter((e) => e.id !== id);
  if (filtered.length === events.length) return false;
  saveToStorage(KEYS.EVENTS, filtered);
  return true;
}

export function getEventById(id: string): Event | undefined {
  const events = getAllEvents();
  return events.find((e) => e.id === id);
}

// Get events available for display on public site (upcoming, published)
// Note: Shows events even if sold out - UI will handle sold out display
export function getBookableEvents(): Event[] {
  const events = getAllEvents();
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  
  return events
    .filter((e) => {
      const eventDate = new Date(e.date);
      const isUpcoming = eventDate >= now;
      const isPublished = e.status !== "draft" && e.status !== "cancelled";
      return isUpcoming && isPublished;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Check if an event has any tickets available
export function hasAvailableTickets(event: Event): boolean {
  return event.tickets.some((t) => (t.available - (t.sold || 0)) > 0);
}

// Get available count for a specific tier
export function getAvailableCount(tier: EventTicket): number {
  return Math.max(0, tier.available - (tier.sold || 0));
}

// Check if a tier is sold out
export function isTierSoldOut(tier: EventTicket): boolean {
  return getAvailableCount(tier) === 0;
}

// Check if event is completely sold out
export function isEventSoldOut(event: Event): boolean {
  return !hasAvailableTickets(event);
}

// Reduce ticket availability when tickets are purchased
export function reduceTicketAvailability(
  eventId: string,
  ticketPurchases: { tierId: string; quantity: number }[]
): boolean {
  const events = getAllEvents();
  const eventIndex = events.findIndex((e) => e.id === eventId);
  
  if (eventIndex === -1) return false;
  
  const event = events[eventIndex];
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
    events[eventIndex] = event;
    saveToStorage(KEYS.EVENTS, events);
  }
  
  return updated;
}

// Check if tickets are available for purchase
export function checkTicketAvailability(
  eventId: string,
  ticketRequests: { tierId: string; quantity: number }[]
): { available: boolean; message: string } {
  const event = getEventById(eventId);
  
  if (!event) {
    return { available: false, message: "Event not found" };
  }
  
  const eventDate = new Date(event.date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (eventDate < now) {
    return { available: false, message: "This event has already passed" };
  }
  
  if (event.status === "cancelled") {
    return { available: false, message: "This event has been cancelled" };
  }
  
  for (const request of ticketRequests) {
    const ticket = event.tickets.find((t) => t.id === request.tierId);
    if (!ticket) {
      return { available: false, message: `Ticket tier not found: ${request.tierId}` };
    }
    
    const remaining = ticket.available - (ticket.sold || 0);
    if (remaining < request.quantity) {
      return {
        available: false,
        message: `Only ${remaining} ${ticket.name} ticket(s) remaining`,
      };
    }
    
    if (request.quantity > ticket.maxPerPerson) {
      return {
        available: false,
        message: `Maximum ${ticket.maxPerPerson} ${ticket.name} tickets per person`,
      };
    }
  }
  
  return { available: true, message: "Tickets available" };
}

// ============ GALLERY ============

export function getAllGalleryItems(): GalleryItem[] {
  return getFromStorage<GalleryItem[]>(KEYS.GALLERY, []);
}

export function getGalleryByType(type: "photo" | "video"): GalleryItem[] {
  return getAllGalleryItems().filter((item) => item.type === type);
}

export function addGalleryItem(item: Omit<GalleryItem, "id" | "uploadedAt">): GalleryItem {
  const gallery = getAllGalleryItems();
  const newItem: GalleryItem = {
    ...item,
    id: generateId(),
    uploadedAt: new Date().toISOString(),
  };
  gallery.push(newItem);
  saveToStorage(KEYS.GALLERY, gallery);
  return newItem;
}

export function deleteGalleryItem(id: string): boolean {
  const gallery = getAllGalleryItems();
  const filtered = gallery.filter((item) => item.id !== id);
  if (filtered.length === gallery.length) return false;
  saveToStorage(KEYS.GALLERY, filtered);
  return true;
}

// Get all unique albums from gallery
export function getGalleryAlbums(): { name: string; count: number; coverImage: string }[] {
  const gallery = getAllGalleryItems();
  const albumMap = new Map<string, { count: number; coverImage: string }>();
  
  gallery.forEach((item) => {
    if (item.type === "photo") {
      // Extract album name from category (format: "Category | AlbumName")
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

// Get gallery items by album name
export function getGalleryByAlbum(albumName: string): GalleryItem[] {
  const gallery = getAllGalleryItems();
  return gallery.filter((item) => {
    if (item.type !== "photo") return false;
    const parts = item.category.split(" | ");
    const itemAlbum = parts.length > 1 ? parts[1] : item.category;
    return itemAlbum === albumName;
  });
}

// ============ DONATIONS ============

export function getAllDonations(): Donation[] {
  return getFromStorage<Donation[]>(KEYS.DONATIONS, []);
}

export function addDonation(donation: Omit<Donation, "id" | "date">): Donation {
  const donations = getAllDonations();
  const newDonation: Donation = {
    ...donation,
    id: generateId(),
    date: new Date().toISOString(),
  };
  donations.push(newDonation);
  saveToStorage(KEYS.DONATIONS, donations);
  return newDonation;
}

export function confirmDonation(id: string): Donation | null {
  const donations = getAllDonations();
  const index = donations.findIndex((d) => d.id === id);
  if (index === -1) return null;
  donations[index].status = "confirmed";
  saveToStorage(KEYS.DONATIONS, donations);
  return donations[index];
}

export function getDonationStats() {
  const donations = getAllDonations();
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
  scannerPin: "2024", // Default PIN for event staff
};

export function getSettings(): Settings {
  const stored = getFromStorage<Partial<Settings>>(KEYS.SETTINGS, {});
  // Merge with defaults to ensure new fields get default values
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const settings = getSettings();
  const updated = { ...settings, ...updates };
  saveToStorage(KEYS.SETTINGS, updated);
  return updated;
}

// ============ DASHBOARD STATS ============

export function getDashboardStats() {
  const members = getAllMembers();
  const events = getUpcomingEvents();
  const donations = getDonationStats();
  
  // Get this month's new members
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
    donationChange: "+22%", // This would need historical data to calculate
  };
}

// ============ CLEAR ALL DATA ============

export function clearAllData(): void {
  localStorage.removeItem(KEYS.MEMBERS);
  localStorage.removeItem(KEYS.EVENTS);
  localStorage.removeItem(KEYS.GALLERY);
  localStorage.removeItem(KEYS.DONATIONS);
  localStorage.removeItem(KEYS.EVENT_STAFF);
  localStorage.removeItem(KEYS.SCAN_RECORDS);
  // Note: Settings are preserved
}

// ============ EVENT STAFF ============

export function getAllEventStaff(): EventStaff[] {
  return getFromStorage<EventStaff[]>(KEYS.EVENT_STAFF, []);
}

export function getEventStaffById(id: string): EventStaff | undefined {
  return getAllEventStaff().find((s) => s.id === id);
}

export function getEventStaffByNationalId(nationalId: string): EventStaff | undefined {
  return getAllEventStaff().find((s) => s.nationalId === nationalId);
}

export function getStaffForEvent(eventId: string): EventStaff[] {
  return getAllEventStaff().filter(
    (s) => s.status === "active" && s.assignedEvents.includes(eventId)
  );
}

export function addEventStaff(staff: Omit<EventStaff, "id" | "createdAt">): EventStaff {
  const allStaff = getAllEventStaff();
  const newStaff: EventStaff = {
    ...staff,
    id: `staff-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  saveToStorage(KEYS.EVENT_STAFF, [...allStaff, newStaff]);
  return newStaff;
}

export function updateEventStaff(id: string, updates: Partial<EventStaff>): EventStaff | null {
  const allStaff = getAllEventStaff();
  const index = allStaff.findIndex((s) => s.id === id);
  if (index === -1) return null;
  
  allStaff[index] = { ...allStaff[index], ...updates };
  saveToStorage(KEYS.EVENT_STAFF, allStaff);
  return allStaff[index];
}

export function deleteEventStaff(id: string): boolean {
  const allStaff = getAllEventStaff();
  const filtered = allStaff.filter((s) => s.id !== id);
  if (filtered.length === allStaff.length) return false;
  saveToStorage(KEYS.EVENT_STAFF, filtered);
  return true;
}

export function assignStaffToEvent(staffId: string, eventId: string): boolean {
  const staff = getEventStaffById(staffId);
  if (!staff) return false;
  
  if (!staff.assignedEvents.includes(eventId)) {
    staff.assignedEvents.push(eventId);
    updateEventStaff(staffId, { assignedEvents: staff.assignedEvents });
  }
  return true;
}

export function removeStaffFromEvent(staffId: string, eventId: string): boolean {
  const staff = getEventStaffById(staffId);
  if (!staff) return false;
  
  staff.assignedEvents = staff.assignedEvents.filter((id) => id !== eventId);
  updateEventStaff(staffId, { assignedEvents: staff.assignedEvents });
  return true;
}

// ============ SCAN RECORDS ============

export function getAllScanRecords(): ScanRecord[] {
  return getFromStorage<ScanRecord[]>(KEYS.SCAN_RECORDS, []);
}

export function getScanRecordsForEvent(eventId: string): ScanRecord[] {
  return getAllScanRecords().filter((r) => r.eventId === eventId);
}

export function getScanRecordsByStaff(staffId: string): ScanRecord[] {
  return getAllScanRecords().filter((r) => r.staffId === staffId);
}

export function addScanRecord(record: Omit<ScanRecord, "id" | "scannedAt">): ScanRecord {
  const allRecords = getAllScanRecords();
  const newRecord: ScanRecord = {
    ...record,
    id: `scan-${Date.now()}`,
    scannedAt: new Date().toISOString(),
  };
  saveToStorage(KEYS.SCAN_RECORDS, [...allRecords, newRecord]);
  return newRecord;
}

export function getScanRecordByOrderId(orderId: string): ScanRecord | undefined {
  return getAllScanRecords().find((r) => r.orderId === orderId);
}

// ============ EVENT STATUS HELPERS ============

export function isEventPast(event: Event): boolean {
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

export function getActiveEvents(): Event[] {
  return getAllEvents().filter((e) => !isEventPast(e) && e.status !== "cancelled");
}

export function getPastEvents(): Event[] {
  return getAllEvents().filter((e) => isEventPast(e));
}

