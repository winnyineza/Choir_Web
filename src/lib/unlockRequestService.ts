// Unlock Request Service - Allow admins to request month unlocks for contributions/attendance
// Only main_admin and super_admin can approve/deny requests

import { dbGetAll, dbGetById, dbInsert, dbUpdate, generateId } from './supabaseDB';

const UNLOCK_REQUESTS_KEY = "choir_unlock_requests";

export type UnlockRequestType = "contributions" | "attendance" | "both";
export type UnlockRequestStatus = "pending" | "approved" | "denied" | "expired";

export interface UnlockRequest {
  id: string;
  requestedBy: string;      // Admin name
  requestedByRole: string;   // Admin role
  requestedById: string;     // Admin ID
  type: UnlockRequestType;   // What to unlock
  month: number;             // 1-12
  year: number;
  reason: string;
  status: UnlockRequestStatus;
  reviewedBy?: string;       // Who approved/denied
  reviewedAt?: string;       // When
  reviewNotes?: string;      // Approval/denial notes
  unlockedUntil?: string;    // Temporary unlock expiration (ISO date)
  createdAt: string;
}

function canReviewUnlockRequests(role?: string) {
  return role === "super_admin" || role === "main_admin";
}

// ============ CRUD ============

export async function getAllUnlockRequests(): Promise<UnlockRequest[]> {
  return dbGetAll<UnlockRequest>(UNLOCK_REQUESTS_KEY);
}

export async function getUnlockRequestById(id: string): Promise<UnlockRequest | undefined> {
  const req = await dbGetById<UnlockRequest>(UNLOCK_REQUESTS_KEY, id);
  return req || undefined;
}

export async function getPendingUnlockRequests(): Promise<UnlockRequest[]> {
  const all = await getAllUnlockRequests();
  return all.filter(r => r.status === "pending");
}

export async function getUnlockRequestsForMonth(month: number, year: number): Promise<UnlockRequest[]> {
  const all = await getAllUnlockRequests();
  return all.filter(r => r.month === month && r.year === year);
}

// ============ CREATE ============

export async function createUnlockRequest(data: {
  requestedBy: string;
  requestedByRole: string;
  requestedById: string;
  type: UnlockRequestType;
  month: number;
  year: number;
  reason: string;
}): Promise<UnlockRequest> {
  // Check for existing pending request for same month
  const existing = await getAllUnlockRequests();
  const duplicate = existing.find(
    r => r.month === data.month && r.year === data.year && r.status === "pending" && r.type === data.type
  );
  if (duplicate) {
    throw new Error(`A pending unlock request already exists for this month.`);
  }

  const request: UnlockRequest = {
    id: generateId(),
    ...data,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  return dbInsert<UnlockRequest>(UNLOCK_REQUESTS_KEY, request);
}

// ============ APPROVE / DENY ============

export async function approveUnlockRequest(
  id: string,
  reviewedBy: string,
  reviewedByRole?: string,
  reviewNotes?: string,
  daysToUnlock: number = 3
): Promise<UnlockRequest | null> {
  if (!canReviewUnlockRequests(reviewedByRole)) {
    throw new Error("Only Super Admin and Main Admin can approve unlock requests.");
  }

  const request = await getUnlockRequestById(id);
  if (!request || request.status !== "pending") return null;

  const unlockedUntil = new Date();
  unlockedUntil.setDate(unlockedUntil.getDate() + daysToUnlock);

  const updates: Partial<UnlockRequest> = {
    status: "approved",
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    reviewNotes: reviewNotes || `Approved - unlocked for ${daysToUnlock} days`,
    unlockedUntil: unlockedUntil.toISOString(),
  };

  return dbUpdate<UnlockRequest>(UNLOCK_REQUESTS_KEY, id, { ...request, ...updates });
}

export async function denyUnlockRequest(
  id: string,
  reviewedBy: string,
  reviewedByRole?: string,
  reviewNotes?: string
): Promise<UnlockRequest | null> {
  if (!canReviewUnlockRequests(reviewedByRole)) {
    throw new Error("Only Super Admin and Main Admin can deny unlock requests.");
  }

  const request = await getUnlockRequestById(id);
  if (!request || request.status !== "pending") return null;

  const updates: Partial<UnlockRequest> = {
    status: "denied",
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    reviewNotes: reviewNotes || "Denied",
  };

  return dbUpdate<UnlockRequest>(UNLOCK_REQUESTS_KEY, id, { ...request, ...updates });
}

// ============ CHECK IF MONTH IS TEMPORARILY UNLOCKED ============

export async function isMonthTemporarilyUnlocked(month: number, year: number, type?: UnlockRequestType): Promise<boolean> {
  const requests = await getUnlockRequestsForMonth(month, year);
  const now = new Date();

  return requests.some(r => {
    if (r.status !== "approved") return false;
    if (!r.unlockedUntil) return false;
    if (new Date(r.unlockedUntil) < now) return false; // Expired
    if (type && r.type !== "both" && r.type !== type) return false;
    return true;
  });
}
