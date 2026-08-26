-- Seed: Demo Users for Testing
-- =====================================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users → Add User
-- 2. Create these 5 users with OTP (phone) or email+password
-- 3. Copy their UUIDs and replace the placeholder UUIDs below
-- 4. Run this SQL in Supabase SQL Editor
-- =====================================================================

-- Demo User UUIDs (replace with real UUIDs from Supabase Auth after creating users)
-- Worker 1:    worker1@demo.nagrikseva  / phone: +919000000001
-- Worker 2:    worker2@demo.nagrikseva  / phone: +919000000002
-- Worker 3:    worker3@demo.nagrikseva  / phone: +919000000003
-- Supervisor:  super@demo.nagrikseva    / phone: +919000000004
-- Officer:     officer@demo.nagrikseva  / phone: +919000000005

DO $$
DECLARE
  worker1_id  UUID := '00000000-0000-0000-0000-000000000001';
  worker2_id  UUID := '00000000-0000-0000-0000-000000000002';
  worker3_id  UUID := '00000000-0000-0000-0000-000000000003';
  super_id    UUID := '00000000-0000-0000-0000-000000000004';
  officer_id  UUID := '00000000-0000-0000-0000-000000000005';
BEGIN

  -- ── users_profile rows ─────────────────────────────────────────────
  INSERT INTO users_profile (id, phone, full_name, display_name, ward_name, role)
  VALUES
    (worker1_id, '+919000000001', 'Raju Nair',        'Raju',       'Koramangala', 'worker'),
    (worker2_id, '+919000000002', 'Suresh Kumar',     'Suresh',     'Indiranagar',  'worker'),
    (worker3_id, '+919000000003', 'Anand Krishnan',   'Anand',      'Jayanagar',    'worker'),
    (super_id,   '+919000000004', 'Priya Menon',      'Priya',      'Koramangala',  'supervisor'),
    (officer_id, '+919000000005', 'Vikram Reddy',     'Vikram',     'Koramangala',  'officer')
  ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        display_name = EXCLUDED.display_name;

  -- ── workers rows ───────────────────────────────────────────────────
  INSERT INTO workers (user_id, area_name, department, is_available, max_concurrent_tasks)
  VALUES
    (worker1_id, 'Koramangala', 'Solid Waste Management', true, 3),
    (worker2_id, 'Indiranagar',  'Roads & Infrastructure',  true, 3),
    (worker3_id, 'Jayanagar',    'Roads & Infrastructure',  true, 3)
  ON CONFLICT (user_id) DO UPDATE
    SET area_name  = EXCLUDED.area_name,
        department = EXCLUDED.department;

END $$;
