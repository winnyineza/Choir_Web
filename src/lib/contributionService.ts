// Contribution Service - Track member dues and special contributions

const CONTRIBUTIONS_KEY = "choir_contributions";
const CONTRIBUTION_TYPES_KEY = "choir_contribution_types";

export type ContributionCategory = "monthly" | "special" | "event" | "other";

export interface ContributionType {
  id: string;
  name: string;
  category: ContributionCategory;
  amount: number; // Expected amount
  description?: string;
  // For monthly dues
  isRecurring?: boolean;
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
  data: Partial<ContributionType>
): ContributionType | null {
  const types = getAllContributionTypes();
  const index = types.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
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

// Update or create a contribution for a specific member/month
export function setMemberMonthlyPayment(
  memberId: string,
  memberName: string,
  memberEmail: string,
  month: number,
  year: number,
  amount: number,
  recordedBy: string
): Contribution | null {
  const contributions = getAllContributions();
  const monthlyType = getAllContributionTypes().find(t => t.category === "monthly" && t.isActive);
  
  if (!monthlyType) return null;
  
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
    // Update existing
    contributions[existingIndex].amount = amount;
    contributions[existingIndex].recordedBy = recordedBy;
    localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
    return contributions[existingIndex];
  } else {
    // Create new
    const newContribution: Contribution = {
      id: `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      memberId,
      memberName,
      memberEmail,
      typeId: monthlyType.id,
      typeName: monthlyType.name,
      category: "monthly",
      amount,
      month,
      year,
      paymentMethod: "cash",
      recordedBy,
      createdAt: new Date().toISOString(),
    };
    contributions.push(newContribution);
    localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
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
}

export function getContributionStats(): ContributionStats {
  const contributions = getAllContributions();
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
  
  return {
    totalCollected,
    monthlyDuesCollected,
    specialContributions,
    thisMonthTotal,
    thisYearTotal,
    contributionCount: contributions.length,
    uniqueContributors,
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

