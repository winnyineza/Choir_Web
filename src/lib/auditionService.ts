import { addAuditLog, type AdminUser } from "./adminService";

export type AuditionStatus = "scheduled" | "completed" | "accepted" | "rejected" | "waitlist";

export interface Audition {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  scheduledAt: string;
  panelists?: string[];
  notes?: string;
  rating?: number;
  recommendedVoice?: "Soprano" | "Alto" | "Tenor" | "Bass";
  status: AuditionStatus;
  createdAt: string;
  updatedAt: string;
}

const KEY = "serenades_auditions";

function generateId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function getAllInternal(): Audition[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(list: Audition[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAllAuditions(): Audition[] {
  return getAllInternal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createAudition(input: Omit<Audition, "id" | "createdAt" | "updatedAt">, actor?: AdminUser): Audition {
  const now = new Date().toISOString();
  const audition: Audition = { ...input, id: generateId(), createdAt: now, updatedAt: now };
  const list = getAllInternal();
  list.push(audition);
  saveAll(list);
  if (actor) addAuditLog(actor, "CREATE", `Created audition for ${input.candidateName}`);
  return audition;
}

export function updateAudition(id: string, updates: Partial<Audition>, actor?: AdminUser): Audition | null {
  const list = getAllInternal();
  const idx = list.findIndex(a => a.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  saveAll(list);
  if (actor) addAuditLog(actor, "UPDATE", `Updated audition ${id}`);
  return list[idx];
}

export function deleteAudition(id: string, actor?: AdminUser) {
  const list = getAllInternal().filter(a => a.id !== id);
  saveAll(list);
  if (actor) addAuditLog(actor, "DELETE", `Deleted audition ${id}`);
}

