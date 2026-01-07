// Attendance Service - Manages choir attendance records

import { getMembersOnLeaveForDate } from './leaveService';

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberVoice: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: AttendanceStatus;
  notes?: string;
  markedBy?: string;
  createdAt: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  title: string; // e.g., "Regular Practice", "Concert Rehearsal"
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  totalLate: number;
  createdAt: string;
  createdBy?: string;
}

const ATTENDANCE_KEY = 'choir_attendance';
const SESSIONS_KEY = 'choir_attendance_sessions';

// Attendance Records CRUD
export function getAllAttendanceRecords(): AttendanceRecord[] {
  const data = localStorage.getItem(ATTENDANCE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getAttendanceByDate(date: string): AttendanceRecord[] {
  return getAllAttendanceRecords().filter(r => r.date === date);
}

export function getAttendanceByMember(memberId: string): AttendanceRecord[] {
  return getAllAttendanceRecords()
    .filter(r => r.memberId === memberId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAttendanceByMemberEmail(email: string): AttendanceRecord[] {
  return getAllAttendanceRecords()
    .filter(r => r.memberEmail.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getMemberAttendanceStats(memberId: string): {
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  percentage: number;
} {
  const records = getAttendanceByMember(memberId);
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const late = records.filter(r => r.status === 'late').length;
  const total = records.length;
  
  // Count present + late as attended for percentage
  const attended = present + late;
  const countable = total - excused; // Don't count excused against them
  const percentage = countable > 0 ? Math.round((attended / countable) * 100) : 100;
  
  return { total, present, absent, excused, late, percentage };
}

export function getMemberAttendanceStatsByEmail(email: string): {
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  percentage: number;
  thisMonth: { attended: number; total: number; percentage: number };
} {
  const records = getAttendanceByMemberEmail(email);
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const late = records.filter(r => r.status === 'late').length;
  const total = records.length;
  
  // Count present + late as attended for percentage
  const attended = present + late;
  const countable = total - excused;
  const percentage = countable > 0 ? Math.round((attended / countable) * 100) : 100;
  
  // This month stats
  const now = new Date();
  const thisMonthRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate.getMonth() === now.getMonth() && 
           recordDate.getFullYear() === now.getFullYear();
  });
  
  const thisMonthAttended = thisMonthRecords.filter(r => 
    r.status === 'present' || r.status === 'late'
  ).length;
  const thisMonthExcused = thisMonthRecords.filter(r => r.status === 'excused').length;
  const thisMonthCountable = thisMonthRecords.length - thisMonthExcused;
  const thisMonthPercentage = thisMonthCountable > 0 
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
    }
  };
}

// Check if attendance was already taken for a date
export function hasAttendanceForDate(date: string): boolean {
  return getAttendanceByDate(date).length > 0;
}

// Save attendance for a session
export function saveAttendance(
  date: string, 
  records: Omit<AttendanceRecord, 'id' | 'date' | 'createdAt'>[],
  sessionTitle: string = 'Regular Practice',
  markedBy?: string
): AttendanceRecord[] {
  const allRecords = getAllAttendanceRecords();
  
  // Remove existing records for this date (to allow re-taking attendance)
  const filtered = allRecords.filter(r => r.date !== date);
  
  // Create new records
  const newRecords: AttendanceRecord[] = records.map(record => ({
    ...record,
    id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date,
    markedBy,
    createdAt: new Date().toISOString(),
  }));
  
  // Save all records
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([...filtered, ...newRecords]));
  
  // Save/update session
  saveSession(date, sessionTitle, newRecords, markedBy);
  
  // Trigger storage event
  window.dispatchEvent(new Event('storage'));
  
  return newRecords;
}

// Sessions Management
export function getAllSessions(): AttendanceSession[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSession(
  date: string, 
  title: string, 
  records: AttendanceRecord[],
  createdBy?: string
): AttendanceSession {
  const sessions = getAllSessions();
  
  // Remove existing session for this date
  const filtered = sessions.filter(s => s.date !== date);
  
  const session: AttendanceSession = {
    id: `session_${Date.now()}`,
    date,
    title,
    totalPresent: records.filter(r => r.status === 'present').length,
    totalAbsent: records.filter(r => r.status === 'absent').length,
    totalExcused: records.filter(r => r.status === 'excused').length,
    totalLate: records.filter(r => r.status === 'late').length,
    createdAt: new Date().toISOString(),
    createdBy,
  };
  
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([...filtered, session]));
  
  return session;
}

export function getSessionByDate(date: string): AttendanceSession | undefined {
  return getAllSessions().find(s => s.date === date);
}

// Get recent sessions
export function getRecentSessions(limit: number = 10): AttendanceSession[] {
  return getAllSessions()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Delete attendance for a date
export function deleteAttendanceForDate(date: string): boolean {
  const records = getAllAttendanceRecords();
  const filtered = records.filter(r => r.date !== date);
  
  if (filtered.length === records.length) return false;
  
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(filtered));
  
  // Also remove session
  const sessions = getAllSessions();
  const filteredSessions = sessions.filter(s => s.date !== date);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filteredSessions));
  
  window.dispatchEvent(new Event('storage'));
  
  return true;
}

// Get members who should be marked excused for a date (have approved leave)
export function getMembersToExcuse(date: string): { memberId: string; memberName: string; reason: string }[] {
  const leaveRequests = getMembersOnLeaveForDate(date);
  return leaveRequests.map(lr => ({
    memberId: lr.memberId,
    memberName: lr.memberName,
    reason: lr.reason,
  }));
}

// Overall attendance stats
export function getOverallAttendanceStats(): {
  totalSessions: number;
  avgAttendance: number;
  recentTrend: 'up' | 'down' | 'stable';
} {
  const sessions = getAllSessions();
  const totalSessions = sessions.length;
  
  if (totalSessions === 0) {
    return { totalSessions: 0, avgAttendance: 0, recentTrend: 'stable' };
  }
  
  // Calculate average attendance rate
  const avgAttendance = Math.round(
    sessions.reduce((sum, s) => {
      const total = s.totalPresent + s.totalAbsent + s.totalLate;
      const attended = s.totalPresent + s.totalLate;
      return sum + (total > 0 ? (attended / total) * 100 : 0);
    }, 0) / totalSessions
  );
  
  // Calculate trend (compare last 3 sessions to previous 3)
  const sorted = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  if (sorted.length < 4) {
    return { totalSessions, avgAttendance, recentTrend: 'stable' };
  }
  
  const recent = sorted.slice(0, 3);
  const previous = sorted.slice(3, 6);
  
  const recentAvg = recent.reduce((sum, s) => {
    const total = s.totalPresent + s.totalAbsent + s.totalLate;
    const attended = s.totalPresent + s.totalLate;
    return sum + (total > 0 ? (attended / total) : 0);
  }, 0) / recent.length;
  
  const previousAvg = previous.reduce((sum, s) => {
    const total = s.totalPresent + s.totalAbsent + s.totalLate;
    const attended = s.totalPresent + s.totalLate;
    return sum + (total > 0 ? (attended / total) : 0);
  }, 0) / (previous.length || 1);
  
  const diff = recentAvg - previousAvg;
  const recentTrend = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'stable';
  
  return { totalSessions, avgAttendance, recentTrend };
}

// Import attendance from CSV data (for Google Sheets import)
export function importAttendanceFromCSV(
  csvData: { date: string; memberId: string; memberName: string; memberEmail: string; memberVoice: string; status: AttendanceStatus }[]
): number {
  const records = getAllAttendanceRecords();
  let imported = 0;
  
  csvData.forEach(row => {
    // Check if record already exists
    const exists = records.some(r => r.date === row.date && r.memberId === row.memberId);
    if (!exists) {
      records.push({
        id: `att_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...row,
        createdAt: new Date().toISOString(),
        notes: 'Imported from CSV',
      });
      imported++;
    }
  });
  
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event('storage'));
  
  return imported;
}

