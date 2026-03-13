-- Run this in the Supabase SQL Editor to enable monthly dues tolerance/grace storage.

CREATE TABLE IF NOT EXISTS public.monthly_dues_exceptions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'tolerated',
  created_by TEXT,
  created_by_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cleared_at TIMESTAMPTZ,
  cleared_by TEXT,
  cleared_by_role TEXT
);

COMMENT ON TABLE public.monthly_dues_exceptions IS 'Per-member monthly dues tolerance records';

ALTER TABLE public.monthly_dues_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access (public) on monthly_dues_exceptions" ON public.monthly_dues_exceptions;
CREATE POLICY "Allow all access (public) on monthly_dues_exceptions"
  ON public.monthly_dues_exceptions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
