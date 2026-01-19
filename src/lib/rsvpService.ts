import { addAuditLog, type AdminUser } from "./adminService";

export type RsvpStatus = "yes" | "no" | "maybe";

export interface RsvpEntry {
  id: string;
  eventId: string;
  memberId: string;
  status: RsvpStatus;
  updatedAt: string;
  note?: string;
}

const KEY = "serenades_rsvps";

function generateId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function getAll(): RsvpEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(list: RsvpEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function setRsvp(entry: Omit<RsvpEntry, "id" | "updatedAt">, actor?: AdminUser): RsvpEntry {
  const all = getAll();
  const existingIdx = all.findIndex(r => r.eventId === entry.eventId && r.memberId === entry.memberId);
  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    all[existingIdx] = { ...all[existingIdx], status: entry.status, note: entry.note, updatedAt: now };
  } else {
    all.push({ ...entry, id: generateId(), updatedAt: now });
  }
  saveAll(all);
  if (actor) addAuditLog(actor, "UPDATE_EVENT", `RSVP ${entry.status} for event ${entry.eventId} by ${entry.memberId}`);
  return existingIdx >= 0 ? all[existingIdx] : all[all.length - 1];
}

export function getRsvpsForEvent(eventId: string): RsvpEntry[] {
  return getAll().filter(r => r.eventId === eventId);
}

export function getRsvpStats(eventId: string) {
  const list = getRsvpsForEvent(eventId);
  return {
    yes: list.filter(r => r.status === "yes").length,
    no: list.filter(r => r.status === "no").length,
    maybe: list.filter(r => r.status === "maybe").length,
    total: list.length,
  };
}

export function clearRsvpsForEvent(eventId: string, actor?: AdminUser) {
  const remaining = getAll().filter(r => r.eventId !== eventId);
  saveAll(remaining);
  if (actor) addAuditLog(actor, "UPDATE_EVENT", `Cleared RSVPs for event ${eventId}`);
}

