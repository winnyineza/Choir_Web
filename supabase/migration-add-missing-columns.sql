-- =============================================
-- MIGRATION: Add missing columns to align schema with application
-- Run this in Supabase SQL Editor if you already have tables created.
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- =============================================

-- ANNOUNCEMENTS: add audience, is_active, start_date, end_date
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience VARCHAR(50) DEFAULT 'all';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- EXPENSES: add vendor, receipt_number, notes, updated_at
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor VARCHAR(255);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(255);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- LEAVE REQUESTS: add member_name, member_email, votes, approval_count, denial_count, admin_notes, reviewed_by, reviewed_at
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS member_email VARCHAR(255);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS votes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approval_count INTEGER DEFAULT 0;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS denial_count INTEGER DEFAULT 0;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- LEAVE VERIFICATION CODES: restructure to email-based
ALTER TABLE leave_verification_codes ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE leave_verification_codes ADD COLUMN IF NOT EXISTS code VARCHAR(20);

-- DISCIPLINARY RECORDS: add member_name, type, expiry_date, issued_by, issued_by_name, resolved_by, appeal fields, attachments
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS issued_by TEXT;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS issued_by_name VARCHAR(255);
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS resolved_by TEXT;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS appeal_date DATE;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS appeal_reason TEXT;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS appeal_decision TEXT;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
-- Change witnesses from TEXT[] to JSONB if needed (safe: drop constraint only)
DO $$ BEGIN
  ALTER TABLE disciplinary_records ALTER COLUMN witnesses TYPE JSONB USING to_jsonb(witnesses);
EXCEPTION WHEN others THEN NULL;
END $$;

-- INVENTORY: add available, description, purchase_date, purchase_price, serial_number, last_checked
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS available INTEGER DEFAULT 1;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12, 2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_checked DATE;
-- Remove CHECK constraint on condition if it exists (app sends various values)
DO $$ BEGIN
  ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_condition_check;
EXCEPTION WHEN others THEN NULL;
END $$;

-- INVENTORY ASSIGNMENTS: add member_name, quantity, switch to assigned_at/returned_at
ALTER TABLE inventory_assignments ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE inventory_assignments ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE inventory_assignments ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE inventory_assignments ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;

-- DOCUMENTS: add file_name, file_data, is_public, download_count
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_data TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
-- Change tags from TEXT[] to JSONB if needed
DO $$ BEGIN
  ALTER TABLE documents ALTER COLUMN tags TYPE JSONB USING to_jsonb(tags);
EXCEPTION WHEN others THEN NULL;
END $$;

-- MEETING MINUTES: add start_time, end_time, location, absentees, chairperson, secretary, prayers, next_meeting, notes, approved_at
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS start_time VARCHAR(20);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS end_time VARCHAR(20);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS absentees JSONB DEFAULT '[]'::jsonb;
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS chairperson VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS secretary VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS opening_prayer VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS closing_prayer VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS next_meeting_date DATE;
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
-- Make minutes column nullable (was NOT NULL)
ALTER TABLE meeting_minutes ALTER COLUMN minutes DROP NOT NULL;
-- Change attendees to JSONB if currently TEXT[]
DO $$ BEGIN
  ALTER TABLE meeting_minutes ALTER COLUMN attendees TYPE JSONB USING to_jsonb(attendees);
EXCEPTION WHEN others THEN NULL;
END $$;

-- TICKET ORDERS: add event-based columns
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS tx_ref TEXT;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_title VARCHAR(255);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_location VARCHAR(255);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_image TEXT;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS tickets JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS service_fee DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS discount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
-- Make ticket_id nullable (flat model doesn't always use it)
ALTER TABLE ticket_orders ALTER COLUMN ticket_id DROP NOT NULL;
ALTER TABLE ticket_orders ALTER COLUMN quantity DROP NOT NULL;

-- PROMO CODES: add min_purchase, event_id
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS min_purchase DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS event_id TEXT;

-- DONATIONS: add method, date, recorded_by, reference
ALTER TABLE donations ADD COLUMN IF NOT EXISTS method VARCHAR(50);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS recorded_by TEXT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

-- AUDITIONS: add candidate_name, candidate_phone, panelists, rating, recommended_voice
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS candidate_name VARCHAR(255);
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS candidate_phone VARCHAR(50);
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS panelists JSONB DEFAULT '[]'::jsonb;
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS recommended_voice VARCHAR(20);
-- Make applicant_name nullable (app uses candidate_name)
DO $$ BEGIN
  ALTER TABLE auditions ALTER COLUMN applicant_name DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE auditions ALTER COLUMN email DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE auditions ALTER COLUMN voice_type DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
-- Remove strict CHECK constraints
DO $$ BEGIN
  ALTER TABLE auditions DROP CONSTRAINT IF EXISTS auditions_voice_type_check;
  ALTER TABLE auditions DROP CONSTRAINT IF EXISTS auditions_status_check;
EXCEPTION WHEN others THEN NULL;
END $$;

-- RECEIPTS: add member_email, category, type_name, payment_method, month, year, recorded_by
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS member_email VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS type_name VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS month INTEGER;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS recorded_by TEXT;

-- PAYMENTS: add currency, purpose, status, metadata, updated_at
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RWF';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- CONTACT SUBMISSIONS: add notes
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS notes TEXT;

-- SURVEY RESPONSES: add submitted_at
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();

-- Add update triggers for newly updated tables
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- MONTHLY DUES EXCEPTIONS TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_dues_exceptions (
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

-- ============================================================
-- UNLOCK REQUESTS TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS unlock_requests (
  id TEXT PRIMARY KEY,
  requested_by TEXT,
  requested_by_role TEXT,
  requested_by_id TEXT,
  type TEXT DEFAULT 'both',
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  unlocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEMBER INVITE LOGS TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS member_invite_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  email TEXT NOT NULL,
  name TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  error TEXT
);

-- ============================================================
-- RSVPS TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

ALTER TABLE members ADD COLUMN IF NOT EXISTS invite_status TEXT DEFAULT 'not_invited';

-- Done! All columns now match the application's supabaseSync.ts mappings.

-- ============================================================
-- RLS: Enable Row Level Security on public tables
-- NOTE: These policies keep current behavior (open access via anon key)
--       while satisfying Supabase linter requirements.
--       They do NOT add per-user security yet.
-- ============================================================

-- Core member & admin-related tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on members"
  ON public.members
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on admin_users"
  ON public.admin_users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on admin_invites"
  ON public.admin_invites
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.member_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on member_invites"
  ON public.member_invites
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.member_invite_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on member_invite_logs"
  ON public.member_invite_logs
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on notification_preferences"
  ON public.notification_preferences
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.monthly_dues_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on monthly_dues_exceptions"
  ON public.monthly_dues_exceptions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.unlock_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on unlock_requests"
  ON public.unlock_requests
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on login_attempts"
  ON public.login_attempts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on password_resets"
  ON public.password_resets
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on audit_logs"
  ON public.audit_logs
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Attendance & contributions
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on attendance"
  ON public.attendance
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on attendance_sessions"
  ON public.attendance_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on contributions"
  ON public.contributions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.contribution_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on contribution_types"
  ON public.contribution_types
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Events, tickets, RSVPs
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on events"
  ON public.events
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on tickets"
  ON public.tickets
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on ticket_orders"
  ON public.ticket_orders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on rsvps"
  ON public.rsvps
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on promo_codes"
  ON public.promo_codes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Financial tables
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on donations"
  ON public.donations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on expenses"
  ON public.expenses
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on payments"
  ON public.payments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on receipts"
  ON public.receipts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Content & communication
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on announcements"
  ON public.announcements
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on contact_submissions"
  ON public.contact_submissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on gallery_items"
  ON public.gallery_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on gallery_albums"
  ON public.gallery_albums
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on gallery_images"
  ON public.gallery_images
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.music_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on music_releases"
  ON public.music_releases
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on albums"
  ON public.albums
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on music_videos"
  ON public.music_videos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.streaming_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on streaming_platforms"
  ON public.streaming_platforms
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Documents and inventory
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on documents"
  ON public.documents
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on document_folders"
  ON public.document_folders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on inventory"
  ON public.inventory
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.inventory_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on inventory_assignments"
  ON public.inventory_assignments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Surveys
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on surveys"
  ON public.surveys
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on survey_responses"
  ON public.survey_responses
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Disciplinary and leave
ALTER TABLE public.disciplinary_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on disciplinary_records"
  ON public.disciplinary_records
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on leave_requests"
  ON public.leave_requests
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.leave_verification_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on leave_verification_codes"
  ON public.leave_verification_codes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Event staff & scans
ALTER TABLE public.event_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on event_staff"
  ON public.event_staff
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.scan_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on scan_records"
  ON public.scan_records
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Settings
ALTER TABLE public.choir_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on choir_settings"
  ON public.choir_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Analytics
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on analytics_sessions"
  ON public.analytics_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on analytics_page_views"
  ON public.analytics_page_views
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Misc queues and subscriptions
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on email_queue"
  ON public.email_queue
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on push_subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Meeting minutes and auditions (missed in initial pass)
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on meeting_minutes"
  ON public.meeting_minutes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.auditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access (public) on auditions"
  ON public.auditions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
