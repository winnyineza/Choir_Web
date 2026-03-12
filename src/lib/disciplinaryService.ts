// Disciplinary Service - manages disciplinary records (Supabase-direct)

import { dbDelete, dbGetAll, dbGetById, dbInsert, dbUpdate, generateId } from './supabaseDB';

export interface DisciplinaryRecord {
  id: string;
  memberId: string;
  memberName: string;
  type: "warning" | "suspension" | "fine" | "probation" | "expulsion" | "commendation";
  severity: "minor" | "moderate" | "major";
  reason: string;
  description: string;
  date: string;
  expiryDate?: string;
  status: "active" | "resolved" | "appealed" | "expired" | "archived";
  fineAmount?: number;
  finePaidAmount?: number;
  fineDueDate?: string;
  actionTaken?: string;
  issuedBy: string;
  issuedByName: string;
  witnesses?: string[];
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  appealDate?: string;
  appealReason?: string;
  appealDecision?: "approved" | "denied" | "pending";
  attachments?: string[];
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DisciplinaryStats {
  total: number;
  active: number;
  resolved: number;
  warnings: number;
  suspensions: number;
  fines: number;
  commendations: number;
  byMember: { memberId: string; memberName: string; count: number }[];
}

const DISCIPLINARY_KEY = "choir_disciplinary_records";

export async function getAllDisciplinaryRecords(): Promise<DisciplinaryRecord[]> {
  const records = await dbGetAll<DisciplinaryRecord>(DISCIPLINARY_KEY);
  return records.filter((record) => record.status !== "archived");
}

export async function getDisciplinaryRecordById(id: string): Promise<DisciplinaryRecord | undefined> {
  const record = await dbGetById<DisciplinaryRecord>(DISCIPLINARY_KEY, id);
  return record || undefined;
}

export async function getDisciplinaryRecordsByMember(memberId: string): Promise<DisciplinaryRecord[]> {
  const all = await getAllDisciplinaryRecords();
  return all
    .filter(r => r.memberId === memberId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getActiveDisciplinaryRecords(): Promise<DisciplinaryRecord[]> {
  const now = new Date();
  const all = await getAllDisciplinaryRecords();
  return all.filter(r => {
    if (r.status !== "active") return false;
    if (r.expiryDate && new Date(r.expiryDate) < now) {
      updateDisciplinaryRecord(r.id, { status: "expired" });
      return false;
    }
    return true;
  });
}

export async function createDisciplinaryRecord(
  data: Omit<DisciplinaryRecord, "id" | "createdAt" | "status">
): Promise<DisciplinaryRecord> {
  const newRecord: DisciplinaryRecord = {
    ...data,
    id: generateId(),
    status: "active",
    createdAt: new Date().toISOString(),
  };
  return dbInsert<DisciplinaryRecord>(DISCIPLINARY_KEY, newRecord);
}

export async function updateDisciplinaryRecord(
  id: string,
  updates: Partial<DisciplinaryRecord>
): Promise<DisciplinaryRecord | null> {
  try {
    const existing = await dbGetById<DisciplinaryRecord>(DISCIPLINARY_KEY, id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return dbUpdate<DisciplinaryRecord>(DISCIPLINARY_KEY, id, updated);
  } catch {
    return null;
  }
}

export async function resolveDisciplinaryRecord(
  id: string,
  resolution: string,
  resolvedBy: string
): Promise<DisciplinaryRecord | null> {
  return updateDisciplinaryRecord(id, {
    status: "resolved",
    resolution,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  });
}

export async function fileAppeal(
  id: string,
  reason: string
): Promise<DisciplinaryRecord | null> {
  return updateDisciplinaryRecord(id, {
    status: "appealed",
    appealDate: new Date().toISOString(),
    appealReason: reason,
    appealDecision: "pending",
  });
}

export async function decideAppeal(
  id: string,
  decision: "approved" | "denied",
  resolvedBy: string
): Promise<DisciplinaryRecord | null> {
  const status = decision === "approved" ? "resolved" : "active";
  return updateDisciplinaryRecord(id, {
    status,
    appealDecision: decision,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  });
}

export async function deleteDisciplinaryRecord(id: string): Promise<boolean> {
  try {
    const record = await dbGetById<DisciplinaryRecord>(DISCIPLINARY_KEY, id);
    if (!record) return false;
    await dbDelete(DISCIPLINARY_KEY, id);
    return true;
  } catch {
    return false;
  }
}

export async function getOutstandingFineBalanceByMember(memberId: string): Promise<number> {
  const records = await getAllDisciplinaryRecords();
  return records
    .filter(r => r.memberId === memberId && r.type === "fine" && r.status !== "archived")
    .reduce((sum, record) => {
      const assessed = Math.max(0, record.fineAmount || 0);
      const paid = Math.max(0, record.finePaidAmount || 0);
      return sum + Math.max(0, assessed - paid);
    }, 0);
}

export async function getOutstandingFineBalanceTotal(): Promise<number> {
  const records = await getAllDisciplinaryRecords();
  return records
    .filter(r => r.type === "fine" && r.status !== "archived")
    .reduce((sum, record) => {
      const assessed = Math.max(0, record.fineAmount || 0);
      const paid = Math.max(0, record.finePaidAmount || 0);
      return sum + Math.max(0, assessed - paid);
    }, 0);
}

export async function getDisciplinaryStats(): Promise<DisciplinaryStats> {
  const records = await getAllDisciplinaryRecords();

  const memberCounts = new Map<string, { name: string; count: number }>();
  records.forEach(r => {
    const existing = memberCounts.get(r.memberId);
    if (existing) {
      existing.count++;
    } else {
      memberCounts.set(r.memberId, { name: r.memberName, count: 1 });
    }
  });

  return {
    total: records.length,
    active: records.filter(r => r.status === "active").length,
    resolved: records.filter(r => r.status === "resolved").length,
    warnings: records.filter(r => r.type === "warning").length,
    suspensions: records.filter(r => r.type === "suspension").length,
    fines: records.filter(r => r.type === "fine").length,
    commendations: records.filter(r => r.type === "commendation").length,
    byMember: Array.from(memberCounts.entries())
      .map(([memberId, data]) => ({ memberId, memberName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function memberHasActiveRecords(memberId: string): Promise<boolean> {
  const active = await getActiveDisciplinaryRecords();
  return active.some(r => r.memberId === memberId);
}

export async function getMemberDisciplinaryStatus(memberId: string): Promise<{
  hasActiveRecords: boolean;
  activeCount: number;
  totalCount: number;
  lastRecord?: DisciplinaryRecord;
}> {
  const records = await getDisciplinaryRecordsByMember(memberId);
  const activeRecords = records.filter(r => r.status === "active");

  return {
    hasActiveRecords: activeRecords.length > 0,
    activeCount: activeRecords.length,
    totalCount: records.length,
    lastRecord: records[0],
  };
}

export async function exportDisciplinaryToCSV(): Promise<string> {
  const records = await getAllDisciplinaryRecords();

  const headers = [
    "Date", "Member", "Type", "Severity", "Reason", "Description",
    "Status", "Action Taken", "Issued By", "Expiry Date", "Resolution",
  ];

  const rows = records.map(r => [
    new Date(r.date).toLocaleDateString(),
    r.memberName,
    r.type,
    r.severity,
    r.reason,
    r.description.replace(/,/g, ";"),
    r.status,
    r.actionTaken || "",
    r.issuedByName,
    r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "",
    r.resolution || "",
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
