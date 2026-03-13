// Contribution Service - Track member dues and special contributions (Supabase-direct)

import { getAllMembers, type Member } from "./dataService";
import { createReceipt } from "./receiptService";
import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, dbQuery, generateId } from './supabaseDB';
import { isMonthTemporarilyUnlocked } from './unlockRequestService';
import { getOutstandingFineBalanceByMember, getOutstandingFineBalanceTotal } from './disciplinaryService';

const CONTRIBUTIONS_KEY = "choir_contributions";
const CONTRIBUTION_TYPES_KEY = "choir_contribution_types";
const MONTHLY_DUES_EXCEPTIONS_KEY = "choir_monthly_dues_exceptions";
const LEGACY_DUES_BASELINE_DATE = new Date("2026-03-13T23:59:59.999Z");

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

export type MonthlyDuesExceptionStatus = "tolerated";

export interface MonthlyDuesException {
  id: string;
  memberId: string;
  month: number;
  year: number;
  status: MonthlyDuesExceptionStatus;
  reason: string;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  clearedAt?: string;
  clearedBy?: string;
  clearedByRole?: string;
}

export type MonthlyDuesStatus = "not_applicable" | "unpaid" | "partial" | "paid" | "tolerated";

export interface MonthlyDuesStatusDetails {
  status: MonthlyDuesStatus;
  amountPaid: number;
  expectedAmount: number;
  hasHistoricalRate: boolean;
  isTolerated: boolean;
  toleratedReason?: string;
  toleratedRecordId?: string;
}

export async function getAllMonthlyDuesExceptions(): Promise<MonthlyDuesException[]> {
  return dbGetAll<MonthlyDuesException>(MONTHLY_DUES_EXCEPTIONS_KEY);
}

export function getMemberDuesStartMonth(member: Pick<Member, "joinedDate">, year: number): number | null {
  const joinDate = new Date(member.joinedDate);
  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth() + 1;
  const isLegacyMember = joinDate <= LEGACY_DUES_BASELINE_DATE;

  if (year < joinYear) return null;
  if (isLegacyMember && year >= LEGACY_DUES_BASELINE_DATE.getFullYear()) return 1;
  if (year === joinYear) return joinMonth;
  return 1;
}

function getActiveToleranceRecord(
  exceptions: MonthlyDuesException[],
  memberId: string,
  month: number,
  year: number
): MonthlyDuesException | undefined {
  return exceptions.find(
    (record) =>
      record.memberId === memberId &&
      record.month === month &&
      record.year === year &&
      record.status === "tolerated" &&
      !record.clearedAt
  );
}

function buildMonthlyDuesStatusDetails(params: {
  memberId: string;
  month: number;
  year: number;
  contributions: Contribution[];
  rateForMonth: number;
  exceptions: MonthlyDuesException[];
  applicable?: boolean;
}): MonthlyDuesStatusDetails {
  const monthlyContribs = params.contributions.filter(
    (c) => c.memberId === params.memberId && c.month === params.month && c.year === params.year && c.category === "monthly"
  );
  const amountPaid = monthlyContribs.reduce((sum, c) => sum + c.amount, 0);
  const storedExpected = monthlyContribs.find((c) => c.expectedAmount)?.expectedAmount;
  const expectedAmount = storedExpected ?? params.rateForMonth;
  const toleratedRecord = getActiveToleranceRecord(params.exceptions, params.memberId, params.month, params.year);

  if (params.applicable === false) {
    return {
      status: "not_applicable",
      amountPaid,
      expectedAmount,
      hasHistoricalRate: !!storedExpected || params.rateForMonth > 0,
      isTolerated: false,
    };
  }

  if (amountPaid >= expectedAmount && expectedAmount > 0) {
    return {
      status: "paid",
      amountPaid,
      expectedAmount,
      hasHistoricalRate: !!storedExpected || params.rateForMonth > 0,
      isTolerated: false,
    };
  }

  if (amountPaid > 0) {
    return {
      status: "partial",
      amountPaid,
      expectedAmount,
      hasHistoricalRate: !!storedExpected || params.rateForMonth > 0,
      isTolerated: false,
    };
  }

  if (toleratedRecord) {
    return {
      status: "tolerated",
      amountPaid,
      expectedAmount,
      hasHistoricalRate: !!storedExpected || params.rateForMonth > 0,
      isTolerated: true,
      toleratedReason: toleratedRecord.reason,
      toleratedRecordId: toleratedRecord.id,
    };
  }

  return {
    status: "unpaid",
    amountPaid,
    expectedAmount,
    hasHistoricalRate: !!storedExpected || params.rateForMonth > 0,
    isTolerated: false,
  };
}

export async function getMonthlyDuesExceptionForMember(
  memberId: string,
  month: number,
  year: number
): Promise<MonthlyDuesException | undefined> {
  const exceptions = await getAllMonthlyDuesExceptions();
  return getActiveToleranceRecord(exceptions, memberId, month, year);
}

export async function markMemberMonthlyTolerance(data: {
  memberId: string;
  month: number;
  year: number;
  reason: string;
  createdBy: string;
  createdByRole: string;
}): Promise<MonthlyDuesException> {
  const exceptions = await getAllMonthlyDuesExceptions();
  const existing = getActiveToleranceRecord(exceptions, data.memberId, data.month, data.year);

  if (existing) {
    return dbUpdate<MonthlyDuesException>(MONTHLY_DUES_EXCEPTIONS_KEY, existing.id, {
      ...existing,
      reason: data.reason,
      createdBy: data.createdBy,
      createdByRole: data.createdByRole,
      createdAt: new Date().toISOString(),
      clearedAt: undefined,
      clearedBy: undefined,
      clearedByRole: undefined,
    });
  }

  return dbInsert<MonthlyDuesException>(MONTHLY_DUES_EXCEPTIONS_KEY, {
    id: generateId(),
    memberId: data.memberId,
    month: data.month,
    year: data.year,
    status: "tolerated",
    reason: data.reason,
    createdBy: data.createdBy,
    createdByRole: data.createdByRole,
    createdAt: new Date().toISOString(),
  });
}

export async function clearMemberMonthlyTolerance(data: {
  memberId: string;
  month: number;
  year: number;
  clearedBy: string;
  clearedByRole: string;
}): Promise<MonthlyDuesException | null> {
  const existing = await getMonthlyDuesExceptionForMember(data.memberId, data.month, data.year);
  if (!existing) return null;

  return dbUpdate<MonthlyDuesException>(MONTHLY_DUES_EXCEPTIONS_KEY, existing.id, {
    ...existing,
    clearedAt: new Date().toISOString(),
    clearedBy: data.clearedBy,
    clearedByRole: data.clearedByRole,
  });
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

// ============ MONTH LOCKING ============
// Months auto-lock on a configurable day of the following month (default: 5th).
// Example: If lock day is 5, January 2026 locks on February 5, 2026.
// Super admins can still override locked months.

const DEFAULT_LOCK_DAY = 5;

// Cache the lock day from settings to avoid async calls in synchronous functions
let _cachedLockDay: number = DEFAULT_LOCK_DAY;

export function setLockDay(day: number) {
  _cachedLockDay = Math.max(1, Math.min(28, day));
}

export function getLockDay(): number {
  return _cachedLockDay;
}

export function isMonthLocked(month: number, year: number): boolean {
  const lockDay = _cachedLockDay;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = now.getDate();

  // The lock date for a given month/year is the lock day of the next month
  let lockMonth = month + 1;
  let lockYear = year;
  if (lockMonth > 12) {
    lockMonth = 1;
    lockYear += 1;
  }

  // If we're past the lock date, the month is locked
  if (currentYear > lockYear) return true;
  if (currentYear === lockYear && currentMonth > lockMonth) return true;
  if (currentYear === lockYear && currentMonth === lockMonth && currentDay >= lockDay) return true;

  return false;
}

export function getMonthLockDate(month: number, year: number): Date {
  const lockDay = _cachedLockDay;
  let lockMonth = month; // 0-indexed for Date constructor (month param is 1-indexed)
  let lockYear = year;
  if (month >= 12) {
    lockMonth = 0;
    lockYear += 1;
  }
  return new Date(lockYear, lockMonth, lockDay);
}

export function getDaysUntilLock(month: number, year: number): number | null {
  if (isMonthLocked(month, year)) return null;
  const lockDate = getMonthLockDate(month, year);
  const now = new Date();
  const diffMs = lockDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getLockedMonthsForYear(year: number): number[] {
  const locked: number[] = [];
  for (let m = 1; m <= 12; m++) {
    if (isMonthLocked(m, year)) {
      locked.push(m);
    }
  }
  return locked;
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
  return dbQuery<Contribution>(CONTRIBUTIONS_KEY, 'member_id', memberId);
}

export async function getContributionsByMemberEmail(email: string): Promise<Contribution[]> {
  const all = await getAllContributions();
  return all.filter(c => c.memberEmail.toLowerCase() === email.toLowerCase());
}

export async function getContributionsByType(typeId: string): Promise<Contribution[]> {
  return dbQuery<Contribution>(CONTRIBUTIONS_KEY, 'type_id', typeId);
}

export async function getContributionsByMonth(month: number, year: number): Promise<Contribution[]> {
  const byMonth = await dbQuery<Contribution>(CONTRIBUTIONS_KEY, 'month', month);
  return byMonth.filter(c => c.year === year);
}

export async function getMemberMonthlyPayment(memberId: string, month: number, year: number): Promise<number> {
  const contributions = await getContributionsByMember(memberId);
  return contributions
    .filter(c => c.memberId === memberId && c.month === month && c.year === year && c.category === "monthly")
    .reduce((sum, c) => sum + c.amount, 0);
}

export async function getMemberMonthlyPaymentDetails(memberId: string, month: number, year: number): Promise<MonthlyDuesStatusDetails> {
  const [contributions, rateForMonth, exceptions] = await Promise.all([
    getContributionsByMember(memberId),
    getMonthlyRateForPeriod(month, year),
    getAllMonthlyDuesExceptions(),
  ]);

  return buildMonthlyDuesStatusDetails({
    memberId,
    month,
    year,
    contributions,
    rateForMonth,
    exceptions,
  });
}

export async function setMemberMonthlyPayment(
  memberId: string,
  memberName: string,
  memberEmail: string,
  month: number,
  year: number,
  amount: number,
  recordedBy: string,
  recordedByRole?: string,
  expectedAmount?: number,
  forceOverride?: boolean
): Promise<Contribution | null> {
  if (!forceOverride && isMonthLocked(month, year)) {
    // Check if there's an approved temporary unlock
    const tempUnlocked = await isMonthTemporarilyUnlocked(month, year, "contributions");
    if (!tempUnlocked) {
      throw new Error(`Month ${month}/${year} is locked. Contributions cannot be modified after the ${_cachedLockDay}th of the following month.`);
    }
  }
  const [contributions, types] = await Promise.all([
    getContributionsByMember(memberId),
    getAllContributionTypes(),
  ]);
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

  await clearMemberMonthlyTolerance({
    memberId,
    month,
    year,
    clearedBy: recordedBy,
    clearedByRole: recordedByRole || (forceOverride ? "super_admin" : "finance"),
  });

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

export async function deleteContribution(id: string, forceOverride?: boolean): Promise<boolean> {
  try {
    if (!forceOverride) {
      const contribution = await getContributionById(id);
      if (contribution && contribution.month && contribution.year && isMonthLocked(contribution.month, contribution.year)) {
        throw new Error(`Cannot delete: month ${contribution.month}/${contribution.year} is locked.`);
      }
    }
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
  toleratedMonths: { month: number; year: number; expectedAmount: number; reason: string }[];
  specialStatus: {
    typeId: string;
    typeName: string;
    expectedAmount: number;
    paidAmount: number;
    isPaid: boolean;
  }[];
  outstandingFines: number;
  totalOutstanding: number;
}

export async function getMemberContributionStatus(
  memberId: string,
  memberName: string,
  memberEmail: string
): Promise<MemberContributionStatus> {
  const [contributions, exceptions, types, members] = await Promise.all([
    getContributionsByMember(memberId),
    getAllMonthlyDuesExceptions(),
    getAllContributionTypes(),
    getAllMembers(),
  ]);

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
  const memberRecord = members.find((entry) => entry.id === memberId);
  const startMonth = memberRecord ? getMemberDuesStartMonth(memberRecord, currentYear) : 1;

  const unpaidMonths: { month: number; year: number; expectedAmount: number }[] = [];
  const toleratedMonths: { month: number; year: number; expectedAmount: number; reason: string }[] = [];
  for (let month = 1; month <= currentMonth; month++) {
    if (startMonth === null || month < startMonth) continue;
    const rateForMonth = await getMonthlyRateForPeriod(month, currentYear);
    const details = buildMonthlyDuesStatusDetails({
      memberId,
      month,
      year: currentYear,
      contributions,
      rateForMonth,
      exceptions,
    });
    if (details.status === "tolerated") {
      toleratedMonths.push({ month, year: currentYear, expectedAmount: details.expectedAmount, reason: details.toleratedReason || "" });
    } else if (details.status === "unpaid" && details.expectedAmount > 0) {
      unpaidMonths.push({ month, year: currentYear, expectedAmount: details.expectedAmount });
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

  const duesOutstanding = unpaidMonths.reduce((sum, m) => sum + m.expectedAmount, 0)
    + specialStatus.filter(s => !s.isPaid).reduce((sum, s) => sum + Math.max(0, s.expectedAmount - s.paidAmount), 0);
  const outstandingFines = await getOutstandingFineBalanceByMember(memberId);
  const totalOutstanding = duesOutstanding + outstandingFines;

  return {
    memberId,
    memberName,
    memberEmail,
    totalPaid,
    monthlyDuesPaid,
    specialContributions: specialContributionsTotal,
    paidMonths,
    unpaidMonths,
    toleratedMonths,
    specialStatus,
    outstandingFines,
    totalOutstanding,
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
  toleratedDues: number;
  toleratedMonthsCount: number;
  outstandingFines: number;
  totalOutstanding: number;
}

export async function getContributionStats(): Promise<ContributionStats> {
  const [contributions, members, exceptions] = await Promise.all([
    getAllContributions(),
    getAllMembers(),
    getAllMonthlyDuesExceptions(),
  ]);
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
  let toleratedDues = 0;
  let toleratedMonthsCount = 0;
  const activeMembers = members.filter(m => m.status === "Active");
  for (const member of activeMembers) {
    const startMonth = getMemberDuesStartMonth(member, currentYear);
    if (startMonth === null) continue;

    for (let month = startMonth; month <= currentMonth; month++) {
      const rateForMonth = await getMonthlyRateForPeriod(month, currentYear);
      const details = buildMonthlyDuesStatusDetails({
        memberId: member.id,
        month,
        year: currentYear,
        contributions,
        rateForMonth,
        exceptions,
      });

      if (details.status === "tolerated") {
        toleratedDues += details.expectedAmount;
        toleratedMonthsCount += 1;
      } else if (details.status === "unpaid") {
        outstandingDues += details.expectedAmount;
      } else if (details.status === "partial") {
        outstandingDues += Math.max(0, details.expectedAmount - details.amountPaid);
      }
    }
  }

  const outstandingFines = await getOutstandingFineBalanceTotal();
  const totalOutstanding = outstandingDues + outstandingFines;

  return {
    totalCollected,
    monthlyDuesCollected,
    specialContributions: specialContributionsTotal,
    thisMonthTotal,
    thisYearTotal,
    contributionCount: contributions.length,
    uniqueContributors,
    outstandingDues,
    toleratedDues,
    toleratedMonthsCount,
    outstandingFines,
    totalOutstanding,
  };
}

export async function getMonthlyDuesReport(month: number, year: number, members: { id: string; name: string; email: string }[]) {
  const [contributions, exceptions, allMembers] = await Promise.all([
    getAllContributions(),
    getAllMonthlyDuesExceptions(),
    getAllMembers(),
  ]);
  const rateForMonth = await getMonthlyRateForPeriod(month, year);

  return members.map(member => {
    const memberRecord = allMembers.find((entry) => entry.id === member.id);
    const startMonth = memberRecord ? getMemberDuesStartMonth(memberRecord, year) : 1;
    const details = buildMonthlyDuesStatusDetails({
      memberId: member.id,
      month,
      year,
      contributions,
      rateForMonth,
      exceptions,
      applicable: startMonth !== null && month >= startMonth,
    });
    const memberContributions = contributions.filter(
      c => c.memberId === member.id &&
           c.category === "monthly" &&
           c.month === month &&
           c.year === year
    );

    return {
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      expectedAmount: details.expectedAmount,
      paidAmount: details.amountPaid,
      isPaid: details.status === "paid",
      status: details.status,
      isTolerated: details.isTolerated,
      toleratedReason: details.toleratedReason,
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
