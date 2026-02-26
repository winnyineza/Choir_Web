-- Allow new admin roles: social_affairs and coach
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_users_role_check'
      AND conrelid = 'public.admin_users'::regclass
  ) THEN
    ALTER TABLE public.admin_users DROP CONSTRAINT admin_users_role_check;
  END IF;
END $$;

ALTER TABLE public.admin_users
ADD CONSTRAINT admin_users_role_check
CHECK (
  role IN (
    'super_admin',
    'main_admin',
    'finance',
    'secretary',
    'disciplinary',
    'reviewer',
    'social_affairs',
    'coach'
  )
);
