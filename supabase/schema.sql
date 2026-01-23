-- Choir Management Database Schema
-- Run this in your Supabase SQL Editor (SQL Editor tab in dashboard)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  voice VARCHAR(20) NOT NULL CHECK (voice IN ('Soprano', 'Alto', 'Tenor', 'Bass')),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Active', 'Pending', 'Inactive')),
  joined_date DATE DEFAULT CURRENT_DATE,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'reviewer' CHECK (role IN ('super_admin', 'main_admin', 'finance', 'secretary', 'disciplinary', 'reviewer')),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOGIN ATTEMPTS TABLE (For Rate Limiting)
-- =============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);

-- =============================================
-- CONTRIBUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('monthly_dues', 'special', 'tithe', 'offering', 'other')),
  amount DECIMAL(12, 2) NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  year INTEGER,
  notes TEXT,
  recorded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by member
CREATE INDEX IF NOT EXISTS idx_contributions_member ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions(year, month);

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session_title VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'late')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one attendance record per member per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, date);

-- =============================================
-- LEAVE REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  approvals JSONB DEFAULT '[]'::jsonb,
  denials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  receipt_url TEXT,
  recorded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('general', 'event', 'warning', 'success')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at DESC);

-- =============================================
-- DISCIPLINARY RECORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS disciplinary_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'severe')),
  action_taken TEXT,
  witnesses TEXT[], -- Array of member IDs
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed', 'escalated')),
  resolution_date DATE,
  resolution_notes TEXT,
  recorded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVENTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  location VARCHAR(255),
  notes TEXT,
  assigned_to UUID REFERENCES members(id) ON DELETE SET NULL,
  assigned_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  visibility VARCHAR(20) DEFAULT 'admins' CHECK (visibility IN ('public', 'members', 'admins')),
  tags TEXT[],
  uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEETING MINUTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'regular' CHECK (type IN ('regular', 'special', 'executive', 'general')),
  attendees UUID[],
  agenda TEXT,
  minutes TEXT NOT NULL,
  decisions TEXT[],
  action_items JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
  recorded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GALLERY ALBUMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GALLERY IMAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES gallery_albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MUSIC RELEASES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS music_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) DEFAULT 'The Serenades',
  release_type VARCHAR(50) DEFAULT 'single' CHECK (release_type IN ('single', 'album', 'ep')),
  cover_art TEXT,
  release_date DATE,
  streaming_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROMO CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTACT SUBMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  responded BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DONATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255),
  donor_phone VARCHAR(50),
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT false,
  message TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDITIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS auditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  voice_type VARCHAR(20) NOT NULL CHECK (voice_type IN ('Soprano', 'Alto', 'Tenor', 'Bass')),
  experience TEXT,
  scheduled_date DATE,
  scheduled_time VARCHAR(20),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'passed', 'failed', 'cancelled')),
  evaluator_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  evaluation_notes TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TICKETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TICKET ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ticket_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Apply update trigger to relevant tables (drop first to allow re-running)
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
DROP TRIGGER IF EXISTS update_disciplinary_records_updated_at ON disciplinary_records;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_meeting_minutes_updated_at ON meeting_minutes;
DROP TRIGGER IF EXISTS update_auditions_updated_at ON auditions;

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_disciplinary_records_updated_at BEFORE UPDATE ON disciplinary_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_meeting_minutes_updated_at BEFORE UPDATE ON meeting_minutes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_auditions_updated_at BEFORE UPDATE ON auditions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

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
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*), MAX(attempted_at) INTO attempts, last_attempt
  FROM login_attempts
  WHERE email = check_email
    AND success = false
    AND attempted_at > NOW() - INTERVAL '15 minutes';
  
  -- Determine lockout
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

-- =============================================
-- INSERT DEFAULT SUPER ADMIN
-- =============================================
INSERT INTO admin_users (email, name, password_hash, role, is_active)
VALUES (
  'w.ineza@alustudent.com',
  'Winny Ineza',
  '$2b$10$POMQ.J5wyCbe417P61akfeAlH/20L/RVvghsc.EG8AGljdOoGJP7S',
  'super_admin',
  true
) ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE members IS 'Choir members information';
COMMENT ON TABLE events IS 'Choir events and concerts';
COMMENT ON TABLE admin_users IS 'Administrative users with roles';
COMMENT ON TABLE login_attempts IS 'Track login attempts for rate limiting';
COMMENT ON TABLE contributions IS 'Member financial contributions';
COMMENT ON TABLE attendance IS 'Rehearsal and event attendance tracking';
COMMENT ON TABLE leave_requests IS 'Member leave requests with approval workflow';
COMMENT ON TABLE expenses IS 'Choir expense tracking';
COMMENT ON TABLE announcements IS 'Announcements and notifications';
COMMENT ON TABLE audit_logs IS 'Audit trail of all admin actions';
