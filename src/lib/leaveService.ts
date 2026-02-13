// Leave Request Service - Manages member leave requests

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
  email: string;
  code: string;
  expiresAt: number;
  used: boolean;
}

// Constants for approval rules
export const REQUIRED_APPROVALS = 3;
export const REQUIRED_DENIALS = 2;
export const MINIMUM_NOTICE_DAYS = 2;

import { getSettings } from './dataService';
import { syncItemToSupabase, deleteItemFromSupabase } from './supabaseSync';

const LEAVE_REQUESTS_KEY = 'choir_leave_requests';
const VERIFICATION_CODES_KEY = 'choir_verification_codes';

// PIN Verification - gets PIN from settings (configurable in admin)
export function verifyPortalPin(pin: string): boolean {
  const settings = getSettings();
  return pin === settings.memberPortalPin;
}

// Leave Request CRUD
export function getAllLeaveRequests(): LeaveRequest[] {
  const data = localStorage.getItem(LEAVE_REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getPendingLeaveRequests(): LeaveRequest[] {
  return getAllLeaveRequests().filter(r => r.status === 'pending' || r.status === 'partial');
}

export function getApprovedLeaveRequests(): LeaveRequest[] {
  return getAllLeaveRequests().filter(r => r.status === 'approved');
}

export function getPartiallyApprovedRequests(): LeaveRequest[] {
  return getAllLeaveRequests().filter(r => r.status === 'partial');
}

export function getLeaveRequestById(id: string): LeaveRequest | undefined {
  return getAllLeaveRequests().find(r => r.id === id);
}

export function getLeaveRequestsByMember(memberId: string): LeaveRequest[] {
  return getAllLeaveRequests().filter(r => r.memberId === memberId);
}

export function getLeaveRequestsByEmail(email: string): LeaveRequest[] {
  return getAllLeaveRequests().filter(r => r.memberEmail.toLowerCase() === email.toLowerCase());
}

// Check if a member has approved leave for a specific date
export function hasApprovedLeaveForDate(memberId: string, date: string): boolean {
  const approvedRequests = getApprovedLeaveRequests().filter(r => r.memberId === memberId);
  const checkDate = new Date(date);
  
  return approvedRequests.some(request => {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    return checkDate >= startDate && checkDate <= endDate;
  });
}

// Get all members with approved leave for a specific date
export function getMembersOnLeaveForDate(date: string): LeaveRequest[] {
  const checkDate = new Date(date);
  
  return getApprovedLeaveRequests().filter(request => {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    return checkDate >= startDate && checkDate <= endDate;
  });
}

// Validate minimum notice period (2 days)
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

export function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'votes' | 'approvalCount' | 'denialCount'>): LeaveRequest | { error: string } {
  // Validate minimum notice period
  const validation = validateLeaveRequestDate(request.startDate);
  if (!validation.valid) {
    return { error: validation.error! };
  }
  
  const requests = getAllLeaveRequests();
  const newRequest: LeaveRequest = {
    ...request,
    id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    votes: [],
    approvalCount: 0,
    denialCount: 0,
    createdAt: new Date().toISOString(),
  };
  
  requests.push(newRequest);
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  
  // Trigger storage event for other tabs
  window.dispatchEvent(new Event('storage'));
  
  return newRequest;
}

// Check if an admin has already voted on a request
export function hasAdminVoted(request: LeaveRequest, adminId: string): boolean {
  return request.votes?.some(v => v.adminId === adminId) || false;
}

// Get approval progress for display
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
export function castVote(
  id: string, 
  adminId: string, 
  adminName: string, 
  vote: 'approve' | 'deny', 
  notes?: string
): LeaveRequest | { error: string } | null {
  const requests = getAllLeaveRequests();
  const index = requests.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  const request = requests[index];
  
  // Check if request is already finalized
  if (request.status === 'approved' || request.status === 'denied') {
    return { error: 'This leave request has already been finalized.' };
  }
  
  // Initialize votes array if not present (backward compatibility)
  if (!request.votes) {
    request.votes = [];
    request.approvalCount = 0;
    request.denialCount = 0;
  }
  
  // Check if admin has already voted
  if (hasAdminVoted(request, adminId)) {
    return { error: 'You have already voted on this leave request.' };
  }
  
  // Add the vote
  const newVote: ApprovalVote = {
    adminId,
    adminName,
    vote,
    votedAt: new Date().toISOString(),
    notes,
  };
  request.votes.push(newVote);
  
  // Update counts
  if (vote === 'approve') {
    request.approvalCount = (request.approvalCount || 0) + 1;
  } else {
    request.denialCount = (request.denialCount || 0) + 1;
  }
  
  // Determine new status
  if (request.denialCount >= REQUIRED_DENIALS) {
    // 2+ denials = automatic rejection
    request.status = 'denied';
    request.reviewedAt = new Date().toISOString();
  } else if (request.approvalCount >= REQUIRED_APPROVALS) {
    // 3 approvals = fully approved
    request.status = 'approved';
    request.reviewedAt = new Date().toISOString();
  } else if (request.approvalCount > 0) {
    // Has some approvals but not enough yet
    request.status = 'partial';
  }
  // Otherwise stays 'pending'
  
  requests[index] = request;
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event('storage'));
  
  return request;
}

// Legacy functions for backward compatibility (now use castVote internally)
export function approveLeaveRequest(id: string, adminId: string, adminName: string, notes?: string): LeaveRequest | { error: string } | null {
  return castVote(id, adminId, adminName, 'approve', notes);
}

export function denyLeaveRequest(id: string, adminId: string, adminName: string, notes?: string): LeaveRequest | { error: string } | null {
  return castVote(id, adminId, adminName, 'deny', notes);
}

export function deleteLeaveRequest(id: string): boolean {
  const requests = getAllLeaveRequests();
  const filtered = requests.filter(r => r.id !== id);
  
  if (filtered.length === requests.length) return false;
  
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(filtered));
  deleteItemFromSupabase('choir_leave_requests', id);
  window.dispatchEvent(new Event('storage'));
  return true;
}

// Verification Code Management
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeVerificationCode(email: string, code: string): void {
  const codes = getStoredVerificationCodes();
  
  // Remove any existing codes for this email
  const filtered = codes.filter(c => c.email.toLowerCase() !== email.toLowerCase());
  
  // Add new code (expires in 10 minutes)
  filtered.push({
    email: email.toLowerCase(),
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    used: false,
  });
  
  localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(filtered));
}

export function verifyCode(email: string, code: string): boolean {
  const codes = getStoredVerificationCodes();
  const storedCode = codes.find(
    c => c.email.toLowerCase() === email.toLowerCase() && 
         c.code === code && 
         !c.used && 
         c.expiresAt > Date.now()
  );
  
  if (storedCode) {
    // Mark as used
    storedCode.used = true;
    localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes));
    return true;
  }
  
  return false;
}

function getStoredVerificationCodes(): VerificationCode[] {
  const data = localStorage.getItem(VERIFICATION_CODES_KEY);
  if (!data) return [];
  
  // Clean up expired codes
  const codes: VerificationCode[] = JSON.parse(data);
  const validCodes = codes.filter(c => c.expiresAt > Date.now());
  
  if (validCodes.length !== codes.length) {
    localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(validCodes));
  }
  
  return validCodes;
}

// Statistics
export function getLeaveRequestStats() {
  const requests = getAllLeaveRequests();
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    partial: requests.filter(r => r.status === 'partial').length,
    awaitingReview: requests.filter(r => r.status === 'pending' || r.status === 'partial').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length,
  };
}

