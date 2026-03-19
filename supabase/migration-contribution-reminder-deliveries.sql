-- Add contribution reminder delivery log table so overdue reminder emails
-- can respect a resend interval instead of sending on every daily job run.

CREATE TABLE IF NOT EXISTS contribution_reminder_deliveries (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  reminder_type VARCHAR(50) NOT NULL DEFAULT 'monthly_overdue',
  reminder_date DATE NOT NULL,
  overdue_months INTEGER NOT NULL DEFAULT 0,
  total_due DECIMAL(12, 2) NOT NULL DEFAULT 0,
  job_run_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (member_id, reminder_type, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_contribution_reminder_deliveries_date
  ON contribution_reminder_deliveries(reminder_date DESC);

CREATE INDEX IF NOT EXISTS idx_contribution_reminder_deliveries_member
  ON contribution_reminder_deliveries(member_id);

CREATE INDEX IF NOT EXISTS idx_contribution_reminder_deliveries_recipient
  ON contribution_reminder_deliveries(recipient_email);
