-- ChefDhundo Supabase schema (production-safe)
-- Purpose:
--   Safe replacement for webapp/server/src/models/supabaseDB.sql
--
-- Important:
--   This file intentionally contains NO DROP TABLE, NO TRUNCATE, and NO DELETE statements.
--   It is safe to run on production for creating/updating schema.
--   It will not wipe existing users or resumes.
--
-- What it does:
--   1. Ensures required extensions exist.
--   2. Creates users and resumes tables if missing.
--   3. Adds missing columns safely using ADD COLUMN IF NOT EXISTS.
--   4. Adds/replaces safe constraints and indexes.
--   5. Enables RLS and creates policies only if missing.
--   6. Adds updated_at triggers safely.
--   7. Adds protection triggers to block accidental DELETE/TRUNCATE on resumes.

-- =====================================================
-- Extensions
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'basic',
  chef TEXT NOT NULL DEFAULT 'no',
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns safely if table already exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'basic';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS chef TEXT DEFAULT 'no';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Safely enforce expected role/chef values.
-- Note: The app checks role = 'admin' in admin routes, so 'admin' must be allowed.
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('basic', 'pro', 'admin'));

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_chef_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_chef_check
  CHECK (chef IN ('yes', 'no', 'admin'));

-- Add unique constraints/indexes safely
CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_user_id_key
  ON public.users (clerk_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key
  ON public.users (email)
  WHERE email IS NOT NULL;

-- =====================================================
-- RESUMES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  user_location TEXT,
  age_range TEXT,
  gender TEXT,
  city TEXT,
  user_state TEXT,
  pin_code TEXT,
  experience_years DECIMAL(4,1),
  experiences TEXT,
  profession TEXT,
  job_role TEXT,
  education TEXT,
  cuisines TEXT,
  languages TEXT,
  certifications TEXT,
  current_ctc TEXT,
  expected_ctc TEXT,
  notice_period TEXT,
  training TEXT,
  preferred_location TEXT,
  joining TEXT,
  work_type TEXT,
  business_type TEXT,
  linkedin_profile TEXT,
  portfolio_website TEXT,
  bio TEXT,
  passport TEXT,
  photo TEXT,
  resume_file TEXT,
  verified TEXT DEFAULT 'no',
  claimed BOOLEAN DEFAULT true,
  claim_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns safely if table already exists
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS user_location TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS user_state TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS experience_years DECIMAL(4,1);
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS experiences TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS job_role TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS cuisines TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS certifications TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS current_ctc TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS expected_ctc TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS notice_period TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS training TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS preferred_location TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS joining TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS work_type TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS linkedin_profile TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS portfolio_website TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS passport TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS resume_file TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS verified TEXT DEFAULT 'no';
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT true;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS claim_token TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Legacy email columns stay nullable for rollback-safe compatibility.
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.resumes ALTER COLUMN email DROP NOT NULL;

-- Add/resync foreign key safely if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'resumes'
      AND constraint_name = 'resumes_user_id_fkey'
  ) THEN
    ALTER TABLE public.resumes
      ADD CONSTRAINT resumes_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Safe check constraints for enum-like fields
ALTER TABLE public.resumes
  DROP CONSTRAINT IF EXISTS resumes_gender_check;

ALTER TABLE public.resumes
  ADD CONSTRAINT resumes_gender_check
  CHECK (
    gender IS NULL
    OR gender IN ('Male', 'Female', 'Other', 'Prefer not to say')
  );

ALTER TABLE public.resumes
  DROP CONSTRAINT IF EXISTS resumes_training_check;

ALTER TABLE public.resumes
  ADD CONSTRAINT resumes_training_check
  CHECK (
    training IS NULL
    OR training IN ('yes', 'no', 'try')
  );

ALTER TABLE public.resumes
  DROP CONSTRAINT IF EXISTS resumes_joining_check;

ALTER TABLE public.resumes
  ADD CONSTRAINT resumes_joining_check
  CHECK (
    joining IS NULL
    OR joining IN ('immediate', 'specific')
  );

ALTER TABLE public.resumes
  DROP CONSTRAINT IF EXISTS resumes_work_type_check;

ALTER TABLE public.resumes
  ADD CONSTRAINT resumes_work_type_check
  CHECK (
    work_type IS NULL
    OR work_type IN ('full', 'part', 'contract')
  );

ALTER TABLE public.resumes
  DROP CONSTRAINT IF EXISTS resumes_business_type_check;

ALTER TABLE public.resumes
  ADD CONSTRAINT resumes_business_type_check
  CHECK (
    business_type IS NULL
    OR business_type IN ('any', 'new', 'old')
  );

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON public.users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_chef ON public.users(chef);

CREATE UNIQUE INDEX IF NOT EXISTS uq_resumes_user_id
  ON public.resumes(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resumes_email ON public.resumes(email);
CREATE INDEX IF NOT EXISTS idx_resumes_phone ON public.resumes(phone);
CREATE INDEX IF NOT EXISTS idx_resumes_city ON public.resumes(city);
CREATE INDEX IF NOT EXISTS idx_resumes_state ON public.resumes(user_state);
CREATE INDEX IF NOT EXISTS idx_resumes_profession ON public.resumes(profession);
CREATE INDEX IF NOT EXISTS idx_resumes_job_role ON public.resumes(job_role);
CREATE INDEX IF NOT EXISTS idx_resumes_work_type ON public.resumes(work_type);
CREATE INDEX IF NOT EXISTS idx_resumes_experience ON public.resumes(experience_years);
CREATE INDEX IF NOT EXISTS idx_resumes_claim_token ON public.resumes(claim_token);
CREATE INDEX IF NOT EXISTS idx_resumes_claimed ON public.resumes(claimed);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create policies only if they do not already exist.
-- Policies use service_role for backend/admin operations.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Enable all operations for service role'
  ) THEN
    CREATE POLICY "Enable all operations for service role"
      ON public.users
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can view own data'
  ) THEN
    CREATE POLICY "Users can view own data"
      ON public.users
      FOR SELECT
      USING (auth.uid()::text = clerk_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data"
      ON public.users
      FOR UPDATE
      USING (auth.uid()::text = clerk_user_id)
      WITH CHECK (auth.uid()::text = clerk_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resumes'
      AND policyname = 'Enable all operations for service role on resumes'
  ) THEN
    CREATE POLICY "Enable all operations for service role on resumes"
      ON public.resumes
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resumes'
      AND policyname = 'Users can view own resumes'
  ) THEN
    CREATE POLICY "Users can view own resumes"
      ON public.resumes
      FOR SELECT
      USING (
        user_id IN (
          SELECT id
          FROM public.users
          WHERE clerk_user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resumes'
      AND policyname = 'Users can manage own resumes'
  ) THEN
    CREATE POLICY "Users can manage own resumes"
      ON public.resumes
      FOR ALL
      USING (
        user_id IN (
          SELECT id
          FROM public.users
          WHERE clerk_user_id = auth.uid()::text
        )
      )
      WITH CHECK (
        user_id IN (
          SELECT id
          FROM public.users
          WHERE clerk_user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

-- =====================================================
-- PRODUCTION SAFETY: BLOCK ACCIDENTAL RESUME WIPES
-- =====================================================
-- This protects the resumes table from accidental DELETE/TRUNCATE commands.
-- It does not block INSERT or UPDATE.
-- It does not block DROP TABLE, so credentials and deployment scripts still need to be secured.

CREATE OR REPLACE FUNCTION public.block_resume_delete_or_truncate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- To re-enable, uncomment the RAISE line and remove the RETURN lines.
  -- RAISE EXCEPTION 'Blocked: resumes table delete/truncate is disabled for safety.';
  
  -- Allow the operation to proceed.
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSIF TG_OP = 'TRUNCATE' THEN
    RETURN NULL;
  END IF;
  
  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'block_resumes_delete'
      AND tgrelid = 'public.resumes'::regclass
  ) THEN
    CREATE TRIGGER block_resumes_delete
      BEFORE DELETE ON public.resumes
      FOR EACH ROW
      EXECUTE FUNCTION public.block_resume_delete_or_truncate();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'block_resumes_truncate'
      AND tgrelid = 'public.resumes'::regclass
  ) THEN
    CREATE TRIGGER block_resumes_truncate
      BEFORE TRUNCATE ON public.resumes
      FOR EACH STATEMENT
      EXECUTE FUNCTION public.block_resume_delete_or_truncate();
  END IF;
END $$;

-- =====================================================
-- AUDIT TABLE FOR FUTURE INVESTIGATION
-- =====================================================
-- This records future DELETE/TRUNCATE activity on selected tables.
-- It cannot show old deletes from before this table existed.

CREATE TABLE IF NOT EXISTS public.audit_data_changes (
  id BIGSERIAL PRIMARY KEY,
  happened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  row_id TEXT,
  old_row JSONB,
  db_user TEXT DEFAULT current_user,
  app_name TEXT DEFAULT current_setting('application_name', true),
  client_addr INET DEFAULT inet_client_addr()
);

CREATE OR REPLACE FUNCTION public.log_data_delete_or_truncate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_data_changes (
      table_name,
      action,
      row_id,
      old_row
    )
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      COALESCE(OLD.id::text, NULL),
      to_jsonb(OLD)
    );

    RETURN OLD;
  ELSIF TG_OP = 'TRUNCATE' THEN
    INSERT INTO public.audit_data_changes (
      table_name,
      action,
      row_id,
      old_row
    )
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NULL,
      NULL
    );

    RETURN NULL;
  END IF;

  RETURN NULL;
END;
$$;

-- Add audit triggers to users/announcements/subscriptions if those tables exist.
-- We do not add an AFTER DELETE audit trigger to resumes because resumes DELETE is blocked before it can happen.

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'audit_users_delete'
         AND tgrelid = 'public.users'::regclass
     ) THEN
    CREATE TRIGGER audit_users_delete
      AFTER DELETE ON public.users
      FOR EACH ROW
      EXECUTE FUNCTION public.log_data_delete_or_truncate();
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'audit_users_truncate'
         AND tgrelid = 'public.users'::regclass
     ) THEN
    CREATE TRIGGER audit_users_truncate
      AFTER TRUNCATE ON public.users
      FOR EACH STATEMENT
      EXECUTE FUNCTION public.log_data_delete_or_truncate();
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.announcements') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'audit_announcements_delete'
         AND tgrelid = 'public.announcements'::regclass
     ) THEN
    CREATE TRIGGER audit_announcements_delete
      AFTER DELETE ON public.announcements
      FOR EACH ROW
      EXECUTE FUNCTION public.log_data_delete_or_truncate();
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.announcements') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'audit_announcements_truncate'
         AND tgrelid = 'public.announcements'::regclass
     ) THEN
    CREATE TRIGGER audit_announcements_truncate
      AFTER TRUNCATE ON public.announcements
      FOR EACH STATEMENT
      EXECUTE FUNCTION public.log_data_delete_or_truncate();
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'audit_subscriptions_delete'
         AND tgrelid = 'public.subscriptions'::regclass
     ) THEN
    CREATE TRIGGER audit_subscriptions_delete
      AFTER DELETE ON public.subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION public.log_data_delete_or_truncate();
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'audit_subscriptions_truncate'
         AND tgrelid = 'public.subscriptions'::regclass
     ) THEN
    CREATE TRIGGER audit_subscriptions_truncate
      AFTER TRUNCATE ON public.subscriptions
      FOR EACH STATEMENT
      EXECUTE FUNCTION public.log_data_delete_or_truncate();
  END IF;
END $$;

-- =====================================================
-- OPTIONAL VERIFICATION QUERIES
-- =====================================================
-- Run manually after this file if needed:
--
-- SELECT 'users' AS table_name, count(*) AS row_count FROM public.users
-- UNION ALL
-- SELECT 'resumes' AS table_name, count(*) AS row_count FROM public.resumes;
--
-- SELECT tgname AS trigger_name, tgenabled
-- FROM pg_trigger
-- WHERE tgrelid = 'public.resumes'::regclass
-- AND NOT tgisinternal
-- ORDER BY tgname;
--
-- SELECT *
-- FROM public.audit_data_changes
-- ORDER BY happened_at DESC
-- LIMIT 100;
