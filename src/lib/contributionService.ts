// Contribution Service - Track member dues and special contributions

import { getAllMembers } from "./dataService";
import { createReceipt } from "./receiptService";

const CONTRIBUTIONS_KEY = "choir_contributions";
const CONTRIBUTION_TYPES_KEY = "choir_contribution_types";

export type ContributionCategory = "monthly" | "special";

export interface RateHistoryEntry {
  amount: number;
  effectiveFrom: string; // ISO date - when this rate became effective
}

export interface ContributionType {
  id: string;
  name: string;
  category: ContributionCategory;
  amount: number; // Current expected amount
  description?: string;
  // For monthly dues
  isRecurring?: boolean;
  rateHistory?: RateHistoryEntry[]; // Track rate changes over time
  // For special contributions
  targetAmount?: number; // Total goal (e.g., uniform fund = 500,000 RWF)
  deadline?: string; // ISO date
  isActive: boolean;
  createdAt: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  typeId: string;
  typeName: string;
  category: ContributionCategory;
  amount: number;
  expectedAmount?: number; // Historical rate - what was expected when payment was recorded
  // For monthly dues
  month?: number; // 1-12
  year?: number;
  // Payment details
  paymentMethod?: "cash" | "momo" | "bank";
  reference?: string;
  notes?: string;
  recordedBy: string; // Admin who recorded it
  createdAt: string;
}

// ============ CONTRIBUTION TYPES ============

export function getAllContributionTypes(): ContributionType[] {
  const data = localStorage.getItem(CONTRIBUTION_TYPES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getActiveContributionTypes(): ContributionType[] {
  return getAllContributionTypes().filter(t => t.isActive);
}

export function getContributionTypeById(id: string): ContributionType | undefined {
  return getAllContributionTypes().find(t => t.id === id);
}

export function createContributionType(
  data: Omit<ContributionType, "id" | "createdAt" | "isActive">
): ContributionType {
  const types = getAllContributionTypes();
  
  const newType: ContributionType = {
    ...data,
    id: `type-${Date.now()}`,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  
  types.push(newType);
  localStorage.setItem(CONTRIBUTION_TYPES_KEY, JSON.stringify(types));
  return newType;
}

export function updateContributionType(
  id: string,
  data: Partial<ContributionType>,
  options?: { createAnnouncement?: boolean }
): ContributionType | null {
  const types = getAllContributionTypes();
  const index = types.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  const oldType = types[index];
  const newAmount = data.amount;
  
  // Track rate history for monthly dues when amount changes
  if (oldType.category === "monthly" && newAmount && newAmount !== oldType.amount) {
    const rateHistory = oldType.rateHistory || [];
    
    // If no history yet, add the original rate first (effective from creation)
    if (rateHistory.length === 0) {
      rateHistory.push({
        amount: oldType.amount,
        effectiveFrom: oldType.createdAt,
      });
    }
    
    // Add the new rate with today's effective date
    rateHistory.push({
      amount: newAmount,
      effectiveFrom: new Date().toISOString(),
    });
    
    data.rateHistory = rateHistory;
    
    // Create announcement for rate change if requested (default: true for monthly)
    if (options?.createAnnouncement !== false) {
      try {
        // Import dynamically to avoid circular dependency
        const { createAnnouncement } = require("./announcementService");
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // Show for 7 days
        
        createAnnouncement({
          title: "Monthly Contribution Update",
          content: `The monthly contribution amount has changed from ${oldType.amount.toLocaleString()} RWF to ${newAmount.toLocaleString()} RWF, effective immediately. Please note that unpaid months before this change will still use the previous rate.`,
          priority: "high",
          audience: "members",
          isPinned: true,
          isActive: true,
          expiresAt: expiryDate.toISOString(),
          createdBy: "System",
        });
      } catch (e) {
        console.error("Failed to create announcement:", e);
      }
    }
  }
  
  types[index] = { ...types[index], ...data };
  localStorage.setItem(CONTRIBUTION_TYPES_KEY, JSON.stringify(types));
  return types[index];
}

export function deleteContributionType(id: string): boolean {
  const types = getAllContributionTypes();
  const filtered = types.filter(t => t.id !== id);
  
  if (filtered.length === types.length) return false;
  
  localStorage.setItem(CONTRIBUTION_TYPES_KEY, JSON.stringify(filtered));
  return true;
}

// Get the rate that was active for a specific month/year
// This finds the rate that was in effect at the END of that month
export function getMonthlyRateForPeriod(month: number, year: number): number {
  const monthlyType = getAllContributionTypes().find(t => t.category === "monthly" && t.isActive);
  if (!monthlyType) return 0;
  
  const rateHistory = monthlyType.rateHistory;
  
  // If no rate history, use current amount
  if (!rateHistory || rateHistory.length === 0) {
    return monthlyType.amount;
  }
  
  // Find the rate that was active at the end of the specified month
  // End of month = last day of that month at 23:59:59
  const endOfMonth = new Date(year, month, 0, 23, 59, 59); // month is 1-12, so month gives us last day
  
  // Sort history by effectiveFrom date (oldest first)
  const sortedHistory = [...rateHistory].sort(
    (a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime()
  );
  
  // Find the last rate that was effective before or on the end of the target month
  let applicableRate = sortedHistory[0].amount; // Start with the oldest rate
  
  for (const entry of sortedHistory) {
    const effectiveDate = new Date(entry.effectiveFrom);
    if (effectiveDate <= endOfMonth) {
      applicableRate = entry.amount;
    } else {
      // This rate became effective after the target month, stop looking
      break;
    }
  }
  
  return applicableRate;
}

// ============ CONTRIBUTIONS ============

export function getAllContributions(): Contribution[] {
  const data = localStorage.getItem(CONTRIBUTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getContributionById(id: string): Contribution | undefined {
  return getAllContributions().find(c => c.id === id);
}

export function getContributionsByMember(memberId: string): Contribution[] {
  return getAllContributions().filter(c => c.memberId === memberId);
}

export function getContributionsByMemberEmail(email: string): Contribution[] {
  return getAllContributions().filter(c => c.memberEmail.toLowerCase() === email.toLowerCase());
}

export function getContributionsByType(typeId: string): Contribution[] {
  return getAllContributions().filter(c => c.typeId === typeId);
}

export function getContributionsByMonth(month: number, year: number): Contribution[] {
  return getAllContributions().filter(c => c.month === month && c.year === year);
}

// Get amount paid by a member for a specific month/year
export function getMemberMonthlyPayment(memberId: string, month: number, year: number): number {
  const contributions = getAllContributions();
  return contributions
    .filter(c => c.memberId === memberId && c.month === month && c.year === year && c.category === "monthly")
    .reduce((sum, c) => sum + c.amount, 0);
}

// Get payment details including historical expected amount
export function getMemberMonthlyPaymentDetails(memberId: string, month: number, year: number): {
  amountPaid: number;
  expectedAmount: number;
  hasHistoricalRate: boolean;
} {
  const contributions = getAllContributions();
  const monthlyContribs = contributions.filter(
    c => c.memberId === memberId && c.month === month && c.year === year && c.category === "monthly"
  );
  
  const amountPaid = monthlyContribs.reduce((sum, c) => sum + c.amount, 0);
  
  // Get the expected amount from:
  // 1. The stored historical rate on the payment (if exists)
  // 2. The rate that was active for that month (from rate history)
  const storedExpected = monthlyContribs.find(c => c.expectedAmount)?.expectedAmount;
  const rateForMonth = getMonthlyRateForPeriod(month, year);
  
  return {
    amountPaid,
    expectedAmount: storedExpected ?? rateForMonth,
    hasHistoricalRate: !!storedExpected || rateForMonth > 0,
  };
}

// Update or create a contribution for a specific member/month
export function setMemberMonthlyPayment(
  memberId: string,
  memberName: string,
  memberEmail: string,
  month: number,
  year: number,
  amount: number,
  recordedBy: string,
  expectedAmount?: number // Optional - if not provided, uses current type amount
): Contribution | null {
  const contributions = getAllContributions();
  const monthlyType = getAllContributionTypes().find(t => t.category === "monthly" && t.isActive);
  
  if (!monthlyType) return null;
  
  // Use provided expected amount or current type amount
  const rateAtTimeOfPayment = expectedAmount ?? monthlyType.amount;
  
  // Find existing contribution for this member/month/year
  const existingIndex = contributions.findIndex(
    c => c.memberId === memberId && c.month === month && c.year === year && c.category === "monthly"
  );
  
  if (amount <= 0) {
    // Remove the contribution if amount is 0 or negative
    if (existingIndex !== -1) {
      contributions.splice(existingIndex, 1);
      localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
    }
    return null;
  }
  
  if (existingIndex !== -1) {
    // Update existing - keep the original expectedAmount (historical rate)
    contributions[existingIndex].amount = amount;
    contributions[existingIndex].recordedBy = recordedBy;
    // Only update expectedAmount if it wasn't set before (migration for old data)
    if (!contributions[existingIndex].expectedAmount) {
      contributions[existingIndex].expectedAmount = rateAtTimeOfPayment;
    }
    localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
    return contributions[existingIndex];
  } else {
    // Create new - store the expected amount at time of payment
    const newContribution: Contribution = {
      id: `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      memberId,
      memberName,
      memberEmail,
      typeId: monthlyType.id,
      typeName: monthlyType.name,
      category: "monthly",
      amount,
      expectedAmount: rateAtTimeOfPayment, // Historical rate tracking
      month,
      year,
      paymentMethod: "cash",
      recordedBy,
      createdAt: new Date().toISOString(),
    };
    contributions.push(newContribution);
    localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
    // Auto-create receipt
    createReceipt({
      memberId,
      memberName,
      memberEmail,
      amount,
      category: "Monthly",
      typeName: monthlyType.name,
      month,
      year,
      paymentMethod: "cash",
      recordedBy,
    });
    return newContribution;
  }
}

export function createContribution(
  data: Omit<Contribution, "id" | "createdAt">
): Contribution {
  const contributions = getAllContributions();
  
  const newContribution: Contribution = {
    ...data,
    id: `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  
  contributions.push(newContribution);
  localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
  // Auto-create receipt for any contribution
  createReceipt({
    memberId: newContribution.memberId,
    memberName: newContribution.memberName,
    memberEmail: newContribution.memberEmail,
    amount: newContribution.amount,
    category: newContribution.category === "monthly" ? "Monthly" : "Special",
    typeName: newContribution.typeName,
    month: newContribution.month,
    year: newContribution.year,
    paymentMethod: newContribution.paymentMethod,
    reference: newContribution.reference,
    recordedBy: newContribution.recordedBy,
  });
  return newContribution;
}

export function updateContribution(
  id: string,
  data: Partial<Contribution>
): Contribution | null {
  const contributions = getAllContributions();
  const index = contributions.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  contributions[index] = { ...contributions[index], ...data };
  localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
  return contributions[index];
}

export function deleteContribution(id: string): boolean {
  const contributions = getAllContributions();
  const filtered = contributions.filter(c => c.id !== id);
  
  if (filtered.length === contributions.length) return false;
  
  localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(filtered));
  return true;
}

// ============ MEMBER CONTRIBUTION STATUS ============

export interface MemberContributionStatus {
  memberId: string;
  memberName: string;
  memberEmail: string;
  totalPaid: number;
  monthlyDuesPaid: number;
  specialContributions: number;
  // Monthly status
  paidMonths: { month: number; year: number; amount: number }[];
  unpaidMonths: { month: number; year: number; expectedAmount: number }[];
  // Special contributions status
  specialStatus: {
    typeId: string;
    typeName: string;
    expectedAmount: number;
    paidAmount: number;
    isPaid: boolean;
  }[];
}

export function getMemberContributionStatus(
  memberId: string,
  memberName: string,
  memberEmail: string
): MemberContributionStatus {
  const contributions = getContributionsByMember(memberId);
  const types = getAllContributionTypes();
  
  // Calculate totals
  const totalPaid = contributions.reduce((sum, c) => sum + c.amount, 0);
  const monthlyDuesPaid = contributions
    .filter(c => c.category === "monthly")
    .reduce((sum, c) => sum + c.amount, 0);
  const specialContributions = contributions
    .filter(c => c.category !== "monthly")
    .reduce((sum, c) => sum + c.amount, 0);
  
  // Get paid months
  const paidMonths = contributions
    .filter(c => c.category === "monthly" && c.month && c.year)
    .map(c => ({ month: c.month!, year: c.year!, amount: c.amount }));
  
  // Calculate unpaid months (current year)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthlyType = types.find(t => t.category === "monthly" && t.isActive);
  const monthlyAmount = monthlyType?.amount || 0;
  
  const unpaidMonths: { month: number; year: number; expectedAmount: number }[] = [];
  for (let month = 1; month <= currentMonth; month++) {
    const isPaid = paidMonths.some(p => p.month === month && p.year === currentYear);
    if (!isPaid && monthlyAmount > 0) {
      unpaidMonths.push({ month, year: currentYear, expectedAmount: monthlyAmount });
    }
  }
  
  // Get special contributions status
  const activeSpecialTypes = types.filter(t => t.category !== "monthly" && t.isActive);
  const specialStatus = activeSpecialTypes.map(type => {
    const paid = contributions
      .filter(c => c.typeId === type.id)
      .reduce((sum, c) => sum + c.amount, 0);
    
    return {
      typeId: type.id,
      typeName: type.name,
      expectedAmount: type.amount,
      paidAmount: paid,
      isPaid: paid >= type.amount,
    };
  });
  
  return {
    memberId,
    memberName,
    memberEmail,
    totalPaid,
    monthlyDuesPaid,
    specialContributions,
    paidMonths,
    unpaidMonths,
    specialStatus,
  };
}

// ============ REPORTS & STATS ============

export interface ContributionStats {
  totalCollected: number;
  monthlyDuesCollected: number;
  specialContributions: number;
  thisMonthTotal: number;
  thisYearTotal: number;
  contributionCount: number;
  uniqueContributors: number;
  outstandingDues: number;
}

export function getContributionStats(): ContributionStats {
  const contributions = getAllContributions();
  const members = getAllMembers();
  const types = getAllContributionTypes();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const totalCollected = contributions.reduce((sum, c) => sum + c.amount, 0);
  const monthlyDuesCollected = contributions
    .filter(c => c.category === "monthly")
    .reduce((sum, c) => sum + c.amount, 0);
  const specialContributions = totalCollected - monthlyDuesCollected;
  
  const thisMonthTotal = contributions
    .filter(c => {
      const date = new Date(c.createdAt);
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, c) => sum + c.amount, 0);
  
  const thisYearTotal = contributions
    .filter(c => new Date(c.createdAt).getFullYear() === currentYear)
    .reduce((sum, c) => sum + c.amount, 0);
  
  const uniqueContributors = new Set(contributions.map(c => c.memberId)).size;
  
  // Calculate outstanding dues with historical rate support
  let outstandingDues = 0;
  
  // Calculate unpaid monthly dues for all active members
  const activeMembers = members.filter(m => m.status === "active");
  activeMembers.forEach(member => {
    // Determine the starting month for this member based on their join date
    const joinDate = new Date(member.joinedDate);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth() + 1; // 1-12
    
    // Only calculate dues for current year, starting from when they joined
    let startMonth = 1;
    if (joinYear === currentYear) {
      // Member joined this year - start from their join month
      startMonth = joinMonth;
    } else if (joinYear > currentYear) {
      // Member joins in the future - no dues yet
      return;
    }
    // If joinYear < currentYear, they owe from January (startMonth = 1)
    
    // Check each month from their start month to current month
    for (let month = startMonth; month <= currentMonth; month++) {
      // Get the rate that was active for this specific month
      const rateForMonth = getMonthlyRateForPeriod(month, currentYear);
      
      const paidForMonth = contributions.find(
        c => c.memberId === member.id && 
             c.category === "monthly" && 
             c.month === month && 
             c.year === currentYear
      );
      
      if (!paidForMonth) {
        // No payment - use the rate that was active for that month
        outstandingDues += rateForMonth;
      } else {
        // Use the historical rate stored with the payment, or the rate for that month
        const expectedAmount = paidForMonth.expectedAmount ?? rateForMonth;
        if (paidForMonth.amount < expectedAmount) {
          // Partial payment - add the remaining
          outstandingDues += (expectedAmount - paidForMonth.amount);
        }
        // If fully paid against historical rate, no outstanding dues for this month
      }
    }
  });
  
  return {
    totalCollected,
    monthlyDuesCollected,
    specialContributions,
    thisMonthTotal,
    thisYearTotal,
    contributionCount: contributions.length,
    uniqueContributors,
    outstandingDues,
  };
}

// Get monthly dues payment status for all members
export function getMonthlyDuesReport(month: number, year: number, members: { id: string; name: string; email: string }[]) {
  const contributions = getAllContributions();
  const monthlyType = getAllContributionTypes().find(t => t.category === "monthly" && t.isActive);
  const expectedAmount = monthlyType?.amount || 0;
  
  return members.map(member => {
    const memberContributions = contributions.filter(
      c => c.memberId === member.id && 
           c.category === "monthly" && 
           c.month === month && 
           c.year === year
    );
    
    const paidAmount = memberContributions.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      expectedAmount,
      paidAmount,
      isPaid: paidAmount >= expectedAmount,
      contributions: memberContributions,
    };
  });
}

// Get special contribution collection progress
export function getSpecialContributionProgress(typeId: string, members: { id: string; name: string; email: string }[]) {
  const type = getContributionTypeById(typeId);
  if (!type) return null;
  
  const contributions = getContributionsByType(typeId);
  const totalCollected = contributions.reduce((sum, c) => sum + c.amount, 0);
  
  const memberStatus = members.map(member => {
    const memberContribs = contributions.filter(c => c.memberId === member.id);
    const paidAmount = memberContribs.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      memberId: member.id,
      memberName: member.name,
      expectedAmount: type.amount,
      paidAmount,
      isPaid: paidAmount >= type.amount,
    };
  });
  
  return {
    type,
    totalCollected,
    targetAmount: type.targetAmount || type.amount * members.length,
    progress: type.targetAmount ? (totalCollected / type.targetAmount) * 100 : 0,
    paidCount: memberStatus.filter(m => m.isPaid).length,
    totalMembers: members.length,
    memberStatus,
  };
}

// Month names helper
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || "";
}

