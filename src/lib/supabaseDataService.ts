// Supabase Data Service - Primary data store with localStorage fallback
import { supabase, isSupabaseConfigured } from './supabase';

// ============ TYPES ============

export interface EmergencyContact {
  name: string;
  relationship: "Spouse" | "Parent" | "Sibling" | "Child" | "Friend" | "Other";
  phone: string;
  altPhone?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  voice: "Soprano" | "Alto" | "Tenor" | "Bass";
  status: "Active" | "Pending" | "Inactive";
  joinedDate: string;
  photo?: string;
  dateOfBirth?: string;
  emergencyContact?: EmergencyContact;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: "Concert" | "Revival" | "Workshop" | "Fellowship" | "Other";
  image?: string;
  isFree: boolean;
  tickets: EventTicket[];
  createdAt: string;
  status?: "draft" | "published" | "cancelled";
  livestreamUrl?: string;
  isLive?: boolean;
}

export interface EventTicket {
  id: string;
  name: string;
  price: number;
  description: string;
  available: number;
  sold: number;
  maxPerPerson: number;
  perks?: string[];
}

// ============ HELPER: Convert DB row to App format ============

function dbMemberToApp(row: any): Member {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    voice: row.voice,
    status: row.status,
    joinedDate: row.joined_date,
    photo: row.photo || undefined,
    dateOfBirth: row.date_of_birth || undefined,
    emergencyContact: row.emergency_contact_name ? {
      name: row.emergency_contact_name,
      phone: row.emergency_contact_phone || '',
      relationship: row.emergency_contact_relationship || 'Other',
    } : undefined,
  };
}

function appMemberToDb(member: Partial<Member>): any {
  const db: any = {};
  if (member.name !== undefined) db.name = member.name;
  if (member.email !== undefined) db.email = member.email;
  if (member.phone !== undefined) db.phone = member.phone;
  if (member.voice !== undefined) db.voice = member.voice;
  if (member.status !== undefined) db.status = member.status;
  if (member.joinedDate !== undefined) db.joined_date = member.joinedDate;
  if (member.photo !== undefined) db.photo = member.photo;
  if (member.dateOfBirth !== undefined) db.date_of_birth = member.dateOfBirth;
  if (member.emergencyContact) {
    db.emergency_contact_name = member.emergencyContact.name;
    db.emergency_contact_phone = member.emergencyContact.phone;
    db.emergency_contact_relationship = member.emergencyContact.relationship;
  }
  return db;
}

function dbEventToApp(row: any, tickets: any[] = []): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    date: row.date,
    time: row.time,
    location: row.location || '',
    category: row.category || 'Other',
    image: row.image || undefined,
    isFree: row.is_free ?? true,
    tickets: tickets.map(t => ({
      id: t.id,
      name: t.name,
      price: Number(t.price),
      description: '',
      available: t.quantity,
      sold: t.sold || 0,
      maxPerPerson: 10,
    })),
    createdAt: row.created_at,
    status: row.status || 'draft',
    livestreamUrl: row.livestream_url || undefined,
    isLive: row.is_live || false,
  };
}

// ============ MEMBERS ============

export async function getAllMembersAsync(): Promise<Member[]> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const stored = localStorage.getItem('serenades_members');
    return stored ? JSON.parse(stored) : [];
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching members:', error);
    // Fallback to localStorage
    const stored = localStorage.getItem('serenades_members');
    return stored ? JSON.parse(stored) : [];
  }

  const members = data.map(dbMemberToApp);
  // Cache in localStorage
  localStorage.setItem('serenades_members', JSON.stringify(members));
  return members;
}

export async function addMemberAsync(member: Omit<Member, "id" | "joinedDate">): Promise<Member> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const members = JSON.parse(localStorage.getItem('serenades_members') || '[]');
    const newMember: Member = {
      ...member,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      joinedDate: new Date().toISOString(),
    };
    members.push(newMember);
    localStorage.setItem('serenades_members', JSON.stringify(members));
    return newMember;
  }

  const dbData = appMemberToDb(member);
  dbData.joined_date = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('members')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('Error adding member:', error);
    throw new Error(error.message);
  }

  return dbMemberToApp(data);
}

export async function updateMemberAsync(id: string, updates: Partial<Member>): Promise<Member | null> {
  if (!isSupabaseConfigured()) {
    const members = JSON.parse(localStorage.getItem('serenades_members') || '[]');
    const index = members.findIndex((m: Member) => m.id === id);
    if (index === -1) return null;
    members[index] = { ...members[index], ...updates };
    localStorage.setItem('serenades_members', JSON.stringify(members));
    return members[index];
  }

  const dbData = appMemberToDb(updates);

  const { data, error } = await supabase
    .from('members')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating member:', error);
    return null;
  }

  return dbMemberToApp(data);
}

export async function deleteMemberAsync(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const members = JSON.parse(localStorage.getItem('serenades_members') || '[]');
    const filtered = members.filter((m: Member) => m.id !== id);
    if (filtered.length === members.length) return false;
    localStorage.setItem('serenades_members', JSON.stringify(filtered));
    return true;
  }

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting member:', error);
    return false;
  }

  return true;
}

export async function getMemberByIdAsync(id: string): Promise<Member | null> {
  if (!isSupabaseConfigured()) {
    const members = JSON.parse(localStorage.getItem('serenades_members') || '[]');
    return members.find((m: Member) => m.id === id) || null;
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching member:', error);
    return null;
  }

  return dbMemberToApp(data);
}

export async function getMemberByEmailAsync(email: string): Promise<Member | null> {
  if (!isSupabaseConfigured()) {
    const members = JSON.parse(localStorage.getItem('serenades_members') || '[]');
    return members.find((m: Member) => m.email.toLowerCase() === email.toLowerCase()) || null;
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .ilike('email', email)
    .single();

  if (error) {
    return null;
  }

  return dbMemberToApp(data);
}

// ============ EVENTS ============

export async function getAllEventsAsync(): Promise<Event[]> {
  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('serenades_events');
    return stored ? JSON.parse(stored) : [];
  }

  // Fetch events with their tickets
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    const stored = localStorage.getItem('serenades_events');
    return stored ? JSON.parse(stored) : [];
  }

  // Fetch tickets for all events
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*');

  const ticketsByEvent = (tickets || []).reduce((acc: any, t: any) => {
    if (!acc[t.event_id]) acc[t.event_id] = [];
    acc[t.event_id].push(t);
    return acc;
  }, {});

  const appEvents = events.map(e => dbEventToApp(e, ticketsByEvent[e.id] || []));
  localStorage.setItem('serenades_events', JSON.stringify(appEvents));
  return appEvents;
}

export async function addEventAsync(event: Omit<Event, "id" | "createdAt">): Promise<Event> {
  if (!isSupabaseConfigured()) {
    const events = JSON.parse(localStorage.getItem('serenades_events') || '[]');
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date().toISOString(),
    };
    events.push(newEvent);
    localStorage.setItem('serenades_events', JSON.stringify(events));
    return newEvent;
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      image: event.image,
      is_free: event.isFree,
      status: event.status || 'draft',
      livestream_url: event.livestreamUrl,
      is_live: event.isLive || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding event:', error);
    throw new Error(error.message);
  }

  // Add tickets
  if (event.tickets && event.tickets.length > 0) {
    const ticketsToInsert = event.tickets.map(t => ({
      event_id: data.id,
      name: t.name,
      price: t.price,
      quantity: t.available,
      sold: t.sold || 0,
    }));

    await supabase.from('tickets').insert(ticketsToInsert);
  }

  return dbEventToApp(data, event.tickets);
}

export async function updateEventAsync(id: string, updates: Partial<Event>): Promise<Event | null> {
  if (!isSupabaseConfigured()) {
    const events = JSON.parse(localStorage.getItem('serenades_events') || '[]');
    const index = events.findIndex((e: Event) => e.id === id);
    if (index === -1) return null;
    events[index] = { ...events[index], ...updates };
    localStorage.setItem('serenades_events', JSON.stringify(events));
    return events[index];
  }

  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.time !== undefined) dbUpdates.time = updates.time;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.isFree !== undefined) dbUpdates.is_free = updates.isFree;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.livestreamUrl !== undefined) dbUpdates.livestream_url = updates.livestreamUrl;
  if (updates.isLive !== undefined) dbUpdates.is_live = updates.isLive;

  const { data, error } = await supabase
    .from('events')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    return null;
  }

  // Handle ticket updates if provided
  if (updates.tickets) {
    // Delete existing tickets and insert new ones
    await supabase.from('tickets').delete().eq('event_id', id);
    
    if (updates.tickets.length > 0) {
      const ticketsToInsert = updates.tickets.map(t => ({
        event_id: id,
        name: t.name,
        price: t.price,
        quantity: t.available,
        sold: t.sold || 0,
      }));
      await supabase.from('tickets').insert(ticketsToInsert);
    }
  }

  // Fetch updated tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', id);

  return dbEventToApp(data, tickets || []);
}

export async function deleteEventAsync(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const events = JSON.parse(localStorage.getItem('serenades_events') || '[]');
    const filtered = events.filter((e: Event) => e.id !== id);
    if (filtered.length === events.length) return false;
    localStorage.setItem('serenades_events', JSON.stringify(filtered));
    return true;
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting event:', error);
    return false;
  }

  return true;
}

export async function getEventByIdAsync(id: string): Promise<Event | null> {
  if (!isSupabaseConfigured()) {
    const events = JSON.parse(localStorage.getItem('serenades_events') || '[]');
    return events.find((e: Event) => e.id === id) || null;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', id);

  return dbEventToApp(data, tickets || []);
}

// ============ CONTRIBUTIONS ============

export interface Contribution {
  id: string;
  memberId: string;
  type: string;
  category: 'monthly_dues' | 'special' | 'tithe' | 'offering' | 'other';
  amount: number;
  month?: number;
  year?: number;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export async function getAllContributionsAsync(): Promise<Contribution[]> {
  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('choir_contributions');
    return stored ? JSON.parse(stored) : [];
  }

  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contributions:', error);
    const stored = localStorage.getItem('choir_contributions');
    return stored ? JSON.parse(stored) : [];
  }

  return data.map((row: any) => ({
    id: row.id,
    memberId: row.member_id,
    type: row.type,
    category: row.category,
    amount: Number(row.amount),
    month: row.month,
    year: row.year,
    notes: row.notes,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  }));
}

export async function addContributionAsync(contribution: Omit<Contribution, 'id' | 'createdAt'>): Promise<Contribution> {
  if (!isSupabaseConfigured()) {
    const contributions = JSON.parse(localStorage.getItem('choir_contributions') || '[]');
    const newContribution: Contribution = {
      ...contribution,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date().toISOString(),
    };
    contributions.push(newContribution);
    localStorage.setItem('choir_contributions', JSON.stringify(contributions));
    return newContribution;
  }

  const { data, error } = await supabase
    .from('contributions')
    .insert({
      member_id: contribution.memberId,
      type: contribution.type,
      category: contribution.category,
      amount: contribution.amount,
      month: contribution.month,
      year: contribution.year,
      notes: contribution.notes,
      recorded_by: contribution.recordedBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding contribution:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    memberId: data.member_id,
    type: data.type,
    category: data.category,
    amount: Number(data.amount),
    month: data.month,
    year: data.year,
    notes: data.notes,
    recordedBy: data.recorded_by,
    createdAt: data.created_at,
  };
}

// ============ ATTENDANCE ============

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string;
  sessionTitle?: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
  createdAt: string;
}

export async function getAllAttendanceAsync(): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('choir_attendance');
    return stored ? JSON.parse(stored) : [];
  }

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance:', error);
    const stored = localStorage.getItem('choir_attendance');
    return stored ? JSON.parse(stored) : [];
  }

  return data.map((row: any) => ({
    id: row.id,
    memberId: row.member_id,
    date: row.date,
    sessionTitle: row.session_title,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

export async function recordAttendanceAsync(record: Omit<AttendanceRecord, 'id' | 'createdAt'>): Promise<AttendanceRecord> {
  if (!isSupabaseConfigured()) {
    const attendance = JSON.parse(localStorage.getItem('choir_attendance') || '[]');
    const newRecord: AttendanceRecord = {
      ...record,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date().toISOString(),
    };
    attendance.push(newRecord);
    localStorage.setItem('choir_attendance', JSON.stringify(attendance));
    return newRecord;
  }

  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      member_id: record.memberId,
      date: record.date,
      session_title: record.sessionTitle,
      status: record.status,
      notes: record.notes,
    }, {
      onConflict: 'member_id,date',
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording attendance:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    memberId: data.member_id,
    date: data.date,
    sessionTitle: data.session_title,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

// ============ AUDIT LOGS ============

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export async function addAuditLogAsync(
  user: { id: string; email: string; name: string },
  action: string,
  details?: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const logs = JSON.parse(localStorage.getItem('choir_audit_logs') || '[]');
    logs.unshift({
      id: Date.now().toString(36),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action,
      details,
      createdAt: new Date().toISOString(),
    });
    // Keep only last 1000 logs
    localStorage.setItem('choir_audit_logs', JSON.stringify(logs.slice(0, 1000)));
    return;
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    user_email: user.email,
    user_name: user.name,
    action,
    details,
  });
}

export async function getAuditLogsAsync(limit = 100): Promise<AuditLog[]> {
  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('choir_audit_logs');
    const logs = stored ? JSON.parse(stored) : [];
    return logs.slice(0, limit);
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    action: row.action,
    details: row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  }));
}

// ============ LOGIN RATE LIMITING ============

export async function checkRateLimitAsync(email: string): Promise<{
  isLocked: boolean;
  failedAttempts: number;
  lockoutUntil?: Date;
}> {
  if (!isSupabaseConfigured()) {
    // Basic localStorage rate limiting
    const key = `login_attempts_${email}`;
    const stored = localStorage.getItem(key);
    if (!stored) return { isLocked: false, failedAttempts: 0 };
    
    const data = JSON.parse(stored);
    const now = Date.now();
    
    // Reset if more than 15 minutes old
    if (now - data.lastAttempt > 15 * 60 * 1000) {
      localStorage.removeItem(key);
      return { isLocked: false, failedAttempts: 0 };
    }
    
    if (data.lockedUntil && now < data.lockedUntil) {
      return {
        isLocked: true,
        failedAttempts: data.count,
        lockoutUntil: new Date(data.lockedUntil),
      };
    }
    
    return { isLocked: false, failedAttempts: data.count };
  }

  const { data, error } = await supabase.rpc('check_login_rate_limit', {
    check_email: email,
  });

  if (error) {
    console.error('Error checking rate limit:', error);
    return { isLocked: false, failedAttempts: 0 };
  }

  const result = data?.[0];
  return {
    isLocked: result?.is_locked || false,
    failedAttempts: result?.failed_attempts || 0,
    lockoutUntil: result?.lockout_until ? new Date(result.lockout_until) : undefined,
  };
}

export async function recordLoginAttemptAsync(email: string, success: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const key = `login_attempts_${email}`;
    const now = Date.now();
    
    if (success) {
      localStorage.removeItem(key);
      return;
    }
    
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : { count: 0, lastAttempt: 0 };
    
    data.count++;
    data.lastAttempt = now;
    
    // Lock after 5 attempts for 5 minutes, after 10 for 1 hour
    if (data.count >= 10) {
      data.lockedUntil = now + 60 * 60 * 1000; // 1 hour
    } else if (data.count >= 5) {
      data.lockedUntil = now + 5 * 60 * 1000; // 5 minutes
    }
    
    localStorage.setItem(key, JSON.stringify(data));
    return;
  }

  await supabase.from('login_attempts').insert({
    email,
    success,
  });
}

// ============ SYNC HELPERS ============

// Sync localStorage data to Supabase (one-time migration)
export async function syncLocalStorageToSupabase(): Promise<{
  members: number;
  events: number;
  contributions: number;
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  let syncedMembers = 0;
  let syncedEvents = 0;
  let syncedContributions = 0;

  // Sync members
  const localMembers = JSON.parse(localStorage.getItem('serenades_members') || '[]');
  for (const member of localMembers) {
    try {
      await supabase.from('members').upsert({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        voice: member.voice,
        status: member.status,
        joined_date: member.joinedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        date_of_birth: member.dateOfBirth,
        photo: member.photo,
        emergency_contact_name: member.emergencyContact?.name,
        emergency_contact_phone: member.emergencyContact?.phone,
        emergency_contact_relationship: member.emergencyContact?.relationship,
      });
      syncedMembers++;
    } catch (e) {
      console.error('Error syncing member:', member.name, e);
    }
  }

  // Sync events
  const localEvents = JSON.parse(localStorage.getItem('serenades_events') || '[]');
  for (const event of localEvents) {
    try {
      await supabase.from('events').upsert({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        image: event.image,
        is_free: event.isFree,
        status: event.status || 'published',
        livestream_url: event.livestreamUrl,
        is_live: event.isLive || false,
      });
      syncedEvents++;
    } catch (e) {
      console.error('Error syncing event:', event.title, e);
    }
  }

  // Sync contributions
  const localContributions = JSON.parse(localStorage.getItem('choir_contributions') || '[]');
  for (const contrib of localContributions) {
    try {
      await supabase.from('contributions').upsert({
        id: contrib.id,
        member_id: contrib.memberId,
        type: contrib.type,
        category: contrib.category || 'other',
        amount: contrib.amount,
        month: contrib.month,
        year: contrib.year,
        notes: contrib.notes,
        recorded_by: contrib.recordedBy,
      });
      syncedContributions++;
    } catch (e) {
      console.error('Error syncing contribution:', e);
    }
  }

  return {
    members: syncedMembers,
    events: syncedEvents,
    contributions: syncedContributions,
  };
}
