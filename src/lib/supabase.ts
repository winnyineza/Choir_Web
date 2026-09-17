import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PLACEHOLDER_SUPABASE_URL = 'https://unavailable.supabase.co';
const PLACEHOLDER_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.placeholder';

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || PLACEHOLDER_SUPABASE_URL,
  supabaseAnonKey || PLACEHOLDER_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: isSupabaseConfigured(),
      autoRefreshToken: isSupabaseConfigured(),
    },
  }
);

/**
 * The same connection, without the schema types applied.
 *
 * Generic helpers such as `supabaseDB` resolve their table name at runtime from
 * `SYNC_CONFIG`, so the compiler cannot know which table a call refers to and the
 * `Database` types collapse. Reach for this only in that situation; anywhere the
 * table name is a literal, use `supabase` so the row types still apply.
 */
export const supabaseUntyped = supabase as unknown as SupabaseClient;

export type { Database };
