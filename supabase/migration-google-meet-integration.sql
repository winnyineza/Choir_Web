-- Google Calendar + Google Meet integration storage

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

ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS google_meet_link TEXT;
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS google_event_link TEXT;
ALTER TABLE meeting_minutes ADD COLUMN IF NOT EXISTS google_conference_id TEXT;
