// Backup & Restore Service - Export/Import data as ZIP
// Reads from and writes to Supabase

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase, isSupabaseConfigured } from './supabaseDB';

const LAST_BACKUP_KEY = 'choir_last_backup';

export interface BackupMetadata {
  version: string;
  createdAt: string;
  source: 'supabase';
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
 * Export all data from Supabase as a backup
 */
export async function exportSupabaseBackup(): Promise<BackupData> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Backup is unavailable.');
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
  source: 'supabase' = 'supabase'
): Promise<{ success: boolean; fileName: string; recordCount: number }> {
  try {
    if (source !== 'supabase') {
      throw new Error('Only Supabase backup source is supported.');
    }

    const backupData = await exportSupabaseBackup();

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
 * Restore backup to Supabase
 */
export async function restoreToSupabase(backupData: BackupData): Promise<{
  success: boolean;
  restored: number;
  errors: string[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      restored: 0,
      errors: ['Supabase is not configured. Restore is unavailable.'],
    };
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
  target: 'supabase' = 'supabase'
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

  if (target === 'supabase') {
    const supaResult = await restoreToSupabase(backupData);
    totalRestored += supaResult.restored;
    allErrors.push(...supaResult.errors.map((e) => `[Supabase] ${e}`));
  } else {
    allErrors.push('Only Supabase restore target is supported.');
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
  if (!isSupabaseConfigured()) {
    return {
      localStorage: { tables: 0, records: 0 },
      supabase: { tables: 0, records: 0 },
      lastBackup: undefined,
    };
  }

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

  return {
    localStorage: { tables: 0, records: 0 },
    supabase: { tables, records },
    lastBackup,
  };
}

/**
 * Record backup timestamp - saves to Supabase when configured
 */
export async function recordBackupTimestamp(): Promise<void> {
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    await supabase.from('choir_settings').upsert(
      { key: LAST_BACKUP_KEY, value: JSON.stringify(timestamp) },
      { onConflict: 'key' }
    );
  } catch (e) {
    console.debug('[Backup] Failed to save timestamp to Supabase:', e);
  }
}
