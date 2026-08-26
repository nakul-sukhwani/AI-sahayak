-- Migration 007: work_proof + all RLS policies
-- Proof-of-work submission and AI/human verification

CREATE TABLE IF NOT EXISTS work_proof (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id          UUID NOT NULL REFERENCES complaints(id),
  worker_id             UUID NOT NULL REFERENCES users_profile(id),

  -- Photos
  before_photo_url      TEXT,
  after_photo_url       TEXT NOT NULL,

  -- Worker input
  worker_notes          TEXT,
  submitted_at          TIMESTAMPTZ DEFAULT now(),

  -- AI verification
  ai_verified           BOOLEAN,
  ai_confidence         NUMERIC(3, 2),
  ai_observation        TEXT,
  ai_remaining_issues   TEXT,
  ai_new_issues         TEXT,
  ai_analyzed_at        TIMESTAMPTZ,

  -- Human verification
  verified_by           UUID REFERENCES users_profile(id),
  verified_at           TIMESTAMPTZ,
  status                TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending', 'ai_verified', 'approved', 'rejected')),
  rejection_reason      TEXT
);

CREATE INDEX idx_work_proof_complaint ON work_proof(complaint_id);
CREATE INDEX idx_work_proof_worker    ON work_proof(worker_id);
CREATE INDEX idx_work_proof_status    ON work_proof(status);

-- ============================================================
-- RLS POLICIES — all tables
-- ============================================================

-- users_profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON users_profile
  FOR ALL USING (auth.uid() = id);

-- authorities: public read
ALTER TABLE authorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_authorities" ON authorities
  FOR SELECT USING (true);

-- wards: public read
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_wards" ON wards
  FOR SELECT USING (true);

-- complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "citizens_own_complaints" ON complaints
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "workers_see_assigned" ON complaints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker')
    AND assigned_to = auth.uid()
  );

CREATE POLICY "workers_update_assigned" ON complaints
  FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "supervisors_see_all" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('supervisor', 'officer', 'admin')
    )
  );

CREATE POLICY "supervisors_update_complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('supervisor', 'officer', 'admin')
    )
  );

-- workers table
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workers_own_row" ON workers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "supervisors_see_workers" ON workers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('supervisor', 'officer', 'admin')
    )
  );

-- work_proof
ALTER TABLE work_proof ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workers_own_proof" ON work_proof
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "workers_insert_proof" ON work_proof
  FOR INSERT WITH CHECK (worker_id = auth.uid());

CREATE POLICY "citizens_see_resolved_proof" ON work_proof
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE complaints.id = work_proof.complaint_id
        AND complaints.user_id = auth.uid()
        AND complaints.status = 'resolved'
    )
  );

CREATE POLICY "officers_see_proof" ON work_proof
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('officer', 'supervisor', 'admin')
    )
  );

CREATE POLICY "officers_update_proof" ON work_proof
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('officer', 'supervisor', 'admin')
    )
  );

-- audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_all_logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_create_reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
