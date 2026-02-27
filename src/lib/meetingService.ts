// Meeting Minutes Service - manages choir meeting records

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, dbQuery, generateId } from './supabaseDB';

export type MeetingType = "general" | "committee" | "rehearsal" | "emergency" | "agm";

export interface MeetingAgendaItem {
  id: string;
  title: string;
  discussion: string;
  decision?: string;
  actionItem?: string;
  responsible?: string;
}

export interface MeetingMinutes {
  id: string;
  title: string;
  type: MeetingType;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  attendees: string[]; // Member names
  absentees?: string[];
  chairperson: string;
  secretary: string;
  agenda: MeetingAgendaItem[];
  openingPrayer?: string;
  closingPrayer?: string;
  nextMeetingDate?: string;
  attachments?: string[];
  notes?: string;
  status: "draft" | "approved";
  createdAt: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  googleEventId?: string;
  googleMeetLink?: string;
  googleEventLink?: string;
  googleConferenceId?: string;
}

export interface MeetingStats {
  totalMeetings: number;
  thisMonth: number;
  byType: Record<MeetingType, number>;
  drafts: number;
  approved: number;
}

const MEETINGS_KEY = "choir_meeting_minutes";

// ============ CRUD OPERATIONS ============

export async function getAllMeetings(): Promise<MeetingMinutes[]> {
  const meetings = await dbGetAll<MeetingMinutes>(MEETINGS_KEY);
  return meetings.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getMeetingById(id: string): Promise<MeetingMinutes | undefined> {
  const meeting = await dbGetById<MeetingMinutes>(MEETINGS_KEY, id);
  return meeting ?? undefined;
}

export async function getMeetingsByType(type: MeetingType): Promise<MeetingMinutes[]> {
  const meetings = await dbQuery<MeetingMinutes>(MEETINGS_KEY, 'type', type);
  return meetings.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getMeetingsByDateRange(startDate: string, endDate: string): Promise<MeetingMinutes[]> {
  const meetings = await dbGetAll<MeetingMinutes>(MEETINGS_KEY);
  return meetings
    .filter(m => m.date >= startDate && m.date <= endDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createMeeting(
  data: Omit<MeetingMinutes, "id" | "createdAt" | "status">
): Promise<MeetingMinutes> {
  const newMeeting = {
    ...data,
    id: generateId(),
    status: "draft" as const,
    createdAt: new Date().toISOString(),
    agenda: data.agenda || [],
  };
  return dbInsert<MeetingMinutes>(MEETINGS_KEY, newMeeting);
}

export async function updateMeeting(
  id: string,
  updates: Partial<MeetingMinutes>
): Promise<MeetingMinutes | null> {
  try {
    const existing = await dbGetById<MeetingMinutes>(MEETINGS_KEY, id);
    if (!existing) return null;

    const merged = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return await dbUpdate<MeetingMinutes>(MEETINGS_KEY, id, merged);
  } catch {
    return null;
  }
}

export async function approveMeeting(id: string, approvedBy: string): Promise<MeetingMinutes | null> {
  return updateMeeting(id, {
    status: "approved",
    approvedBy,
    approvedAt: new Date().toISOString(),
  });
}

export async function deleteMeeting(id: string): Promise<boolean> {
  try {
    const existing = await dbGetById<MeetingMinutes>(MEETINGS_KEY, id);
    if (!existing) return false;
    await dbDelete(MEETINGS_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// ============ AGENDA ITEMS ============

export async function addAgendaItem(
  meetingId: string,
  item: Omit<MeetingAgendaItem, "id">
): Promise<MeetingAgendaItem | null> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) return null;

  const newItem: MeetingAgendaItem = {
    ...item,
    id: `agenda_${Date.now()}`,
  };

  await updateMeeting(meetingId, {
    agenda: [...meeting.agenda, newItem],
  });

  return newItem;
}

export async function updateAgendaItem(
  meetingId: string,
  itemId: string,
  updates: Partial<MeetingAgendaItem>
): Promise<boolean> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) return false;

  const updatedAgenda = meeting.agenda.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );

  await updateMeeting(meetingId, { agenda: updatedAgenda });
  return true;
}

export async function deleteAgendaItem(meetingId: string, itemId: string): Promise<boolean> {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) return false;

  const filteredAgenda = meeting.agenda.filter(item => item.id !== itemId);
  await updateMeeting(meetingId, { agenda: filteredAgenda });
  return true;
}

// ============ STATS ============

export async function getMeetingStats(): Promise<MeetingStats> {
  const meetings = await dbGetAll<MeetingMinutes>(MEETINGS_KEY);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const byType: Record<MeetingType, number> = {
    general: 0,
    committee: 0,
    rehearsal: 0,
    emergency: 0,
    agm: 0,
  };

  let drafts = 0;
  let approved = 0;
  let thisMonthCount = 0;

  meetings.forEach(m => {
    byType[m.type]++;
    if (m.status === "draft") drafts++;
    else approved++;
    if (m.date.startsWith(thisMonth)) thisMonthCount++;
  });

  return {
    totalMeetings: meetings.length,
    thisMonth: thisMonthCount,
    byType,
    drafts,
    approved,
  };
}

// ============ UTILITIES (pure computation - stay sync) ============

export function getMeetingTypeLabel(type: MeetingType): string {
  const labels: Record<MeetingType, string> = {
    general: "General Meeting",
    committee: "Committee Meeting",
    rehearsal: "Rehearsal Meeting",
    emergency: "Emergency Meeting",
    agm: "Annual General Meeting",
  };
  return labels[type];
}

export function getMeetingTypeColor(type: MeetingType): string {
  const colors: Record<MeetingType, string> = {
    general: "text-blue-400 bg-blue-400/20",
    committee: "text-purple-400 bg-purple-400/20",
    rehearsal: "text-green-400 bg-green-400/20",
    emergency: "text-red-400 bg-red-400/20",
    agm: "text-primary bg-primary/20",
  };
  return colors[type];
}

export function exportMeetingToText(meeting: MeetingMinutes): string {
  const text = `
====================================
${meeting.title.toUpperCase()}
====================================

Date: ${meeting.date}
Time: ${meeting.startTime}${meeting.endTime ? ` - ${meeting.endTime}` : ""}
Location: ${meeting.location}
Type: ${getMeetingTypeLabel(meeting.type)}

Chairperson: ${meeting.chairperson}
Secretary: ${meeting.secretary}

ATTENDANCE:
${meeting.attendees.map(a => `  - ${a}`).join("\n")}
${meeting.absentees?.length ? `\nABSENTEES:\n${meeting.absentees.map(a => `  - ${a}`).join("\n")}` : ""}

${meeting.openingPrayer ? `Opening Prayer: ${meeting.openingPrayer}\n` : ""}

AGENDA & MINUTES:
${meeting.agenda.map((item, i) => `
${i + 1}. ${item.title}

Discussion:
${item.discussion}

${item.decision ? `Decision: ${item.decision}\n` : ""}${item.actionItem ? `Action Item: ${item.actionItem}${item.responsible ? ` (Responsible: ${item.responsible})` : ""}\n` : ""}`).join("\n---\n")}

${meeting.notes ? `\nADDITIONAL NOTES:\n${meeting.notes}\n` : ""}
${meeting.closingPrayer ? `Closing Prayer: ${meeting.closingPrayer}\n` : ""}
${meeting.nextMeetingDate ? `\nNext Meeting: ${meeting.nextMeetingDate}` : ""}

====================================
Status: ${meeting.status === "approved" ? `Approved by ${meeting.approvedBy} on ${meeting.approvedAt?.split("T")[0]}` : "Draft"}
====================================
`;
  return text.trim();
}

export async function exportMeetingsToCSV(): Promise<string> {
  const meetings = await getAllMeetings();

  const headers = [
    "Date",
    "Title",
    "Type",
    "Location",
    "Chairperson",
    "Secretary",
    "Attendees Count",
    "Agenda Items",
    "Status",
  ];

  const rows = meetings.map(m => [
    m.date,
    `"${m.title}"`,
    getMeetingTypeLabel(m.type),
    `"${m.location}"`,
    m.chairperson,
    m.secretary,
    m.attendees.length,
    m.agenda.length,
    m.status,
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
