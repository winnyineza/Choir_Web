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

// ============ STORAGE KEYS ============

const KEYS = {
  MEMBERS: "serenades_members",
  EVENTS: "serenades_events",
  GALLERY: "serenades_gallery",
  DONATIONS: "serenades_donations",
  SETTINGS: "serenades_settings",
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

// Get events available for ticket booking (upcoming, published, with available tickets)
export function getBookableEvents(): Event[] {
  const events = getAllEvents();
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  
  return events
    .filter((e) => {
      const eventDate = new Date(e.date);
      const isUpcoming = eventDate >= now;
      const isPublished = e.status !== "draft" && e.status !== "cancelled";
      const hasAvailableTickets = e.tickets.some((t) => t.available > (t.sold || 0));
      return isUpcoming && isPublished && hasAvailableTickets;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  return getFromStorage<Settings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
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
  // Note: Settings are preserved
}

