-- Migration 011: extend users_profile for SIH 26043 roles
-- Widens the role CHECK constraint from 5 values to 11 values.
-- Adds submitter_org_name for community_org / pri_ulb_official / industry_partner users.
-- Safe to re-run: IF NOT EXISTS guards prevent duplicate column errors.

-- Step 1: Drop the old inline CHECK constraint
-- PostgreSQL auto-names inline CHECK constraints as <table>_<col>_check.
-- Verify with: SELECT conname FROM pg_constraint WHERE conrelid = 'users_profile'::regclass AND contype = 'c';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conrelid  = 'users_profile'::regclass
    AND    conname   = 'users_profile_role_check'
    AND    contype   = 'c'
  ) THEN
    ALTER TABLE users_profile DROP CONSTRAINT users_profile_role_check;
  END IF;
END $$;

-- Step 2: Add the new 11-value CHECK constraint
ALTER TABLE users_profile
  ADD CONSTRAINT users_profile_role_check
  CHECK (role IN (
    -- original roles
    'citizen',
    'worker',
    'supervisor',
    'officer',
    'admin',
    -- SIH 26043: Extended Submitter Base (Module 7)
    'community_org',
    'pri_ulb_official',
    -- SIH 26043: University Collaboration (Module 1)
    'university_admin',
    'faculty_mentor',
    'student',
    -- SIH 26043: Industry Partnership (Module 2)
    'industry_partner'
  ));

-- Step 3: Add submitter_org_name column
-- Populated for community_org / pri_ulb_official / industry_partner.
-- NULL for original roles (existing rows unaffected).
ALTER TABLE users_profile
  ADD COLUMN IF NOT EXISTS submitter_org_name TEXT;

-- Step 4: Indexes for fast role and org queries (Module 7 org-level dashboard)
CREATE INDEX IF NOT EXISTS idx_users_profile_role
  ON users_profile (role);

CREATE INDEX IF NOT EXISTS idx_users_profile_org
  ON users_profile (submitter_org_name)
  WHERE submitter_org_name IS NOT NULL;
