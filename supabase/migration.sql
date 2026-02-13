-- =============================================
-- FULL MIGRATION: Add all missing tables & columns
-- Run this in Supabase SQL Editor AFTER the base schema.sql
-- Safe to run multiple times (uses IF NOT EXISTS)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PATCH EXISTING TABLES (add missing columns)
-- =============================================

-- Announcements: add audience, start_date, end_date, is_active
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience VARCHAR(20) DEFAULT 'all';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Expenses: add vendor, receipt_number, notes, updated_at
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor VARCHAR(255);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Leave requests: add member_name, member_email, votes (JSONB), approval_count, denial_count, admin_notes, reviewed_by, reviewed_at
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS member_email VARCHAR(255);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS votes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approval_count INTEGER DEFAULT 0;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS denial_count INTEGER DEFAULT 0;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Contact submissions: add notes
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- Documents: add file_data TEXT, is_public, download_count, tags as TEXT[]
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_data TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Inventory: add available, purchase_date, purchase_price, serial_number, last_checked
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS available INTEGER;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12, 2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_checked TIMESTAMPTZ;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS description TEXT;

-- Disciplinary records: add member_name, type, expiry_date, issued_by_name, appeal fields
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS issued_by VARCHAR(255);
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS issued_by_name VARCHAR(255);
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS appeal_date DATE;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS appeal_reason TEXT;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS appeal_decision VARCHAR(50);
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE disciplinary_records ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(255);

-- Meeting minutes: add start_time, end_time, location, chairperson, secretary, opening_prayer, closing_prayer, next_meeting_date, notes, absentees
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS start_time VARCHAR(20);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS end_time VARCHAR(20);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS chairperson VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS secretary VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS absentees TEXT[];
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS opening_prayer VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS closing_prayer VARCHAR(255);
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS next_meeting_date DATE;
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Promo codes: add min_purchase, event_id
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS min_purchase DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Auditions: add candidate_name, candidate_phone, panelists, rating, recommended_voice, updated_at
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS candidate_name VARCHAR(255);
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS candidate_phone VARCHAR(50);
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS panelists TEXT[];
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS recommended_voice VARCHAR(20);

-- Ticket orders: add tx_ref, event_title, event_date, event_location, event_image, tickets (JSONB), subtotal, service_fee, discount, promo_code, qr_code_data, confirmed_at
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS tx_ref VARCHAR(255);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_title VARCHAR(255);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_date VARCHAR(50);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_location VARCHAR(255);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS event_image TEXT;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS tickets JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12, 2);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE ticket_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Donations: add donor_name, method, recorded_by
ALTER TABLE donations ADD COLUMN IF NOT EXISTS method VARCHAR(50);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS recorded_by VARCHAR(255);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

-- Contributions: add member_name, member_email, type_id, type_name, expected_amount, payment_method, reference
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS member_email VARCHAR(255);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS type_id VARCHAR(100);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS type_name VARCHAR(255);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS expected_amount DECIMAL(12, 2);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

-- Attendance: add member_name, member_email, member_voice, marked_by
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS member_email VARCHAR(255);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS member_voice VARCHAR(20);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS marked_by VARCHAR(255);

-- =============================================
-- NEW TABLES
-- =============================================

-- Surveys
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey Responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  member_id VARCHAR(255) NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_member ON survey_responses(member_id);

-- Event Staff
CREATE TABLE IF NOT EXISTS event_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  national_id VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assigned_events TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Scan Records
CREATE TABLE IF NOT EXISTS scan_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(255) NOT NULL,
  tx_ref VARCHAR(255),
  staff_id VARCHAR(255) NOT NULL,
  staff_name VARCHAR(255),
  staff_national_id VARCHAR(100),
  event_id VARCHAR(255) NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  ticket_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_scan_records_event ON scan_records(event_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_order ON scan_records(order_id);

-- Choir Settings
CREATE TABLE IF NOT EXISTS choir_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO choir_settings (key, value) VALUES
  ('choirName', 'The Serenades of Praise Choir'),
  ('email', 'theserenadeschoir@gmail.com'),
  ('phone', '+250 780 623 144'),
  ('address', 'Kacyiru SDA Church, Kigali, Rwanda'),
  ('momoNumber', '0780623144'),
  ('bankAccount', ''),
  ('bankName', ''),
  ('memberPortalPin', '2024'),
  ('scannerPin', '2024')
ON CONFLICT (key) DO NOTHING;

-- Admin Invites
CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'reviewer',
  invite_code VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  expires_at TIMESTAMPTZ,
  used BOOLEAN DEFAULT false,
  member_id VARCHAR(255)
);

-- Password Resets
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contribution Types
CREATE TABLE IF NOT EXISTS contribution_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'monthly',
  amount DECIMAL(12, 2),
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  rate_history JSONB DEFAULT '[]'::jsonb,
  target_amount DECIMAL(12, 2),
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  title VARCHAR(255),
  total_present INTEGER DEFAULT 0,
  total_absent INTEGER DEFAULT 0,
  total_excused INTEGER DEFAULT 0,
  total_late INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Albums (music)
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  cover_image TEXT,
  track_count INTEGER DEFAULT 0,
  description TEXT,
  listen_url TEXT,
  is_latest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Music Videos
CREATE TABLE IF NOT EXISTS music_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  youtube_id VARCHAR(50),
  thumbnail TEXT,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  is_latest BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaming Platforms
CREATE TABLE IF NOT EXISTS streaming_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  url TEXT,
  is_visible BOOLEAN DEFAULT true
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id VARCHAR(255),
  member_name VARCHAR(255) NOT NULL,
  member_email VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100),
  type_name VARCHAR(255),
  reference VARCHAR(255),
  payment_method VARCHAR(50),
  month INTEGER,
  year INTEGER,
  recorded_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'RWF',
  method VARCHAR(50),
  purpose VARCHAR(255),
  reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'successful', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Assignments
CREATE TABLE IF NOT EXISTS inventory_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  member_id VARCHAR(255) NOT NULL,
  member_name VARCHAR(255),
  quantity INTEGER DEFAULT 1,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  notes TEXT
);

-- Document Folders
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery items (flat table alternative to albums+images)
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) DEFAULT 'photo' CHECK (type IN ('photo', 'video')),
  title VARCHAR(255),
  url TEXT NOT NULL,
  thumbnail TEXT,
  category VARCHAR(255),
  album_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave verification codes (ephemeral, but store in DB for multi-device support)
CREATE TABLE IF NOT EXISTS leave_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- UPDATE TRIGGERS for new tables
-- =============================================
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS but allow anon key full access (simple setup)
-- For production, you'd want more restrictive policies
-- =============================================

-- Disable RLS on all tables for simplicity (using anon key with service role)
-- The app authenticates admins via its own auth system
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anon key access (the app handles its own auth)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'members', 'events', 'admin_users', 'contributions', 'attendance',
      'announcements', 'expenses', 'leave_requests', 'audit_logs',
      'disciplinary_records', 'inventory', 'documents', 'meeting_minutes',
      'contact_submissions', 'donations', 'promo_codes', 'auditions',
      'tickets', 'ticket_orders', 'surveys', 'survey_responses',
      'event_staff', 'scan_records', 'choir_settings', 'admin_invites',
      'password_resets', 'contribution_types', 'attendance_sessions',
      'albums', 'music_videos', 'streaming_platforms', 'receipts',
      'payments', 'inventory_assignments', 'document_folders',
      'gallery_items', 'login_attempts'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS allow_anon_select ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS allow_anon_insert ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS allow_anon_update ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS allow_anon_delete ON %I', tbl);
    
    EXECUTE format('CREATE POLICY allow_anon_select ON %I FOR SELECT USING (true)', tbl);
    EXECUTE format('CREATE POLICY allow_anon_insert ON %I FOR INSERT WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY allow_anon_update ON %I FOR UPDATE USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY allow_anon_delete ON %I FOR DELETE USING (true)', tbl);
  END LOOP;
END $$;

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_contributions_member_name ON contributions(member_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_member_email ON attendance(member_email);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_leave_requests_member ON leave_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_member ON disciplinary_records(member_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_tx_ref ON ticket_orders(tx_ref);
CREATE INDEX IF NOT EXISTS idx_receipts_member ON receipts(member_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_type ON gallery_items(type);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);

COMMENT ON TABLE surveys IS 'Member surveys';
COMMENT ON TABLE survey_responses IS 'Survey responses from members';
COMMENT ON TABLE event_staff IS 'Event staff for ticket scanning';
COMMENT ON TABLE scan_records IS 'Ticket scan records at events';
COMMENT ON TABLE choir_settings IS 'Choir configuration settings';
COMMENT ON TABLE contribution_types IS 'Types of contributions (monthly dues, special, etc.)';
COMMENT ON TABLE attendance_sessions IS 'Attendance session summaries';
COMMENT ON TABLE albums IS 'Music albums';
COMMENT ON TABLE music_videos IS 'Music video releases';
COMMENT ON TABLE streaming_platforms IS 'Streaming platform links';
COMMENT ON TABLE receipts IS 'Payment receipts';
COMMENT ON TABLE payments IS 'Payment intents and records';
COMMENT ON TABLE inventory_assignments IS 'Inventory item assignments to members';
COMMENT ON TABLE document_folders IS 'Document organization folders';
COMMENT ON TABLE gallery_items IS 'Gallery photos and videos';
