// supabaseDB.ts - Direct Supabase CRUD layer
// All functions are async - NO localStorage dependency
// Uses table mappings from supabaseSync.ts for camelCase ↔ snake_case conversion

import { supabase, isSupabaseConfigured } from './supabase';
import { SYNC_CONFIG } from './supabaseSync';

// ============ HELPERS ============

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getConfig(storageKey: string) {
  const config = SYNC_CONFIG[storageKey];
  if (!config) throw new Error(`[DB] No config for key: ${storageKey}`);
  if (!isSupabaseConfigured()) throw new Error('[DB] Supabase not configured');
  return config;
}

// ============ GENERIC CRUD ============

/** Get all rows from a table */
export async function dbGetAll<T>(storageKey: string): Promise<T[]> {
  try {
    const config = getConfig(storageKey);
    let query = supabase.from(config.table).select('*');
    if (config.orderBy) {
      query = query.order(config.orderBy, { ascending: config.orderAsc ?? true });
    }
    const { data, error } = await query;
    if (error) {
      console.error(`[DB] Error fetching ${config.table}:`, error.message);
      return [];
    }
    return (data || []).map(row => config.fromDb(row) as T);
  } catch (e: any) {
    console.error(`[DB] ${storageKey} getAll error:`, e.message);
    return [];
  }
}

/** Get a single row by ID */
export async function dbGetById<T>(storageKey: string, id: string): Promise<T | null> {
  try {
    const config = getConfig(storageKey);
    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return config.fromDb(data) as T;
  } catch {
    return null;
  }
}

/** Query rows by a column value (use DB column name) */
export async function dbQuery<T>(storageKey: string, column: string, value: any): Promise<T[]> {
  try {
    const config = getConfig(storageKey);
    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .eq(column, value);
    if (error) return [];
    return (data || []).map(row => config.fromDb(row) as T);
  } catch {
    return [];
  }
}

/** Insert a new row */
export async function dbInsert<T>(storageKey: string, item: any): Promise<T> {
  const config = getConfig(storageKey);
  const dbItem = config.toDb({ ...item, id: item.id || generateId() });
  // Remove undefined values
  Object.keys(dbItem).forEach(k => dbItem[k] === undefined && delete dbItem[k]);

  const { data, error } = await supabase
    .from(config.table)
    .insert(dbItem)
    .select()
    .single();
  if (error) throw error;
  return config.fromDb(data) as T;
}

/** Update an existing row */
export async function dbUpdate<T>(storageKey: string, id: string, updates: any): Promise<T> {
  const config = getConfig(storageKey);
  const dbItem = config.toDb(updates);
  Object.keys(dbItem).forEach(k => dbItem[k] === undefined && delete dbItem[k]);

  const { data, error } = await supabase
    .from(config.table)
    .update(dbItem)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return config.fromDb(data) as T;
}

/** Upsert (insert or update) a row */
export async function dbUpsert<T>(storageKey: string, item: any): Promise<T> {
  const config = getConfig(storageKey);
  const dbItem = config.toDb({ ...item, id: item.id || generateId() });
  Object.keys(dbItem).forEach(k => dbItem[k] === undefined && delete dbItem[k]);

  const { data, error } = await supabase
    .from(config.table)
    .upsert(dbItem, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return config.fromDb(data) as T;
}

/** Delete a row by ID */
export async function dbDelete(storageKey: string, id: string): Promise<void> {
  const config = getConfig(storageKey);
  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Delete rows matching a condition */
export async function dbDeleteWhere(storageKey: string, column: string, value: any): Promise<void> {
  const config = getConfig(storageKey);
  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq(column, value);
  if (error) throw error;
}

/** Count rows in a table */
export async function dbCount(storageKey: string): Promise<number> {
  try {
    const config = getConfig(storageKey);
    const { count, error } = await supabase
      .from(config.table)
      .select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

// ============ SETTINGS (KEY-VALUE) ============

/** Get settings object from choir_settings table */
export async function dbGetSettings<T>(defaults: T): Promise<T> {
  try {
    if (!isSupabaseConfigured()) return defaults;
    const { data, error } = await supabase
      .from('choir_settings')
      .select('*');
    if (error || !data || data.length === 0) return defaults;

    const settings = { ...defaults } as any;
    for (const row of data) {
      if (row.key && row.value !== undefined) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }
    }
    return settings;
  } catch {
    return defaults;
  }
}

/** Save settings key-value pairs to choir_settings table */
export async function dbSaveSettings(settings: Record<string, any>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  for (const [key, value] of Object.entries(settings)) {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    await supabase
      .from('choir_settings')
      .upsert({ key, value: val }, { onConflict: 'key' });
  }
}

// ============ RAW SUPABASE ACCESS ============
// For complex queries that don't fit the generic CRUD pattern

export { supabase, isSupabaseConfigured };
export function getTableName(storageKey: string): string {
  return SYNC_CONFIG[storageKey]?.table || storageKey;
}
export function getTableConfig(storageKey: string) {
  return SYNC_CONFIG[storageKey];
}
