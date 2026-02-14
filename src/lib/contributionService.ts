// Contribution Service - Track member dues and special contributions (Supabase-direct)

import { getAllMembers } from "./dataService";
import { createReceipt } from "./receiptService";
import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, generateId } from './supabaseDB';

const CONTRIBUTIONS_KEY = "choir_contributions";
const CONTRIBUTION_TYPES_KEY = "choir_contribution_types";

export type ContributionCategory = "monthly" | "special";

export interface RateHistoryEntry {
  amount: number;
  effectiveFrom: string;
}

export interface ContributionType {
  id: string;
  name: string;
  category: ContributionCategory;
  amount: number;
  description?: string;
  isRecurring?: boolean;
  rateHistory?: RateHistoryEntry[];
  targetAmount?: number;
  deadline?: string;
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
  expectedAmount?: number;
  month?: number;
  year?: number;
  paymentMethod?: "cash" | "momo" | "bank";
  reference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ============ CONTRIBUTION TYPES ============

export async function getAllContributionTypes(): Promise<ContributionType[]> {
  return dbGetAll<ContributionType>(CONTRIBUTION_TYPES_KEY);
}

export async function getActiveContributionTypes(): Promise<ContributionType[]> {
  const types = await getAllContributionTypes();
  return types.filter(t => t.isActive);
}

export async function getContributionTypeById(id: string): Promise<ContributionType | undefined> {
  const type = await dbGetById<ContributionType>(CONTRIBUTION_TYPES_KEY, id);
  return type || undefined;
}

export async function createContributionType(
  data: Omit<ContributionType, "id" | "createdAt" | "isActive">
): Promise<ContributionType> {
  const newType: ContributionType = {
    ...data,
    id: `type-${Date.now()}`,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  return dbInsert<ContributionType>(CONTRIBUTION_TYPES_KEY, newType);
}

export async function updateContributionType(
  id: string,
  data: Partial<ContributionType>,
  options?: { createAnnouncement?: boolean }
): Promise<ContributionType | null> {
  const oldType = await getContributionTypeById(id);
  if (!oldType) return null;

  const newAmount = data.amount;

  // Track rate history for monthly dues when amount changes
  if (oldType.category === "monthly" && newAmount && newAmount !== oldType.amount) {
    const rateHistory = oldType.rateHistory || [];

    if (rateHistory.length === 0) {
      rateHistory.push({
        amount: oldType.amount,
        effectiveFrom: oldType.createdAt,
      });
    }

    rateHistory.push({
      amount: newAmount,
      effectiveFrom: new Date().toISOString(),
    });

    data.rateHistory = rateHistory;

    if (options?.createAnnouncement !== false) {
      try {
        const { createAnnouncement } = require("./announcementService");
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        createAnnouncement({
          title: "Monthly Contribution Update",
          content: `The monthly contribution amount has changed from ${oldType.amount.toLocaleString()} RWF to ${newAmount.toLocaleString()} RWF, effective immediately.`,
          type: "info",
          priority: "high",
          audience: "members",
          isPinned: true,
          isActive: true,
          startDate: new Date().toISOString(),
          endDate: endDate.toISOString(),
          createdBy: "System",
        }).catch((e: any) => console.error("Failed to create announcement:", e));
      } catch (e) {
        console.error("Failed to create announcement:", e);
      }
    }
  }

  const updated = { ...oldType, ...data };
  try {
    return await dbUpdate<ContributionType>(CONTRIBUTION_TYPES_KEY, id, updated);
  } catch {
    return null;
  }
}

export async function deleteContributionType(id: string): Promise<boolean> {
  try {
    await dbDelete(CONTRIBUTION_TYPES_KEY, id);
    return true;
  } catch {
    return false;
  }
}

export async function getMonthlyRateForPeriod(month: number, year: number): Promise<number> {
  const types = await getAllContributionTypes();
  const monthlyType = types.find(t => t.category === "monthly" && t.isActive);
  if (!monthlyType) return 0;

  const rateHistory = monthlyType.rateHistory;
  if (!rateHistory || rateHistory.length === 0) {
    return monthlyType.amount;
  }

  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const sortedHistory = [...rateHistory].sort(
    (a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime()
  );

  let applicableRate = sortedHistory[0].amount;
  for (const entry of sortedHistory) {
    const effectiveDate = new Date(entry.effectiveFrom);
    if (effectiveDate <= endOfMonth) {
      applicableRate = entry.amount;
    } else {
      break;
    }
  }

  return applicableRate;
}

// ============ CONTRIBUTIONS ============

export async function getAllContributions(): Promise<Contribution[]> {
  return dbGetAll<Contribution>(CONTRIBUTIONS_KEY);
}

export async function getContributionById(id: string): Promise<Contribution | undefined> {
  const c = await dbGetById<Contribution>(CONTRIBUTIONS_KEY, id);
  return c || undefined;
}

export async function getContributionsByMember(memberId: string): Promise<Contribution[]> {
  const all = await getAllContributions();
  return all.filter(c => c.memberId === memberId);
}

export async function getContributionsByMemberEmail(email: string): Promise<Contribution[]> {
  const all = await getAllContributions();
  return all.filter(c => c.memberEmail.toLowerCase() === email.toLowerCase());
}

export async function getContributionsByType(typeId: string): Promise<Contribution[]> {
  const all = await getAllContributions();
  return all.filter(c => c.typeId === typeId);
}

export async function getContributionsByMonth(month: number, year: number): Promise<Contribution[]> {
  const all = await getAllContributions();
  return all.filter(c => c.month === month && c.year === year);
}

export async function getMemberMonthlyPayment(memberId: string, month: number, year: number): Promise<number> {
  const contributions = await getAllContributions();
  return contributions
    .filter(c => c.memberId === memberId && c.month === month && c.year === year && c.category === "monthly")
    .reduce((sum, c) => sum + c.amount, 0);
}

export async function getMemberMonthlyPaymentDetails(memberId: string, month: number, year: number): Promise<{
  amountPaid: number;
  expectedAmount: number;
  hasHistoricalRate: boolean;
}> {
  const contributions = await getAllContributions();
  const monthlyContribs = contributions.filter(
    c => c.memberId === memberId && c.month === month && c.year === year && c.category === "monthly"
  );

  const amountPaid = monthlyContribs.reduce((sum, c) => sum + c.amount, 0);
  const storedExpected = monthlyContribs.find(c => c.expectedAmount)?.expectedAmount;
  const rateForMonth = await getMonthlyRateForPeriod(month, year);

  return {
    amountPaid,
    expectedAmount: storedExpected ?? rateForMonth,
    hasHistoricalRate: !!storedExpected || rateForMonth > 0,
  };
}

export async function setMemberMonthlyPayment(
  memberId: string,
  memberName: string,
  memberEmail: string,
  month: number,
  year: number,
  amount: number,
  recordedBy: string,
  expectedAmount?: number
): Promise<Contribution | null> {
  const contributions = await getAllContributions();
  const types = await getAllContributionTypes();
  const monthlyType = types.find(t => t.category === "monthly" && t.isActive);

  if (!monthlyType) return null;

  const rateAtTimeOfPayment = expectedAmount ?? monthlyType.amount;

  const existing = contributions.find(
    c => c.memberId === memberId && c.month === month && c.year === year && c.category === "monthly"
  );

  if (amount <= 0) {
    if (existing) {
      await dbDelete(CONTRIBUTIONS_KEY, existing.id);
    }
    return null;
  }

  if (existing) {
    const updates: Partial<Contribution> = {
      amount,
      recordedBy,
    };
    if (!existing.expectedAmount) {
      updates.expectedAmount = rateAtTimeOfPayment;
    }
    return dbUpdate<Contribution>(CONTRIBUTIONS_KEY, existing.id, { ...existing, ...updates });
  } else {
    const newContribution: Contribution = {
      id: `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      memberId,
      memberName,
      memberEmail,
      typeId: monthlyType.id,
      typeName: monthlyType.name,
      category: "monthly",
      amount,
      expectedAmount: rateAtTimeOfPayment,
      month,
      year,
      paymentMethod: "cash",
      recordedBy,
      createdAt: new Date().toISOString(),
    };
    const inserted = await dbInsert<Contribution>(CONTRIBUTIONS_KEY, newContribution);
    await createReceipt({
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
    return inserted;
  }
}

export async function createContribution(
  data: Omit<Contribution, "id" | "createdAt">
): Promise<Contribution> {
  const newContribution: Contribution = {
    ...data,
    id: `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  const inserted = await dbInsert<Contribution>(CONTRIBUTIONS_KEY, newContribution);
  await createReceipt({
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
  return inserted;
}

export async function updateContribution(
  id: string,
  data: Partial<Contribution>
): Promise<Contribution | null> {
  try {
    const existing = await dbGetById<Contribution>(CONTRIBUTIONS_KEY, id);
    if (!existing) return null;
    return dbUpdate<Contribution>(CONTRIBUTIONS_KEY, id, { ...existing, ...data });
  } catch {
    return null;
  }
}

export async function deleteContribution(id: string): Promise<boolean> {
  try {
    await dbDelete(CONTRIBUTIONS_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// ============ MEMBER CONTRIBUTION STATUS ============

export interface MemberContributionStatus {
  memberId: string;
  memberName: string;
  memberEmail: string;
  totalPaid: number;
  monthlyDuesPaid: number;
  specialContributions: number;
  paidMonths: { month: number; year: number; amount: number }[];
  unpaidMonths: { month: number; year: number; expectedAmount: number }[];
  specialStatus: {
    typeId: string;
    typeName: string;
    expectedAmount: number;
    paidAmount: number;
    isPaid: boolean;
  }[];
}

export async function getMemberContributionStatus(
  memberId: string,
  memberName: string,
  memberEmail: string
): Promise<MemberContributionStatus> {
  const contributions = await getContributionsByMember(memberId);
  const types = await getAllContributionTypes();

  const totalPaid = contributions.reduce((sum, c) => sum + c.amount, 0);
  const monthlyDuesPaid = contributions
    .filter(c => c.category === "monthly")
    .reduce((sum, c) => sum + c.amount, 0);
  const specialContributionsTotal = contributions
    .filter(c => c.category !== "monthly")
    .reduce((sum, c) => sum + c.amount, 0);

  const paidMonths = contributions
    .filter(c => c.category === "monthly" && c.month && c.year)
    .map(c => ({ month: c.month!, year: c.year!, amount: c.amount }));

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
    specialContributions: specialContributionsTotal,
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

export async function getContributionStats(): Promise<ContributionStats> {
  const contributions = await getAllContributions();
  const members = await getAllMembers();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const totalCollected = contributions.reduce((sum, c) => sum + c.amount, 0);
  const monthlyDuesCollected = contributions
    .filter(c => c.category === "monthly")
    .reduce((sum, c) => sum + c.amount, 0);
  const specialContributionsTotal = totalCollected - monthlyDuesCollected;

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

  let outstandingDues = 0;
  const activeMembers = members.filter(m => m.status === "Active");
  for (const member of activeMembers) {
    const joinDate = new Date(member.joinedDate);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth() + 1;

    let startMonth = 1;
    if (joinYear === currentYear) {
      startMonth = joinMonth;
    } else if (joinYear > currentYear) {
      continue;
    }

    for (let month = startMonth; month <= currentMonth; month++) {
      const rateForMonth = await getMonthlyRateForPeriod(month, currentYear);
      const paidForMonth = contributions.find(
        c => c.memberId === member.id &&
             c.category === "monthly" &&
             c.month === month &&
             c.year === currentYear
      );

      if (!paidForMonth) {
        outstandingDues += rateForMonth;
      } else {
        const expectedAmountVal = paidForMonth.expectedAmount ?? rateForMonth;
        if (paidForMonth.amount < expectedAmountVal) {
          outstandingDues += (expectedAmountVal - paidForMonth.amount);
        }
      }
    }
  }

  return {
    totalCollected,
    monthlyDuesCollected,
    specialContributions: specialContributionsTotal,
    thisMonthTotal,
    thisYearTotal,
    contributionCount: contributions.length,
    uniqueContributors,
    outstandingDues,
  };
}

export async function getMonthlyDuesReport(month: number, year: number, members: { id: string; name: string; email: string }[]) {
  const contributions = await getAllContributions();
  const types = await getAllContributionTypes();
  const monthlyType = types.find(t => t.category === "monthly" && t.isActive);
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

export async function getSpecialContributionProgress(typeId: string, members: { id: string; name: string; email: string }[]) {
  const type = await getContributionTypeById(typeId);
  if (!type) return null;

  const contributions = await getContributionsByType(typeId);
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
