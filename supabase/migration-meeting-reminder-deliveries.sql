-- Add meeting reminder delivery log table for idempotency and traceability

CREATE TABLE IF NOT EXISTS meeting_reminder_deliveries (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  meeting_title VARCHAR(255),
  meeting_date DATE NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  reminder_type VARCHAR(50) NOT NULL DEFAULT 'day_before_meeting',
  reminder_date DATE NOT NULL,
  job_run_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (meeting_id, recipient_email, reminder_type, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_meeting_reminder_deliveries_date
  ON meeting_reminder_deliveries(reminder_date DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_reminder_deliveries_meeting
  ON meeting_reminder_deliveries(meeting_id);

CREATE INDEX IF NOT EXISTS idx_meeting_reminder_deliveries_recipient
  ON meeting_reminder_deliveries(recipient_email);
