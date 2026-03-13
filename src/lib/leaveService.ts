// Leave Request Service - Manages member leave requests (Supabase)

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, dbQuery, dbDeleteWhere, invalidateCache, supabase } from './supabaseDB';
import { getAllMembers, getSettings } from './dataService';

// Approval vote from an admin
export interface ApprovalVote {
  adminId: string;
  adminName: string;
  vote: 'approve' | 'deny';
  votedAt: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'partial' | 'approved' | 'denied';
  // Multi-approval tracking
  votes: ApprovalVote[];
  approvalCount: number;
  denialCount: number;
  // Legacy fields (for backward compatibility)
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface VerificationCode {
  id?: string;
  leaveId?: string;
  approverId?: string;
  email: string;
  code: string;
  expiresAt: number;
  used: boolean;
}

export function generateLeaveRequestId(): string {
  return `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Constants for approval rules
export const REQUIRED_APPROVALS = 3;
export const REQUIRED_DENIALS = 2;
export const MINIMUM_NOTICE_DAYS = 2;

const LEAVE_REQUESTS_KEY = 'choir_leave_requests';
const VERIFICATION_CODES_KEY = 'choir_verification_codes';
const VERIFICATION_SCHEMA_MODE_KEY = 'leave_verification_schema_mode';

type VerificationSchemaMode = 'modern' | 'legacy';

function getDefaultVerificationSchemaMode(): VerificationSchemaMode {
  if (typeof window === 'undefined') {
    return 'modern';
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' ? 'modern' : 'legacy';
}

function getPreferredVerificationSchemaMode(): VerificationSchemaMode {
  if (typeof window === 'undefined') {
    return 'modern';
  }

  const storedMode = window.localStorage.getItem(VERIFICATION_SCHEMA_MODE_KEY);
  return storedMode === 'legacy' || storedMode === 'modern'
    ? storedMode
    : getDefaultVerificationSchemaMode();
}

function setPreferredVerificationSchemaMode(mode: VerificationSchemaMode): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(VERIFICATION_SCHEMA_MODE_KEY, mode);
}

function isLegacySchemaError(error: any): boolean {
  const message = (error?.message || '').toLowerCase();
  return message.includes('approver_id') && message.includes('not-null');
}

function isModernSchemaError(error: any): boolean {
  const message = (error?.message || '').toLowerCase();
  return message.includes('approver_id') && (message.includes('schema cache') || message.includes('column'));
}

async function insertVerificationCodeModern(newCode: VerificationCode & { id: string }): Promise<void> {
  await dbInsert(VERIFICATION_CODES_KEY, newCode);
}

async function insertVerificationCodeLegacy(newCode: VerificationCode & { id: string }, normalizedEmail: string, normalizedLeaveId: string): Promise<void> {
  const { error } = await supabase
    .from('leave_verification_codes')
    .insert({
      id: newCode.id,
      leave_id: normalizedLeaveId,
      approver_id: normalizedEmail,
      email: normalizedEmail,
      code: newCode.code,
      expires_at: new Date(newCode.expiresAt).toISOString(),
      used: false,
    });

  if (error) {
    throw error;
  }

  invalidateCache(VERIFICATION_CODES_KEY);
}

// PIN Verification - gets PIN from settings (configurable in admin)
export async function verifyPortalPin(pin: string): Promise<boolean> {
  const settings = await getSettings();
  return pin === settings.memberPortalPin;
}

// Leave Request CRUD
export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  const [requests, members] = await Promise.all([
    dbGetAll<LeaveRequest>(LEAVE_REQUESTS_KEY),
    getAllMembers(),
  ]);

  return requests.map((request) => {
    if (request.memberName?.trim()) {
      return request;
    }

    const matchingMember = members.find((member) => {
      if (request.memberId && member.id === request.memberId) {
        return true;
      }

      return Boolean(request.memberEmail) && member.email?.toLowerCase() === request.memberEmail.toLowerCase();
    });

    return {
      ...request,
      memberName: matchingMember?.name || request.memberEmail?.split('@')[0] || 'Unknown Member',
      memberEmail: request.memberEmail || matchingMember?.email || '',
    };
  });
}

export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  const requests = await getAllLeaveRequests();
  return requests.filter(r => r.status === 'pending' || r.status === 'partial');
}

export async function getApprovedLeaveRequests(): Promise<LeaveRequest[]> {
  const requests = await getAllLeaveRequests();
  return requests.filter(r => r.status === 'approved');
}

export async function getPartiallyApprovedRequests(): Promise<LeaveRequest[]> {
  const requests = await getAllLeaveRequests();
  return requests.filter(r => r.status === 'partial');
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequest | undefined> {
  const request = await dbGetById<LeaveRequest>(LEAVE_REQUESTS_KEY, id);
  return request ?? undefined;
}

export async function getLeaveRequestsByMember(memberId: string): Promise<LeaveRequest[]> {
  const requests = await getAllLeaveRequests();
  return requests.filter(r => r.memberId === memberId);
}

export async function getLeaveRequestsByEmail(email: string): Promise<LeaveRequest[]> {
  const requests = await getAllLeaveRequests();
  return requests.filter(r => r.memberEmail.toLowerCase() === email.toLowerCase());
}

// Check if a member has approved leave for a specific date
export async function hasApprovedLeaveForDate(memberId: string, date: string): Promise<boolean> {
  const approvedRequests = (await getApprovedLeaveRequests()).filter(r => r.memberId === memberId);
  const checkDate = new Date(date);

  return approvedRequests.some(request => {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    return checkDate >= startDate && checkDate <= endDate;
  });
}

// Get all members with approved leave for a specific date
export async function getMembersOnLeaveForDate(date: string): Promise<LeaveRequest[]> {
  const approvedRequests = await getApprovedLeaveRequests();
  const checkDate = new Date(date);

  return approvedRequests.filter(request => {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    return checkDate >= startDate && checkDate <= endDate;
  });
}

// Validate minimum notice period (2 days) - pure helper, stays sync
export function validateLeaveRequestDate(startDate: string): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + MINIMUM_NOTICE_DAYS);

  if (start < minDate) {
    const minDateStr = minDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    return {
      valid: false,
      error: `Leave requests must be submitted at least ${MINIMUM_NOTICE_DAYS} days in advance. Earliest available date: ${minDateStr}`,
    };
  }

  return { valid: true };
}

export async function createLeaveRequest(
  request: Omit<LeaveRequest, 'status' | 'createdAt' | 'votes' | 'approvalCount' | 'denialCount'>
): Promise<LeaveRequest | { error: string }> {
  const validation = validateLeaveRequestDate(request.startDate);
  if (!validation.valid) {
    return { error: validation.error! };
  }

  const newRequest: LeaveRequest = {
    ...request,
    id: request.id || generateLeaveRequestId(),
    status: 'pending',
    votes: [],
    approvalCount: 0,
    denialCount: 0,
    createdAt: new Date().toISOString(),
  };

  return dbInsert<LeaveRequest>(LEAVE_REQUESTS_KEY, newRequest);
}

// Check if an admin has already voted on a request - pure helper, stays sync
export function hasAdminVoted(request: LeaveRequest, adminId: string): boolean {
  return request.votes?.some(v => v.adminId === adminId) || false;
}

// Get approval progress for display - pure helper, stays sync
export function getApprovalProgress(request: LeaveRequest): {
  approvals: number;
  denials: number;
  required: number;
  requiredDenials: number;
  status: string;
} {
  return {
    approvals: request.approvalCount || 0,
    denials: request.denialCount || 0,
    required: REQUIRED_APPROVALS,
    requiredDenials: REQUIRED_DENIALS,
    status: request.status,
  };
}

// Cast a vote (approve or deny) on a leave request
export async function castVote(
  id: string,
  adminId: string,
  adminName: string,
  vote: 'approve' | 'deny',
  notes?: string
): Promise<LeaveRequest | { error: string } | null> {
  const request = await getLeaveRequestById(id);
  if (!request) return null;

  if (request.status === 'approved' || request.status === 'denied') {
    return { error: 'This leave request has already been finalized.' };
  }

  let votes = request.votes || [];
  let approvalCount = request.approvalCount || 0;
  let denialCount = request.denialCount || 0;

  if (hasAdminVoted(request, adminId)) {
    return { error: 'You have already voted on this leave request.' };
  }

  const newVote: ApprovalVote = {
    adminId,
    adminName,
    vote,
    votedAt: new Date().toISOString(),
    notes,
  };
  votes = [...votes, newVote];

  if (vote === 'approve') {
    approvalCount += 1;
  } else {
    denialCount += 1;
  }

  let newStatus = request.status;
  let reviewedAt = request.reviewedAt;

  if (denialCount >= REQUIRED_DENIALS) {
    newStatus = 'denied';
    reviewedAt = new Date().toISOString();
  } else if (approvalCount >= REQUIRED_APPROVALS) {
    newStatus = 'approved';
    reviewedAt = new Date().toISOString();
  } else if (approvalCount > 0) {
    newStatus = 'partial';
  }

  try {
    return dbUpdate<LeaveRequest>(LEAVE_REQUESTS_KEY, id, {
      votes,
      approvalCount,
      denialCount,
      status: newStatus,
      reviewedAt,
    });
  } catch {
    return null;
  }
}

// Legacy functions for backward compatibility (now use castVote internally)
export async function approveLeaveRequest(
  id: string,
  adminId: string,
  adminName: string,
  notes?: string
): Promise<LeaveRequest | { error: string } | null> {
  return castVote(id, adminId, adminName, 'approve', notes);
}

export async function denyLeaveRequest(
  id: string,
  adminId: string,
  adminName: string,
  notes?: string
): Promise<LeaveRequest | { error: string } | null> {
  return castVote(id, adminId, adminName, 'deny', notes);
}

export async function deleteLeaveRequest(id: string): Promise<boolean> {
  try {
    // Clean up any linked verification codes first so older DB schemas
    // or stricter foreign-key setups do not block the leave deletion.
    await dbDeleteWhere(VERIFICATION_CODES_KEY, 'leave_id', id);
    await dbDelete(LEAVE_REQUESTS_KEY, id);
    return true;
  } catch (error) {
    console.error("[Leave] Failed to delete leave request:", error);
    return false;
  }
}

// Verification Code Management
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeVerificationCode(email: string, code: string, leaveId: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedLeaveId = typeof leaveId === 'string' && leaveId.trim()
    ? leaveId.trim()
    : generateLeaveRequestId();

  await dbDeleteWhere(VERIFICATION_CODES_KEY, 'email', normalizedEmail);

  const newCode: VerificationCode & { id: string } = {
    id: crypto.randomUUID(),
    leaveId: normalizedLeaveId,
    approverId: normalizedEmail,
    email: normalizedEmail,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    used: false,
  };

  const preferredMode = getPreferredVerificationSchemaMode();

  try {
    if (preferredMode === 'legacy') {
      await insertVerificationCodeLegacy(newCode, normalizedEmail, normalizedLeaveId);
      setPreferredVerificationSchemaMode('legacy');
      return;
    }

    await insertVerificationCodeModern(newCode);
    setPreferredVerificationSchemaMode('modern');
  } catch (error: any) {
    if (preferredMode === 'legacy' && isModernSchemaError(error)) {
      await insertVerificationCodeModern(newCode);
      setPreferredVerificationSchemaMode('modern');
      return;
    }

    if (preferredMode === 'modern' && isLegacySchemaError(error)) {
      await insertVerificationCodeLegacy(newCode, normalizedEmail, normalizedLeaveId);
      setPreferredVerificationSchemaMode('legacy');
      return;
    }

    throw error;
  }
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const codes = await dbQuery<VerificationCode & { id: string }>(
    VERIFICATION_CODES_KEY,
    'email',
    email.toLowerCase()
  );

  const storedCode = codes.find(
    c =>
      c.email.toLowerCase() === email.toLowerCase() &&
      c.code === code &&
      !c.used &&
      (typeof c.expiresAt === 'number' ? c.expiresAt : new Date(c.expiresAt).getTime()) > Date.now()
  );

  if (storedCode && storedCode.id) {
    await dbUpdate(VERIFICATION_CODES_KEY, storedCode.id, { used: true });
    return true;
  }

  return false;
}

// Statistics
export async function getLeaveRequestStats() {
  const requests = await getAllLeaveRequests();
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    partial: requests.filter(r => r.status === 'partial').length,
    awaitingReview: requests.filter(r => r.status === 'pending' || r.status === 'partial').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length,
  };
}
