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

-- Done! All columns now match the application's supabaseSync.ts mappings.
