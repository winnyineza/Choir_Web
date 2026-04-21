-- Member special contribution classes and class-based special contribution support
-- Forward-only migration; safe to run on existing databases.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS special_contribution_class VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'members'
      AND column_name = 'special_contribution_class'
  ) THEN
    ALTER TABLE members
      ADD CONSTRAINT members_special_contribution_class_check
      CHECK (special_contribution_class IN ('Class 1', 'Class 2', 'Class 3'));
  END IF;
END $$;

ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS class_at_payment VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'contributions'
      AND column_name = 'class_at_payment'
  ) THEN
    ALTER TABLE contributions
      ADD CONSTRAINT contributions_class_at_payment_check
      CHECK (class_at_payment IN ('Class 1', 'Class 2', 'Class 3'));
  END IF; 
END $$;

ALTER TABLE contribution_types
  ADD COLUMN IF NOT EXISTS special_amount_mode VARCHAR(20) DEFAULT 'flat_per_member',
  ADD COLUMN IF NOT EXISTS class_1_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS class_2_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS class_3_amount DECIMAL(12, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'contribution_types'
      AND column_name = 'special_amount_mode'
  ) THEN
    ALTER TABLE contribution_types
      ADD CONSTRAINT contribution_types_special_amount_mode_check
      CHECK (special_amount_mode IN ('flat_per_member', 'class_based'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS member_class_changes (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  old_class VARCHAR(20) CHECK (old_class IN ('Class 1', 'Class 2', 'Class 3')),
  new_class VARCHAR(20) CHECK (new_class IN ('Class 1', 'Class 2', 'Class 3')),
  changed_by_admin_id TEXT,
  changed_by_name VARCHAR(255),
  changed_by_role VARCHAR(50),
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_class_changes_member ON member_class_changes(member_id);
CREATE INDEX IF NOT EXISTS idx_member_class_changes_changed_at ON member_class_changes(changed_at);

CREATE TABLE IF NOT EXISTS special_contribution_assignments (
  id TEXT PRIMARY KEY,
  type_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  class_at_assignment VARCHAR(20) CHECK (class_at_assignment IN ('Class 1', 'Class 2', 'Class 3')),
  expected_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  assignment_source VARCHAR(20) DEFAULT 'type_created' CHECK (assignment_source IN ('type_created', 'member_added')),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_special_contribution_assignments_type ON special_contribution_assignments(type_id);
CREATE INDEX IF NOT EXISTS idx_special_contribution_assignments_member ON special_contribution_assignments(member_id);