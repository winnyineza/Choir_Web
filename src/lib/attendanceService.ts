// Attendance Service - Manages choir attendance records
// Supabase-based data management (via supabaseDB)

import {
  dbGetAll,
  dbGetById,
  dbInsert,
  dbUpdate,
  dbDelete,
  dbQuery,
  dbDeleteWhere,
  generateId,
} from './supabaseDB';
import { getMembersOnLeaveForDate } from './leaveService';

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberVoice: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  markedBy?: string;
  createdAt: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  title: string;
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  totalLate: number;
  createdAt: string;
  createdBy?: string;
}

const ATTENDANCE_KEY = 'choir_attendance';
const SESSIONS_KEY = 'choir_attendance_sessions';
export const ATTENDANCE_EDIT_WINDOW_DAYS = 3;

function parseAttendanceDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

export function getAttendanceEditDeadline(date: string): Date {
  const baseDate = parseAttendanceDate(date);
  const deadline = new Date(baseDate);
  deadline.setDate(deadline.getDate() + ATTENDANCE_EDIT_WINDOW_DAYS);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

export function canEditAttendanceDate(date: string, isSuperAdmin = false, now = new Date()): boolean {
  if (isSuperAdmin) return true;
  if (!date) return false;
  return now.getTime() <= getAttendanceEditDeadline(date).getTime();
}

function dedupeSessionsByDate(sessions: AttendanceSession[]): AttendanceSession[] {
  const latestByDate = new Map<string, AttendanceSession>();

  for (const session of sessions) {
    const existing = latestByDate.get(session.date);
    if (!existing) {
      latestByDate.set(session.date, session);
      continue;
    }

    const existingCreatedAt = new Date(existing.createdAt).getTime();
    const currentCreatedAt = new Date(session.createdAt).getTime();
    if (currentCreatedAt >= existingCreatedAt) {
      latestByDate.set(session.date, session);
    }
  }

  return [...latestByDate.values()];
}

// Attendance Records CRUD
export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  return dbGetAll<AttendanceRecord>(ATTENDANCE_KEY);
}

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  return dbQuery<AttendanceRecord>(ATTENDANCE_KEY, 'date', date);
}

export async function getAttendanceByMember(memberId: string): Promise<AttendanceRecord[]> {
  const records = await dbQuery<AttendanceRecord>(ATTENDANCE_KEY, 'member_id', memberId);
  return records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getAttendanceByMemberEmail(
  email: string
): Promise<AttendanceRecord[]> {
  const records = await getAllAttendanceRecords();
  return records
    .filter((r) => r.memberEmail.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getMemberAttendanceStats(memberId: string): Promise<{
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  percentage: number;
}> {
  const records = await getAttendanceByMember(memberId);
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const excused = records.filter((r) => r.status === 'excused').length;
  const late = records.filter((r) => r.status === 'late').length;
  const total = records.length;

  const attended = present + late;
  const countable = total - excused;
  const percentage = countable > 0 ? Math.round((attended / countable) * 100) : 100;

  return { total, present, absent, excused, late, percentage };
}

export async function getMemberAttendanceStatsByEmail(email: string): Promise<{
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  percentage: number;
  thisMonth: { attended: number; total: number; percentage: number };
}> {
  const records = await getAttendanceByMemberEmail(email);
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const excused = records.filter((r) => r.status === 'excused').length;
  const late = records.filter((r) => r.status === 'late').length;
  const total = records.length;

  const attended = present + late;
  const countable = total - excused;
  const percentage = countable > 0 ? Math.round((attended / countable) * 100) : 100;

  const now = new Date();
  const thisMonthRecords = records.filter((r) => {
    const recordDate = new Date(r.date);
    return (
      recordDate.getMonth() === now.getMonth() &&
      recordDate.getFullYear() === now.getFullYear()
    );
  });

  const thisMonthAttended = thisMonthRecords.filter(
    (r) => r.status === 'present' || r.status === 'late'
  ).length;
  const thisMonthExcused = thisMonthRecords.filter(
    (r) => r.status === 'excused'
  ).length;
  const thisMonthCountable = thisMonthRecords.length - thisMonthExcused;
  const thisMonthPercentage =
    thisMonthCountable > 0
      ? Math.round((thisMonthAttended / thisMonthCountable) * 100)
      : 100;

  return {
    total,
    present,
    absent,
    excused,
    late,
    percentage,
    thisMonth: {
      attended: thisMonthAttended,
      total: thisMonthRecords.length,
      percentage: thisMonthPercentage,
    },
  };
}

// Check if attendance was already taken for a date
export async function hasAttendanceForDate(date: string): Promise<boolean> {
  const records = await getAttendanceByDate(date);
  return records.length > 0;
}

// Save attendance for a session
export async function saveAttendance(
  date: string,
  records: Omit<AttendanceRecord, 'id' | 'date' | 'createdAt'>[],
  sessionTitle: string = 'Regular Practice',
  markedBy?: string
): Promise<AttendanceRecord[]> {
  // Remove existing records for this date
  await dbDeleteWhere(ATTENDANCE_KEY, 'date', date);

  const newRecords: AttendanceRecord[] = records.map((record) => ({
    ...record,
    id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date,
    markedBy,
    createdAt: new Date().toISOString(),
  }));

  await Promise.all(newRecords.map((record) => dbInsert<AttendanceRecord>(ATTENDANCE_KEY, record)));

  const persistedRecords = await getAttendanceByDate(date);
  if (persistedRecords.length !== newRecords.length) {
    throw new Error('Attendance details could not be fully saved. Please try again.');
  }

  await saveSession(date, sessionTitle, newRecords, markedBy);

  return newRecords;
}

// Sessions Management
export async function getAllSessions(): Promise<AttendanceSession[]> {
  const sessions = await dbGetAll<AttendanceSession>(SESSIONS_KEY);
  return dedupeSessionsByDate(sessions);
}

export async function saveSession(
  date: string,
  title: string,
  records: AttendanceRecord[],
  createdBy?: string
): Promise<AttendanceSession> {
  await dbDeleteWhere(SESSIONS_KEY, 'date', date);

  const session: Omit<AttendanceSession, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
  } = {
    id: `session_${Date.now()}`,
    date,
    title,
    totalPresent: records.filter((r) => r.status === 'present').length,
    totalAbsent: records.filter((r) => r.status === 'absent').length,
    totalExcused: records.filter((r) => r.status === 'excused').length,
    totalLate: records.filter((r) => r.status === 'late').length,
    createdAt: new Date().toISOString(),
    createdBy,
  };

  return dbInsert<AttendanceSession>(SESSIONS_KEY, session);
}

export async function getSessionByDate(
  date: string
): Promise<AttendanceSession | undefined> {
  const sessions = await dbQuery<AttendanceSession>(SESSIONS_KEY, 'date', date);
  return dedupeSessionsByDate(sessions)[0] ?? undefined;
}

// Get recent sessions
export async function getRecentSessions(
  limit: number = 10
): Promise<AttendanceSession[]> {
  const sessions = await getAllSessions();
  return sessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Delete attendance for a date
export async function deleteAttendanceForDate(date: string): Promise<boolean> {
  const records = await getAttendanceByDate(date);
  const sessions = await dbQuery<AttendanceSession>(SESSIONS_KEY, 'date', date);

  if (records.length === 0 && sessions.length === 0) return false;

  if (records.length > 0) {
    await dbDeleteWhere(ATTENDANCE_KEY, 'date', date);
  }

  if (sessions.length > 0) {
    await dbDeleteWhere(SESSIONS_KEY, 'date', date);
  }

  return true;
}

// Get members who should be marked excused for a date (have approved leave)
export async function getMembersToExcuse(
  date: string
): Promise<{ memberId: string; memberName: string; reason: string }[]> {
  const leaveRequests = await getMembersOnLeaveForDate(date);
  return leaveRequests.map((lr) => ({
    memberId: lr.memberId,
    memberName: lr.memberName,
    reason: lr.reason,
  }));
}

// Overall attendance stats
export async function getOverallAttendanceStats(): Promise<{
  totalSessions: number;
  avgAttendance: number;
  recentTrend: 'up' | 'down' | 'stable';
}> {
  const sessions = await getAllSessions();
  const totalSessions = sessions.length;

  if (totalSessions === 0) {
    return { totalSessions: 0, avgAttendance: 0, recentTrend: 'stable' };
  }

  const avgAttendance = Math.round(
    sessions.reduce((sum, s) => {
      const total = s.totalPresent + s.totalAbsent + s.totalLate;
      const attended = s.totalPresent + s.totalLate;
      return sum + (total > 0 ? (attended / total) * 100 : 0);
    }, 0) / totalSessions
  );

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sorted.length < 4) {
    return { totalSessions, avgAttendance, recentTrend: 'stable' };
  }

  const recent = sorted.slice(0, 3);
  const previous = sorted.slice(3, 6);

  const recentAvg =
    recent.reduce((sum, s) => {
      const total = s.totalPresent + s.totalAbsent + s.totalLate;
      const attended = s.totalPresent + s.totalLate;
      return sum + (total > 0 ? attended / total : 0);
    }, 0) / recent.length;

  const previousAvg =
    previous.reduce((sum, s) => {
      const total = s.totalPresent + s.totalAbsent + s.totalLate;
      const attended = s.totalPresent + s.totalLate;
      return sum + (total > 0 ? attended / total : 0);
    }, 0) / (previous.length || 1);

  const diff = recentAvg - previousAvg;
  const recentTrend =
    diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'stable';

  return { totalSessions, avgAttendance, recentTrend };
}

// Import attendance from CSV data (for Google Sheets import)
export async function importAttendanceFromCSV(
  csvData: {
    date: string;
    memberId: string;
    memberName: string;
    memberEmail: string;
    memberVoice: string;
    status: AttendanceStatus;
  }[]
): Promise<number> {
  const existingRecords = await getAllAttendanceRecords();
  const existingSet = new Set(
    existingRecords.map((r) => `${r.date}|${r.memberId}`)
  );
  let imported = 0;

  for (const row of csvData) {
    const key = `${row.date}|${row.memberId}`;
    if (existingSet.has(key)) continue;

    const record: AttendanceRecord = {
      id: `att_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...row,
      createdAt: new Date().toISOString(),
      notes: 'Imported from CSV',
    };
    await dbInsert<AttendanceRecord>(ATTENDANCE_KEY, record);
    existingSet.add(key);
    imported++;
  }

  return imported;
}
