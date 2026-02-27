-- Restrict meeting categories to general/committee and normalize legacy values

ALTER TABLE meeting_minutes
ALTER COLUMN type SET DEFAULT 'general';

UPDATE meeting_minutes
SET type = 'general'
WHERE type IS NULL OR type NOT IN ('general', 'committee');
