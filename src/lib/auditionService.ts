import { addAuditLog, type AdminUser } from "./adminService";
import { dbGetAll, dbInsert, dbUpdate, dbDelete, generateId } from './supabaseDB';

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

export async function getAllAuditions(): Promise<Audition[]> {
  const list = await dbGetAll<Audition>(KEY);
  return (list || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAudition(
  input: Omit<Audition, "id" | "createdAt" | "updatedAt">,
  actor?: AdminUser
): Promise<Audition> {
  const now = new Date().toISOString();
  const audition: Omit<Audition, "id"> = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const created = await dbInsert<Audition>(KEY, audition);
  if (actor) addAuditLog(actor, "CREATE", `Created audition for ${input.candidateName}`);
  return created;
}

export async function updateAudition(
  id: string,
  updates: Partial<Audition>,
  actor?: AdminUser
): Promise<Audition | null> {
  try {
    const updated = await dbUpdate<Audition>(KEY, id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    if (actor) addAuditLog(actor, "UPDATE", `Updated audition ${id}`);
    return updated;
  } catch {
    return null;
  }
}

export async function deleteAudition(id: string, actor?: AdminUser): Promise<void> {
  try {
    await dbDelete(KEY, id);
    if (actor) addAuditLog(actor, "DELETE", `Deleted audition ${id}`);
  } catch {
    // ignore
  }
}
