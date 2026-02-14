import { addAuditLog, type AdminUser } from "./adminService";
import { dbInsert, dbUpdate, dbDeleteWhere, dbQuery, generateId } from './supabaseDB';

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

export async function setRsvp(entry: Omit<RsvpEntry, "id" | "updatedAt">, actor?: AdminUser): Promise<RsvpEntry> {
  const all = await dbQuery<RsvpEntry>(KEY, 'event_id', entry.eventId);
  const existing = all.find(r => r.memberId === entry.memberId);
  const now = new Date().toISOString();

  if (existing) {
    const updated = await dbUpdate<RsvpEntry>(KEY, existing.id, { status: entry.status, note: entry.note, updatedAt: now });
    if (actor) await addAuditLog(actor, "UPDATE_EVENT", `RSVP ${entry.status} for event ${entry.eventId} by ${entry.memberId}`);
    return updated;
  } else {
    const newEntry = { ...entry, id: generateId(), updatedAt: now };
    const created = await dbInsert<RsvpEntry>(KEY, newEntry);
    if (actor) await addAuditLog(actor, "UPDATE_EVENT", `RSVP ${entry.status} for event ${entry.eventId} by ${entry.memberId}`);
    return created;
  }
}

export async function getRsvpsForEvent(eventId: string): Promise<RsvpEntry[]> {
  return dbQuery<RsvpEntry>(KEY, 'event_id', eventId);
}

export async function getRsvpStats(eventId: string): Promise<{
  yes: number;
  no: number;
  maybe: number;
  total: number;
}> {
  const list = await getRsvpsForEvent(eventId);
  return {
    yes: list.filter(r => r.status === "yes").length,
    no: list.filter(r => r.status === "no").length,
    maybe: list.filter(r => r.status === "maybe").length,
    total: list.length,
  };
}

export async function clearRsvpsForEvent(eventId: string, actor?: AdminUser): Promise<void> {
  await dbDeleteWhere(KEY, 'event_id', eventId);
  if (actor) await addAuditLog(actor, "UPDATE_EVENT", `Cleared RSVPs for event ${eventId}`);
}
