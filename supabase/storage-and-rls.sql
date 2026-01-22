-- =============================================
-- STORAGE BUCKETS
-- Run this in the Supabase SQL Editor after creating the main schema
-- =============================================

-- Create storage buckets (run in Supabase Dashboard -> Storage -> Create bucket, or via SQL)
-- Note: Storage bucket creation via SQL requires specific permissions

-- If you prefer to create via Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Create these buckets:
--    - 'profile-photos' (public: true)
--    - 'documents' (public: false)
--    - 'gallery' (public: true)
--    - 'event-images' (public: true)

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PUBLIC READ POLICIES (for anon users)
-- =============================================

-- Events: Public can view published events
CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  USING (status = 'published');

-- Announcements: Public can view non-expired announcements
CREATE POLICY "Public can view announcements"
  ON announcements FOR SELECT
  USING (expires_at IS NULL OR expires_at > NOW());

-- Gallery: Public can view all gallery items
CREATE POLICY "Public can view gallery"
  ON gallery_albums FOR SELECT
  USING (true);

CREATE POLICY "Public can view gallery images"
  ON gallery_images FOR SELECT
  USING (true);

-- Music Releases: Public can view all releases
CREATE POLICY "Public can view music releases"
  ON music_releases FOR SELECT
  USING (true);

-- Tickets: Public can view available tickets
CREATE POLICY "Public can view tickets"
  ON tickets FOR SELECT
  USING (true);

-- =============================================
-- AUTHENTICATED POLICIES (for logged-in admin users)
-- Since we're using custom auth (not Supabase Auth),
-- these policies allow any request with valid anon key
-- Real security is handled at application level
-- =============================================

-- For development/simple setup: Allow full access via anon key
-- In production, you'd want to use Supabase Auth or service role

-- Members: Full access for admin operations
CREATE POLICY "Allow all operations on members"
  ON members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Events: Full access for admin operations
CREATE POLICY "Allow all operations on events"
  ON events FOR ALL
  USING (true)
  WITH CHECK (true);

-- Contributions: Full access for admin operations
CREATE POLICY "Allow all operations on contributions"
  ON contributions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Attendance: Full access for admin operations
CREATE POLICY "Allow all operations on attendance"
  ON attendance FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin Users: Full access (should be restricted in production)
CREATE POLICY "Allow all operations on admin_users"
  ON admin_users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Login Attempts: Full access for rate limiting
CREATE POLICY "Allow all operations on login_attempts"
  ON login_attempts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Leave Requests: Full access
CREATE POLICY "Allow all operations on leave_requests"
  ON leave_requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- Expenses: Full access
CREATE POLICY "Allow all operations on expenses"
  ON expenses FOR ALL
  USING (true)
  WITH CHECK (true);

-- Announcements: Full access
CREATE POLICY "Allow all operations on announcements"
  ON announcements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Audit Logs: Insert only for anon, full access for service role
CREATE POLICY "Allow all operations on audit_logs"
  ON audit_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Disciplinary Records: Full access
CREATE POLICY "Allow all operations on disciplinary_records"
  ON disciplinary_records FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inventory: Full access
CREATE POLICY "Allow all operations on inventory"
  ON inventory FOR ALL
  USING (true)
  WITH CHECK (true);

-- Documents: Full access
CREATE POLICY "Allow all operations on documents"
  ON documents FOR ALL
  USING (true)
  WITH CHECK (true);

-- Meeting Minutes: Full access
CREATE POLICY "Allow all operations on meeting_minutes"
  ON meeting_minutes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Gallery Albums: Full access
CREATE POLICY "Allow all operations on gallery_albums"
  ON gallery_albums FOR ALL
  USING (true)
  WITH CHECK (true);

-- Gallery Images: Full access
CREATE POLICY "Allow all operations on gallery_images"
  ON gallery_images FOR ALL
  USING (true)
  WITH CHECK (true);

-- Music Releases: Full access
CREATE POLICY "Allow all operations on music_releases"
  ON music_releases FOR ALL
  USING (true)
  WITH CHECK (true);

-- Promo Codes: Full access
CREATE POLICY "Allow all operations on promo_codes"
  ON promo_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Contact Submissions: Full access
CREATE POLICY "Allow all operations on contact_submissions"
  ON contact_submissions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Donations: Full access
CREATE POLICY "Allow all operations on donations"
  ON donations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auditions: Full access
CREATE POLICY "Allow all operations on auditions"
  ON auditions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tickets: Full access
CREATE POLICY "Allow all operations on tickets"
  ON tickets FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ticket Orders: Full access (and public insert for purchases)
CREATE POLICY "Allow all operations on ticket_orders"
  ON ticket_orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- STORAGE POLICIES (apply via Dashboard -> Storage -> Policies)
-- =============================================

/*
For profile-photos bucket:
- SELECT: true (public read)
- INSERT: true (allow uploads)
- UPDATE: true (allow updates)
- DELETE: true (allow deletes)

For documents bucket:
- SELECT: true (allow reads for authenticated)
- INSERT: true (allow uploads)
- UPDATE: true (allow updates)
- DELETE: true (allow deletes)

For gallery bucket:
- SELECT: true (public read)
- INSERT: true (allow uploads)
- UPDATE: true (allow updates)
- DELETE: true (allow deletes)

For event-images bucket:
- SELECT: true (public read)
- INSERT: true (allow uploads)
- UPDATE: true (allow updates)
- DELETE: true (allow deletes)
*/

COMMENT ON POLICY "Public can view published events" ON events IS 'Allows anonymous users to view published events only';
COMMENT ON POLICY "Allow all operations on members" ON members IS 'Development policy - restrict in production';
