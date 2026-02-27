-- Choir Management Database Schema
-- Run this in your Supabase SQL Editor (SQL Editor tab in dashboard)
-- This schema is aligned with supabaseSync.ts column mappings.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  voice VARCHAR(20) NOT NULL CHECK (voice IN ('Soprano', 'Alto', 'Tenor', 'Bass')),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Active', 'Pending', 'Inactive')),
  joined_date DATE DEFAULT CURRENT_DATE,
  invite_status TEXT DEFAULT 'not_invited',
  date_of_birth DATE,
  photo TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relationship VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(255),
  category VARCHAR(50) DEFAULT 'Other' CHECK (category IN ('Concert', 'Revival', 'Workshop', 'Fellowship', 'Other')),
  image TEXT,
  is_free BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  livestream_url TEXT,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADMIN USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'reviewer' CHECK (role IN ('super_admin', 'main_admin', 'finance', 'secretary', 'disciplinary', 'reviewer', 'social_affairs', 'coach')),
  member_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOGIN ATTEMPTS TABLE (For Rate Limiting)
-- =============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);

-- =============================================
-- CONTRIBUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contributions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_name VARCHAR(255),
  member_email VARCHAR(255),
  type VARCHAR(100),
  type_id TEXT,
  type_name VARCHAR(255),
  category VARCHAR(50) DEFAULT 'other',
  amount DECIMAL(12, 2) NOT NULL,
  expected_amount DECIMAL(12, 2),
  month INTEGER CHECK (month >= 1 AND month <= 12),
  year INTEGER,
  payment_method VARCHAR(50),
  reference VARCHAR(255),
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_member ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions(year, month);

-- =============================================
-- CONTRIBUTION TYPES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contribution_types (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) DEFAULT 'monthly',
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  rate_history JSONB DEFAULT '[]'::jsonb,
  target_amount DECIMAL(12, 2),
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_name VARCHAR(255),
  member_email VARCHAR(255),
  member_voice VARCHAR(20),
  date DATE NOT NULL,
  session_title VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused', 'late')),
  notes TEXT,
  marked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- =============================================
-- ATTENDANCE SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  title VARCHAR(255),
  total_present INTEGER DEFAULT 0,
  total_absent INTEGER DEFAULT 0,
  total_excused INTEGER DEFAULT 0,
  total_late INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- =============================================
-- LEAVE REQUESTS TABLE
-- Aligned with supabaseSync: uses votes/approval_count/denial_count instead of approvals/denials JSONB
-- =============================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_name VARCHAR(255),
  member_email VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  votes JSONB DEFAULT '[]'::jsonb,
  approval_count INTEGER DEFAULT 0,
  denial_count INTEGER DEFAULT 0,
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEAVE VERIFICATION CODES TABLE
-- Aligned with supabaseSync: uses email/code instead of leave_id/approver_id
-- =============================================
CREATE TABLE IF NOT EXISTS leave_verification_codes (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EXPENSES TABLE
-- Aligned with supabaseSync: added vendor, receipt_number, notes, updated_at
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  vendor VARCHAR(255),
  receipt_number VARCHAR(255),
  receipt_url TEXT,
  recorded_by TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ANNOUNCEMENTS TABLE
-- Aligned with supabaseSync: uses audience, is_active, start_date, end_date
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'normal',
  audience VARCHAR(50) DEFAULT 'all',
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at DESC);

-- =============================================
-- GOOGLE CALENDAR INTEGRATION TABLES
-- =============================================
CREATE TABLE IF NOT EXISTS google_calendar_integrations (
  id TEXT PRIMARY KEY,
  google_email VARCHAR(255) NOT NULL,
  calendar_id VARCHAR(255) NOT NULL DEFAULT 'primary',
  refresh_token_ciphertext TEXT NOT NULL,
  refresh_token_iv TEXT NOT NULL,
  refresh_token_tag TEXT NOT NULL,
  scope TEXT,
  connected_by_admin_id TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_oauth_states (
  state TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  redirect_path TEXT NOT NULL DEFAULT '/admin',
  created_ip VARCHAR(45),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_oauth_states_expires_at ON google_oauth_states(expires_at);

-- =============================================
-- DISCIPLINARY RECORDS TABLE
-- Aligned with supabaseSync: added member_name, type, expiry_date, issued_by, issued_by_name,
-- resolved_by, appeal fields, attachments
-- =============================================
CREATE TABLE IF NOT EXISTS disciplinary_records (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_name VARCHAR(255),
  type VARCHAR(100),
  severity VARCHAR(20) NOT NULL DEFAULT 'minor',
  incident_date DATE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  action_taken TEXT,
  status VARCHAR(20) DEFAULT 'open',
  expiry_date DATE,
  issued_by TEXT,
  issued_by_name VARCHAR(255),
  witnesses JSONB DEFAULT '[]'::jsonb,
  resolution_date DATE,
  resolution_notes TEXT,
  resolved_by TEXT,
  appeal_date DATE,
  appeal_reason TEXT,
  appeal_decision TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVENTORY TABLE
-- Aligned with supabaseSync: added available, description, purchase_date, purchase_price,
-- serial_number, last_checked
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  available INTEGER DEFAULT 1,
  condition VARCHAR(50) DEFAULT 'good',
  location VARCHAR(255),
  description TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(12, 2),
  serial_number VARCHAR(255),
  notes TEXT,
  last_checked DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVENTORY ASSIGNMENTS TABLE
-- Aligned with supabaseSync: uses assigned_at/returned_at, member_name, quantity
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_assignments (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  member_name VARCHAR(255),
  quantity INTEGER DEFAULT 1,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS TABLE
-- Aligned with supabaseSync: added file_name, file_data, is_public, download_count
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  file_data TEXT,
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  visibility VARCHAR(20) DEFAULT 'admins',
  tags JSONB DEFAULT '[]'::jsonb,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENT FOLDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS document_folders (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEETING MINUTES TABLE
-- Aligned with supabaseSync: added start_time, end_time, location, absentees,
-- chairperson, secretary, opening_prayer, closing_prayer, next_meeting_date, notes, approved_at
-- =============================================
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  location VARCHAR(255),
  attendees JSONB DEFAULT '[]'::jsonb,
  absentees JSONB DEFAULT '[]'::jsonb,
  chairperson VARCHAR(255),
  secretary VARCHAR(255),
  agenda TEXT,
  minutes TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  opening_prayer VARCHAR(255),
  closing_prayer VARCHAR(255),
  next_meeting_date DATE,
  notes TEXT,
  decisions JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft',
  recorded_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  google_event_id TEXT,
  google_meet_link TEXT,
  google_event_link TEXT,
  google_conference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TICKET ORDERS TABLE
-- Aligned with supabaseSync: full event-based model with tickets JSON, QR, promo, etc.
-- =============================================
CREATE TABLE IF NOT EXISTS ticket_orders (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  tx_ref TEXT,
  event_title VARCHAR(255),
  event_date DATE,
  event_location VARCHAR(255),
  event_image TEXT,
  tickets JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(12, 2) DEFAULT 0,
  service_fee DECIMAL(12, 2) DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  promo_code VARCHAR(50),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'confirmed')),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  qr_code_data TEXT,
  confirmed_at TIMESTAMPTZ,
  ticket_id TEXT,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TICKETS TABLE (ticket tier definitions)
-- =============================================
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROMO CODES TABLE
-- Aligned with supabaseSync: added min_purchase, event_id
-- =============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  event_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SURVEYS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft',
  target_audience VARCHAR(50) DEFAULT 'all',
  event_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closes_at TIMESTAMPTZ
);

-- =============================================
-- SURVEY RESPONSES TABLE
-- Aligned with supabaseSync: uses submitted_at instead of created_at for ordering
-- =============================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  member_id TEXT,
  member_name VARCHAR(255),
  member_email VARCHAR(255),
  answers JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTACT SUBMISSIONS TABLE
-- Aligned with supabaseSync: added notes column
-- =============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  responded BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ,
  responded_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DONATIONS TABLE
-- Aligned with supabaseSync: added method, date, recorded_by columns
-- =============================================
CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255),
  donor_phone VARCHAR(50),
  amount DECIMAL(12, 2) NOT NULL,
  method VARCHAR(50),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  reference VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT false,
  message TEXT,
  date DATE,
  recorded_by TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDITIONS TABLE
-- Aligned with supabaseSync: added candidate_name, candidate_phone, panelists, rating, recommended_voice
-- =============================================
CREATE TABLE IF NOT EXISTS auditions (
  id TEXT PRIMARY KEY,
  applicant_name VARCHAR(255),
  candidate_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  candidate_phone VARCHAR(50),
  voice_type VARCHAR(20) DEFAULT 'Soprano',
  experience TEXT,
  scheduled_date DATE,
  scheduled_time VARCHAR(20),
  panelists JSONB DEFAULT '[]'::jsonb,
  evaluation_notes TEXT,
  rating INTEGER,
  recommended_voice VARCHAR(20),
  status VARCHAR(20) DEFAULT 'scheduled',
  evaluator_id TEXT,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RECEIPTS TABLE
-- Aligned with supabaseSync: uses member_email, category, type_name, payment_method, month, year, recorded_by
-- =============================================
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  member_name VARCHAR(255),
  member_email VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100),
  type VARCHAR(100),
  type_name VARCHAR(255),
  reference VARCHAR(255),
  payment_method VARCHAR(50),
  month INTEGER,
  year INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  recorded_by TEXT,
  issued_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENTS TABLE
-- Aligned with supabaseSync: added currency, purpose, status, metadata, updated_at
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  member_name VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'RWF',
  method VARCHAR(50),
  purpose TEXT,
  reference VARCHAR(255),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GALLERY ITEMS TABLE (unified gallery storage)
-- =============================================
CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY,
  type VARCHAR(20) DEFAULT 'photo',
  title VARCHAR(255) DEFAULT '',
  url TEXT NOT NULL,
  thumbnail TEXT,
  category VARCHAR(100) DEFAULT '',
  album_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EVENT STAFF TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS event_staff (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  national_id VARCHAR(50) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  assigned_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- =============================================
-- SCAN RECORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS scan_records (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  tx_ref TEXT,
  staff_id TEXT NOT NULL,
  staff_name VARCHAR(255),
  staff_national_id VARCHAR(50),
  event_id TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  ticket_count INTEGER DEFAULT 1
);

-- =============================================
-- ADMIN INVITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_invites (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'reviewer',
  invite_code VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  expires_at TIMESTAMPTZ,
  used BOOLEAN DEFAULT false,
  member_id TEXT
);

-- =============================================
-- PASSWORD RESETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CHOIR SETTINGS TABLE (Key-Value Store)
-- =============================================
CREATE TABLE IF NOT EXISTS choir_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ALBUMS TABLE (Music)
-- =============================================
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  cover_image TEXT,
  track_count INTEGER DEFAULT 0,
  description TEXT,
  listen_url TEXT,
  is_latest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MUSIC VIDEOS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS music_videos (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  youtube_id VARCHAR(50),
  thumbnail TEXT,
  album_id TEXT,
  is_latest BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STREAMING PLATFORMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS streaming_platforms (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT,
  is_visible BOOLEAN DEFAULT true
);

-- =============================================
-- ANALYTICS PAGE VIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_page_views (
  id TEXT PRIMARY KEY,
  path VARCHAR(500) NOT NULL,
  title VARCHAR(500),
  "timestamp" TIMESTAMPTZ DEFAULT NOW(),
  referrer TEXT,
  session_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_pv_path ON analytics_page_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_session ON analytics_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_time ON analytics_page_views("timestamp" DESC);

-- =============================================
-- ANALYTICS SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMAIL QUEUE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_queue (
  id TEXT PRIMARY KEY,
  "to" TEXT NOT NULL,
  template VARCHAR(100),
  data TEXT,
  subject VARCHAR(500),
  queued_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATION PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  channels JSONB DEFAULT '[]'::jsonb
);

-- =============================================
-- PUSH SUBSCRIPTIONS (Web Push API)
-- =============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_id TEXT DEFAULT 'anonymous',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

-- =============================================
-- MEMBER INVITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS member_invites (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  error TEXT
);

-- =============================================
-- FUNCTION: Update timestamp on row update
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
DROP TRIGGER IF EXISTS update_disciplinary_records_updated_at ON disciplinary_records;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_meeting_minutes_updated_at ON meeting_minutes;
DROP TRIGGER IF EXISTS update_auditions_updated_at ON auditions;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_disciplinary_records_updated_at BEFORE UPDATE ON disciplinary_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_meeting_minutes_updated_at BEFORE UPDATE ON meeting_minutes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_auditions_updated_at BEFORE UPDATE ON auditions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- FUNCTION: Check rate limiting for login
-- =============================================
CREATE OR REPLACE FUNCTION check_login_rate_limit(check_email VARCHAR)
RETURNS TABLE (
  is_locked BOOLEAN,
  failed_attempts INTEGER,
  lockout_until TIMESTAMPTZ
) AS $$
DECLARE
  attempts INTEGER;
  last_attempt TIMESTAMPTZ;
  lockout_duration INTERVAL;
BEGIN
  SELECT COUNT(*), MAX(attempted_at) INTO attempts, last_attempt
  FROM login_attempts
  WHERE email = check_email
    AND success = false
    AND attempted_at > NOW() - INTERVAL '15 minutes';

  IF attempts >= 10 THEN
    lockout_duration := INTERVAL '1 hour';
  ELSIF attempts >= 5 THEN
    lockout_duration := INTERVAL '15 minutes';
  ELSE
    lockout_duration := INTERVAL '0 minutes';
  END IF;

  RETURN QUERY SELECT
    CASE WHEN attempts >= 5 AND last_attempt + lockout_duration > NOW() THEN true ELSE false END,
    attempts,
    CASE WHEN attempts >= 5 THEN last_attempt + lockout_duration ELSE NULL END;
END;
$$ LANGUAGE plpgsql;

-- Super admin should be created via the Admin Team Management UI

-- =============================================
-- COMMENTS ON TABLES
-- =============================================
COMMENT ON TABLE members IS 'Choir members information';
COMMENT ON TABLE events IS 'Choir events and concerts';
COMMENT ON TABLE admin_users IS 'Administrative users with roles';
COMMENT ON TABLE login_attempts IS 'Track login attempts for rate limiting';
COMMENT ON TABLE contributions IS 'Member financial contributions';
COMMENT ON TABLE contribution_types IS 'Contribution type definitions (monthly, special)';
COMMENT ON TABLE attendance IS 'Rehearsal and event attendance tracking';
COMMENT ON TABLE attendance_sessions IS 'Attendance session summaries';
COMMENT ON TABLE leave_requests IS 'Member leave requests with approval workflow';
COMMENT ON TABLE expenses IS 'Choir expense tracking';
COMMENT ON TABLE announcements IS 'Announcements and notifications';
COMMENT ON TABLE audit_logs IS 'Audit trail of all admin actions';
COMMENT ON TABLE admin_invites IS 'Admin user invitations';
COMMENT ON TABLE choir_settings IS 'Application settings (key-value)';
COMMENT ON TABLE surveys IS 'Survey definitions';
COMMENT ON TABLE survey_responses IS 'Member survey responses';
COMMENT ON TABLE analytics_page_views IS 'Page view tracking for analytics';
COMMENT ON TABLE analytics_sessions IS 'Session tracking for analytics';
COMMENT ON TABLE ticket_orders IS 'Event ticket purchases';
COMMENT ON TABLE disciplinary_records IS 'Member disciplinary records';
COMMENT ON TABLE inventory IS 'Choir inventory items';
COMMENT ON TABLE meeting_minutes IS 'Meeting minutes and records';
COMMENT ON TABLE documents IS 'Shared choir documents';
COMMENT ON TABLE payments IS 'Payment transactions';
COMMENT ON TABLE receipts IS 'Payment receipts';
COMMENT ON TABLE unlock_requests IS 'Month unlock requests with approval workflow';

-- ============================================================
-- UNLOCK REQUESTS (Month unlock requests)
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
