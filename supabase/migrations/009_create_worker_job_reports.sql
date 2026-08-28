-- Migration 009: worker_job_reports
-- Captures worker field reports associated with proof of work

CREATE TABLE IF NOT EXISTS worker_job_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_proof_id       UUID NOT NULL REFERENCES work_proof(id) ON DELETE CASCADE,
  worker_issues       TEXT,
  damage_type         TEXT NOT NULL,
  tools_required      TEXT[] DEFAULT '{}',
  team_members_count  INT DEFAULT 1,
  captured_latitude   NUMERIC(10, 7) NOT NULL,
  captured_longitude  NUMERIC(10, 7) NOT NULL,
  captured_at         TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_worker_job_reports_work_proof ON worker_job_reports(work_proof_id);

-- RLS Policies
ALTER TABLE worker_job_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workers_insert_own_report" ON worker_job_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_proof
      WHERE work_proof.id = worker_job_reports.work_proof_id
        AND work_proof.worker_id = auth.uid()
    )
  );

CREATE POLICY "supervisors_officers_select_reports" ON worker_job_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('supervisor', 'officer', 'admin')
    )
  );

CREATE POLICY "workers_select_own_report" ON worker_job_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_proof
      WHERE work_proof.id = worker_job_reports.work_proof_id
        AND work_proof.worker_id = auth.uid()
    )
  );
