// Disciplinary Service - manages disciplinary records

import { syncItemToSupabase, deleteItemFromSupabase } from './supabaseSync';

export interface DisciplinaryRecord {
  id: string;
  memberId: string;
  memberName: string;
  type: "warning" | "suspension" | "fine" | "probation" | "expulsion" | "commendation";
  severity: "minor" | "moderate" | "major";
  reason: string;
  description: string;
  date: string;
  expiryDate?: string; // For warnings/suspensions that expire
  status: "active" | "resolved" | "appealed" | "expired";
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

function generateId(): string {
  return `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all disciplinary records
export function getAllDisciplinaryRecords(): DisciplinaryRecord[] {
  try {
    const stored = localStorage.getItem(DISCIPLINARY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save all records
function saveRecords(records: DisciplinaryRecord[]): void {
  localStorage.setItem(DISCIPLINARY_KEY, JSON.stringify(records));
}

// Get record by ID
export function getDisciplinaryRecordById(id: string): DisciplinaryRecord | undefined {
  return getAllDisciplinaryRecords().find(r => r.id === id);
}

// Get records by member
export function getDisciplinaryRecordsByMember(memberId: string): DisciplinaryRecord[] {
  return getAllDisciplinaryRecords()
    .filter(r => r.memberId === memberId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get active records
export function getActiveDisciplinaryRecords(): DisciplinaryRecord[] {
  const now = new Date();
  return getAllDisciplinaryRecords().filter(r => {
    if (r.status !== "active") return false;
    // Check if expired
    if (r.expiryDate && new Date(r.expiryDate) < now) {
      // Auto-expire
      updateDisciplinaryRecord(r.id, { status: "expired" });
      return false;
    }
    return true;
  });
}

// Create new record
export function createDisciplinaryRecord(
  data: Omit<DisciplinaryRecord, "id" | "createdAt" | "status">
): DisciplinaryRecord {
  const records = getAllDisciplinaryRecords();
  
  const newRecord: DisciplinaryRecord = {
    ...data,
    id: generateId(),
    status: "active",
    createdAt: new Date().toISOString(),
  };
  
  records.unshift(newRecord);
  saveRecords(records);
  syncItemToSupabase('choir_disciplinary_records', newRecord);
  return newRecord;
}

// Update record
export function updateDisciplinaryRecord(
  id: string,
  updates: Partial<DisciplinaryRecord>
): DisciplinaryRecord | null {
  const records = getAllDisciplinaryRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  records[index] = {
    ...records[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveRecords(records);
  return records[index];
}

// Resolve record
export function resolveDisciplinaryRecord(
  id: string,
  resolution: string,
  resolvedBy: string
): DisciplinaryRecord | null {
  return updateDisciplinaryRecord(id, {
    status: "resolved",
    resolution,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  });
}

// File appeal
export function fileAppeal(
  id: string,
  reason: string
): DisciplinaryRecord | null {
  return updateDisciplinaryRecord(id, {
    status: "appealed",
    appealDate: new Date().toISOString(),
    appealReason: reason,
    appealDecision: "pending",
  });
}

// Decide appeal
export function decideAppeal(
  id: string,
  decision: "approved" | "denied",
  resolvedBy: string
): DisciplinaryRecord | null {
  const status = decision === "approved" ? "resolved" : "active";
  return updateDisciplinaryRecord(id, {
    status,
    appealDecision: decision,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  });
}

// Delete record
export function deleteDisciplinaryRecord(id: string): boolean {
  const records = getAllDisciplinaryRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length === records.length) return false;
  saveRecords(filtered);
  return true;
}

// Get statistics
export function getDisciplinaryStats(): DisciplinaryStats {
  const records = getAllDisciplinaryRecords();
  
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

// Check if member has active disciplinary records
export function memberHasActiveRecords(memberId: string): boolean {
  return getActiveDisciplinaryRecords().some(r => r.memberId === memberId);
}

// Get member's disciplinary status
export function getMemberDisciplinaryStatus(memberId: string): {
  hasActiveRecords: boolean;
  activeCount: number;
  totalCount: number;
  lastRecord?: DisciplinaryRecord;
} {
  const records = getDisciplinaryRecordsByMember(memberId);
  const activeRecords = records.filter(r => r.status === "active");
  
  return {
    hasActiveRecords: activeRecords.length > 0,
    activeCount: activeRecords.length,
    totalCount: records.length,
    lastRecord: records[0],
  };
}

// Export to CSV
export function exportDisciplinaryToCSV(): string {
  const records = getAllDisciplinaryRecords();
  
  const headers = [
    "Date",
    "Member",
    "Type",
    "Severity",
    "Reason",
    "Description",
    "Status",
    "Action Taken",
    "Issued By",
    "Expiry Date",
    "Resolution",
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

