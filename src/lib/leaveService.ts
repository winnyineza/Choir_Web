// Leave Request Service - Manages member leave requests

export interface LeaveRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
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

const LEAVE_REQUESTS_KEY = 'choir_leave_requests';
const VERIFICATION_CODES_KEY = 'choir_verification_codes';
const MEMBER_PORTAL_PIN = '2024'; // Common PIN for all members

// PIN Verification
export function verifyPortalPin(pin: string): boolean {
  return pin === MEMBER_PORTAL_PIN;
}

// Leave Request CRUD
export function getAllLeaveRequests(): LeaveRequest[] {
  const data = localStorage.getItem(LEAVE_REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getPendingLeaveRequests(): LeaveRequest[] {
  return getAllLeaveRequests().filter(r => r.status === 'pending');
}

export function getApprovedLeaveRequests(): LeaveRequest[] {
  return getAllLeaveRequests().filter(r => r.status === 'approved');
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

export function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>): LeaveRequest {
  const requests = getAllLeaveRequests();
  const newRequest: LeaveRequest = {
    ...request,
    id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  requests.push(newRequest);
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  
  // Trigger storage event for other tabs
  window.dispatchEvent(new Event('storage'));
  
  return newRequest;
}

export function approveLeaveRequest(id: string, adminName: string, notes?: string): LeaveRequest | null {
  const requests = getAllLeaveRequests();
  const index = requests.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  requests[index] = {
    ...requests[index],
    status: 'approved',
    reviewedBy: adminName,
    reviewedAt: new Date().toISOString(),
    adminNotes: notes,
  };
  
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event('storage'));
  
  return requests[index];
}

export function denyLeaveRequest(id: string, adminName: string, notes?: string): LeaveRequest | null {
  const requests = getAllLeaveRequests();
  const index = requests.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  requests[index] = {
    ...requests[index],
    status: 'denied',
    reviewedBy: adminName,
    reviewedAt: new Date().toISOString(),
    adminNotes: notes,
  };
  
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event('storage'));
  
  return requests[index];
}

export function deleteLeaveRequest(id: string): boolean {
  const requests = getAllLeaveRequests();
  const filtered = requests.filter(r => r.id !== id);
  
  if (filtered.length === requests.length) return false;
  
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(filtered));
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
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length,
  };
}

