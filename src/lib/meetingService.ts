// Meeting Minutes Service - manages choir meeting records

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
}

export interface MeetingStats {
  totalMeetings: number;
  thisMonth: number;
  byType: Record<MeetingType, number>;
  drafts: number;
  approved: number;
}

const MEETINGS_KEY = "choir_meeting_minutes";

function generateId(): string {
  return `mtg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ CRUD OPERATIONS ============

export function getAllMeetings(): MeetingMinutes[] {
  try {
    const stored = localStorage.getItem(MEETINGS_KEY);
    const meetings = stored ? JSON.parse(stored) : [];
    return meetings.sort((a: MeetingMinutes, b: MeetingMinutes) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}

function saveMeetings(meetings: MeetingMinutes[]): void {
  localStorage.setItem(MEETINGS_KEY, JSON.stringify(meetings));
}

export function getMeetingById(id: string): MeetingMinutes | undefined {
  return getAllMeetings().find(m => m.id === id);
}

export function getMeetingsByType(type: MeetingType): MeetingMinutes[] {
  return getAllMeetings().filter(m => m.type === type);
}

export function getMeetingsByDateRange(startDate: string, endDate: string): MeetingMinutes[] {
  return getAllMeetings().filter(m => m.date >= startDate && m.date <= endDate);
}

export function createMeeting(data: Omit<MeetingMinutes, "id" | "createdAt" | "status">): MeetingMinutes {
  const meetings = getAllMeetings();
  
  const newMeeting: MeetingMinutes = {
    ...data,
    id: generateId(),
    status: "draft",
    createdAt: new Date().toISOString(),
    agenda: data.agenda || [],
  };
  
  meetings.push(newMeeting);
  saveMeetings(meetings);
  return newMeeting;
}

export function updateMeeting(id: string, updates: Partial<MeetingMinutes>): MeetingMinutes | null {
  const meetings = getAllMeetings();
  const index = meetings.findIndex(m => m.id === id);
  if (index === -1) return null;
  
  meetings[index] = {
    ...meetings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveMeetings(meetings);
  return meetings[index];
}

export function approveMeeting(id: string, approvedBy: string): MeetingMinutes | null {
  return updateMeeting(id, {
    status: "approved",
    approvedBy,
    approvedAt: new Date().toISOString(),
  });
}

export function deleteMeeting(id: string): boolean {
  const meetings = getAllMeetings();
  const filtered = meetings.filter(m => m.id !== id);
  if (filtered.length === meetings.length) return false;
  
  saveMeetings(filtered);
  return true;
}

// ============ AGENDA ITEMS ============

export function addAgendaItem(meetingId: string, item: Omit<MeetingAgendaItem, "id">): MeetingAgendaItem | null {
  const meeting = getMeetingById(meetingId);
  if (!meeting) return null;
  
  const newItem: MeetingAgendaItem = {
    ...item,
    id: `agenda_${Date.now()}`,
  };
  
  updateMeeting(meetingId, {
    agenda: [...meeting.agenda, newItem],
  });
  
  return newItem;
}

export function updateAgendaItem(
  meetingId: string,
  itemId: string,
  updates: Partial<MeetingAgendaItem>
): boolean {
  const meeting = getMeetingById(meetingId);
  if (!meeting) return false;
  
  const updatedAgenda = meeting.agenda.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  
  updateMeeting(meetingId, { agenda: updatedAgenda });
  return true;
}

export function deleteAgendaItem(meetingId: string, itemId: string): boolean {
  const meeting = getMeetingById(meetingId);
  if (!meeting) return false;
  
  const filteredAgenda = meeting.agenda.filter(item => item.id !== itemId);
  updateMeeting(meetingId, { agenda: filteredAgenda });
  return true;
}

// ============ STATS ============

export function getMeetingStats(): MeetingStats {
  const meetings = getAllMeetings();
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

// ============ UTILITIES ============

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

export function exportMeetingsToCSV(): string {
  const meetings = getAllMeetings();
  
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

