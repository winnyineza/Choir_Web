// Backup & Restore Service - Export/Import data as ZIP
// Reads from and writes to Supabase when configured

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase, isSupabaseConfigured } from './supabaseDB';

// Define all data keys for backup (used for localStorage fallback and key mapping)
const BACKUP_KEYS = {
  // Main data
  members: 'serenades_members',
  events: 'serenades_events',
  gallery: 'serenades_gallery',
  donations: 'serenades_donations',
  settings: 'serenades_settings',
  eventStaff: 'serenades_event_staff',
  scanRecords: 'serenades_scan_records',

  // Admin & Auth
  adminUsers: 'choir_admin_users',
  auditLogs: 'choir_audit_logs',

  // Financial
  contributions: 'choir_contributions',
  expenses: 'choir_expenses',

  // Records
  attendance: 'choir_attendance',
  leaveRequests: 'choir_leave_requests',
  disciplinaryRecords: 'choir_disciplinary_records',

  // Content
  announcements: 'choir_announcements',
  documents: 'choir_documents',
  meetingMinutes: 'choir_meeting_minutes',
  inventory: 'choir_inventory',

  // Other
  promoCodes: 'choir_promo_codes',
  musicReleases: 'choir_music_releases',
  contactSubmissions: 'choir_contact_submissions',
  auditions: 'choir_auditions',
};

const LAST_BACKUP_KEY = 'choir_last_backup';

export interface BackupMetadata {
  version: string;
  createdAt: string;
  source: 'localStorage' | 'supabase';
  recordCounts: Record<string, number>;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: Record<string, any[]>;
}

// Supabase tables to export (matches exportSupabaseBackup)
const SUPABASE_TABLES = [
  'members',
  'events',
  'contributions',
  'attendance',
  'admin_users',
  'audit_logs',
  'leave_requests',
  'expenses',
  'announcements',
  'disciplinary_records',
  'inventory',
  'documents',
  'meeting_minutes',
  'gallery_albums',
  'gallery_images',
  'music_releases',
  'promo_codes',
  'contact_submissions',
  'donations',
  'auditions',
  'tickets',
  'ticket_orders',
];

// ============ EXPORT FUNCTIONS ============

/**
 * Export all data from localStorage as a backup (fallback when Supabase not configured)
 */
export function exportLocalStorageBackup(): BackupData {
  const data: Record<string, any[]> = {};
  const recordCounts: Record<string, number> = {};

  for (const [key, storageKey] of Object.entries(BACKUP_KEYS)) {
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    data[key] = Array.isArray(parsed) ? parsed : [parsed];
    recordCounts[key] = Array.isArray(parsed) ? parsed.length : parsed ? 1 : 0;
  }

  return {
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      source: 'localStorage',
      recordCounts,
    },
    data,
  };
}

/**
 * Export all data from Supabase as a backup
 */
export async function exportSupabaseBackup(): Promise<BackupData> {
  if (!isSupabaseConfigured()) {
    return exportLocalStorageBackup();
  }

  const data: Record<string, any[]> = {};
  const recordCounts: Record<string, number> = {};

  for (const table of SUPABASE_TABLES) {
    try {
      const { data: tableData, error } = await supabase.from(table).select('*');

      if (!error && tableData) {
        data[table] = tableData;
        recordCounts[table] = tableData.length;
      } else {
        data[table] = [];
        recordCounts[table] = 0;
      }
    } catch (e) {
      console.warn(`Failed to export table ${table}:`, e);
      data[table] = [];
      recordCounts[table] = 0;
    }
  }

  return {
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      source: 'supabase',
      recordCounts,
    },
    data,
  };
}

/**
 * Create and download a ZIP backup file
 */
export async function downloadBackup(
  source: 'localStorage' | 'supabase' | 'auto' = 'auto'
): Promise<{ success: boolean; fileName: string; recordCount: number }> {
  try {
    let backupData: BackupData;

    if (source === 'supabase' || (source === 'auto' && isSupabaseConfigured())) {
      backupData = await exportSupabaseBackup();
    } else {
      backupData = exportLocalStorageBackup();
    }

    // Create ZIP file
    const zip = new JSZip();

    zip.file('metadata.json', JSON.stringify(backupData.metadata, null, 2));
    zip.file('data.json', JSON.stringify(backupData.data, null, 2));

    const tablesFolder = zip.folder('tables');
    if (tablesFolder) {
      for (const [key, records] of Object.entries(backupData.data)) {
        if (records.length > 0) {
          tablesFolder.file(`${key}.json`, JSON.stringify(records, null, 2));
        }
      }
    }

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `choir-backup-${timestamp}.zip`;

    saveAs(content, fileName);

    const totalRecords = Object.values(backupData.metadata.recordCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      success: true,
      fileName,
      recordCount: totalRecords,
    };
  } catch (error) {
    console.error('Backup failed:', error);
    return {
      success: false,
      fileName: '',
      recordCount: 0,
    };
  }
}

// ============ IMPORT FUNCTIONS ============

/**
 * Read and parse a backup ZIP file
 */
export async function readBackupFile(file: File): Promise<BackupData | null> {
  try {
    const zip = await JSZip.loadAsync(file);

    const metadataFile = zip.file('metadata.json');
    if (!metadataFile) {
      throw new Error('Invalid backup: missing metadata.json');
    }
    const metadata = JSON.parse(await metadataFile.async('string')) as BackupMetadata;

    const dataFile = zip.file('data.json');
    if (!dataFile) {
      throw new Error('Invalid backup: missing data.json');
    }
    const data = JSON.parse(await dataFile.async('string'));

    return { metadata, data };
  } catch (error) {
    console.error('Failed to read backup file:', error);
    return null;
  }
}

/**
 * Restore backup to localStorage (fallback when Supabase not configured)
 */
export function restoreToLocalStorage(backupData: BackupData): {
  success: boolean;
  restored: number;
  errors: string[];
} {
  const errors: string[] = [];
  let restored = 0;

  const keyMapping: Record<string, string> = {
    members: BACKUP_KEYS.members,
    events: BACKUP_KEYS.events,
    gallery: BACKUP_KEYS.gallery,
    donations: BACKUP_KEYS.donations,
    settings: BACKUP_KEYS.settings,
    eventStaff: BACKUP_KEYS.eventStaff,
    scanRecords: BACKUP_KEYS.scanRecords,
    adminUsers: BACKUP_KEYS.adminUsers,
    admin_users: BACKUP_KEYS.adminUsers,
    auditLogs: BACKUP_KEYS.auditLogs,
    audit_logs: BACKUP_KEYS.auditLogs,
    contributions: BACKUP_KEYS.contributions,
    expenses: BACKUP_KEYS.expenses,
    attendance: BACKUP_KEYS.attendance,
    leaveRequests: BACKUP_KEYS.leaveRequests,
    leave_requests: BACKUP_KEYS.leaveRequests,
    disciplinaryRecords: BACKUP_KEYS.disciplinaryRecords,
    disciplinary_records: BACKUP_KEYS.disciplinaryRecords,
    announcements: BACKUP_KEYS.announcements,
    documents: BACKUP_KEYS.documents,
    meetingMinutes: BACKUP_KEYS.meetingMinutes,
    meeting_minutes: BACKUP_KEYS.meetingMinutes,
    inventory: BACKUP_KEYS.inventory,
    promoCodes: BACKUP_KEYS.promoCodes,
    promo_codes: BACKUP_KEYS.promoCodes,
    musicReleases: BACKUP_KEYS.musicReleases,
    music_releases: BACKUP_KEYS.musicReleases,
    contactSubmissions: BACKUP_KEYS.contactSubmissions,
    contact_submissions: BACKUP_KEYS.contactSubmissions,
    auditions: BACKUP_KEYS.auditions,
  };

  for (const [key, records] of Object.entries(backupData.data)) {
    try {
      const storageKey = keyMapping[key];
      if (storageKey && records && records.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(records));
        restored += records.length;
      }
    } catch (error) {
      errors.push(`Failed to restore ${key}: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    restored,
    errors,
  };
}

/**
 * Restore backup to Supabase
 */
export async function restoreToSupabase(backupData: BackupData): Promise<{
  success: boolean;
  restored: number;
  errors: string[];
}> {
  if (!isSupabaseConfigured()) {
    return restoreToLocalStorage(backupData);
  }

  const errors: string[] = [];
  let restored = 0;

  const tableMapping: Record<string, string> = {
    members: 'members',
    events: 'events',
    contributions: 'contributions',
    attendance: 'attendance',
    admin_users: 'admin_users',
    adminUsers: 'admin_users',
    leave_requests: 'leave_requests',
    leaveRequests: 'leave_requests',
    expenses: 'expenses',
    announcements: 'announcements',
    disciplinary_records: 'disciplinary_records',
    disciplinaryRecords: 'disciplinary_records',
    inventory: 'inventory',
    documents: 'documents',
    meeting_minutes: 'meeting_minutes',
    meetingMinutes: 'meeting_minutes',
    gallery_albums: 'gallery_albums',
    gallery_images: 'gallery_images',
    music_releases: 'music_releases',
    musicReleases: 'music_releases',
    promo_codes: 'promo_codes',
    promoCodes: 'promo_codes',
    contact_submissions: 'contact_submissions',
    contactSubmissions: 'contact_submissions',
    donations: 'donations',
    auditions: 'auditions',
  };

  for (const [key, records] of Object.entries(backupData.data)) {
    const tableName = tableMapping[key];
    if (!tableName || !records || records.length === 0) continue;

    try {
      const { error } = await supabase
        .from(tableName)
        .upsert(records, { onConflict: 'id' });

      if (error) {
        errors.push(`${tableName}: ${error.message}`);
      } else {
        restored += records.length;
      }
    } catch (error: any) {
      errors.push(`${tableName}: ${error.message || 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    restored,
    errors,
  };
}

/**
 * Full restore process from file
 */
export async function restoreFromFile(
  file: File,
  target: 'localStorage' | 'supabase' | 'both' = 'both'
): Promise<{
  success: boolean;
  restored: number;
  errors: string[];
  metadata: BackupMetadata | null;
}> {
  const backupData = await readBackupFile(file);

  if (!backupData) {
    return {
      success: false,
      restored: 0,
      errors: ["Failed to read backup file. Make sure it's a valid backup ZIP."],
      metadata: null,
    };
  }

  let totalRestored = 0;
  const allErrors: string[] = [];

  if (target === 'localStorage' || target === 'both') {
    const localResult = restoreToLocalStorage(backupData);
    totalRestored += localResult.restored;
    allErrors.push(...localResult.errors.map((e) => `[localStorage] ${e}`));
  }

  if ((target === 'supabase' || target === 'both') && isSupabaseConfigured()) {
    const supaResult = await restoreToSupabase(backupData);
    totalRestored += supaResult.restored;
    allErrors.push(...supaResult.errors.map((e) => `[Supabase] ${e}`));
  }

  return {
    success: allErrors.length === 0,
    restored: totalRestored,
    errors: allErrors,
    metadata: backupData.metadata,
  };
}

// ============ UTILITY FUNCTIONS ============

/**
 * Get backup statistics - reads from Supabase when configured, else localStorage
 */
export async function getBackupStats(): Promise<{
  localStorage: { tables: number; records: number };
  supabase?: { tables: number; records: number };
  lastBackup?: string;
}> {
  if (isSupabaseConfigured()) {
    let records = 0;
    let tables = 0;

    for (const table of SUPABASE_TABLES) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error && count !== null && count > 0) {
          tables++;
          records += count;
        }
      } catch {
        // Table may not exist
      }
    }

    // Get last backup from choir_settings
    let lastBackup: string | undefined;
    try {
      const { data } = await supabase
        .from('choir_settings')
        .select('value')
        .eq('key', LAST_BACKUP_KEY)
        .maybeSingle();
      if (data?.value) {
        try {
          lastBackup = JSON.parse(data.value);
        } catch {
          lastBackup = data.value;
        }
      }
    } catch {
      // Ignore
    }

    // Fallback to localStorage for lastBackup if not in Supabase
    if (!lastBackup && typeof localStorage !== 'undefined') {
      lastBackup = localStorage.getItem(LAST_BACKUP_KEY) || undefined;
    }

    return {
      localStorage: { tables: 0, records: 0 },
      supabase: { tables, records },
      lastBackup,
    };
  }

  // Fallback to localStorage
  let records = 0;
  let tables = 0;
  for (const storageKey of Object.values(BACKUP_KEYS)) {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      const count = Array.isArray(parsed) ? parsed.length : parsed ? 1 : 0;
      if (count > 0) {
        tables++;
        records += count;
      }
    }
  }

  const lastBackup =
    typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_BACKUP_KEY) || undefined : undefined;

  return {
    localStorage: { tables, records },
    lastBackup,
  };
}

/**
 * Record backup timestamp - saves to Supabase when configured
 */
export async function recordBackupTimestamp(): Promise<void> {
  const timestamp = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('choir_settings').upsert(
        { key: LAST_BACKUP_KEY, value: JSON.stringify(timestamp) },
        { onConflict: 'key' }
      );
    } catch (e) {
      console.debug('[Backup] Failed to save timestamp to Supabase:', e);
    }
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LAST_BACKUP_KEY, timestamp);
  }
}
