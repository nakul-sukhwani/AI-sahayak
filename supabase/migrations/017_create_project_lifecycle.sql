-- Migration 017: project_milestones + project_outcomes + project_audit_log + due_reminders
-- Module 4 (Project Lifecycle Management)
-- Also adds the deferred FK from industry_commitments.signed_off_milestone_id

-- ── project_milestones ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linkage
  proposal_id   UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  -- Milestone definition
  title         TEXT NOT NULL,
  description   TEXT,
  order_index   SMALLINT NOT NULL DEFAULT 0,           -- ordering within a proposal
  owner_id      UUID NOT NULL REFERENCES users_profile(id),  -- responsible party
  due_date      DATE NOT NULL,

  -- Status
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN (
                  'pending',      -- not started
                  'in_progress',  -- work started
                  'completed',    -- done, evidence uploaded
                  'overdue',      -- past due_date without completion
                  'cancelled'     -- removed from plan
                )),

  -- Evidence (stored in same private bucket as complaints, same naming convention)
  evidence_url  TEXT,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_milestones_proposal   ON project_milestones (proposal_id);
CREATE INDEX IF NOT EXISTS idx_milestones_owner      ON project_milestones (owner_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date   ON project_milestones (due_date);
CREATE INDEX IF NOT EXISTS idx_milestones_status     ON project_milestones (status);
-- Fast stalled-project query (Module 5): milestones overdue or pending past threshold
CREATE INDEX IF NOT EXISTS idx_milestones_overdue
  ON project_milestones (due_date, status)
  WHERE status IN ('pending', 'in_progress');

-- ── project_outcomes ──────────────────────────────────────────────────────
-- IP and deployment tracking per proposal (Module 4)
CREATE TABLE IF NOT EXISTS project_outcomes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id       UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  -- IP tracking (simple structured fields, not a full IP management system)
  patents_filed     INTEGER NOT NULL DEFAULT 0,
  publications      INTEGER NOT NULL DEFAULT 0,
  startup_spun_off  BOOLEAN NOT NULL DEFAULT false,
  startup_name      TEXT,                              -- populated if startup_spun_off = true

  -- Deployment tracking
  deployment_status TEXT NOT NULL DEFAULT 'none'
                    CHECK (deployment_status IN (
                      'none', 'prototype', 'pilot', 'deployed', 'scaled'
                    )),
  deployment_notes  TEXT,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_outcomes_proposal UNIQUE (proposal_id)
);

CREATE TRIGGER update_project_outcomes_updated_at
  BEFORE UPDATE ON project_outcomes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_outcomes_proposal ON project_outcomes (proposal_id);

-- ── project_audit_log ─────────────────────────────────────────────────────
-- Every stage transition logged with actor + timestamp (Module 4 acceptance criteria)
CREATE TABLE IF NOT EXISTS project_audit_log (
  id            BIGSERIAL PRIMARY KEY,
  proposal_id   UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  actor_id      UUID NOT NULL REFERENCES users_profile(id),

  -- What changed
  entity_type   TEXT NOT NULL DEFAULT 'proposal'
                CHECK (entity_type IN ('proposal', 'milestone', 'routing', 'commitment')),
  entity_id     UUID NOT NULL,                        -- the specific row that changed
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  note          TEXT,                                 -- optional reason/comment

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at: audit rows are immutable
);

CREATE INDEX IF NOT EXISTS idx_audit_proposal  ON project_audit_log (proposal_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor     ON project_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON project_audit_log (created_at DESC);

-- ── due_reminders ─────────────────────────────────────────────────────────
-- Polled by the Render Cron Job / background worker (Module 6)
-- A row is inserted when a milestone is created; the worker marks it sent.
CREATE TABLE IF NOT EXISTS due_reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id  UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  remind_at     TIMESTAMPTZ NOT NULL,                 -- when to fire the reminder
  sent          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Worker polls: WHERE sent = false AND remind_at <= now()
CREATE INDEX IF NOT EXISTS idx_reminders_pending
  ON due_reminders (remind_at, sent)
  WHERE sent = false;

-- ── Row-Level Security ────────────────────────────────────────────────────
ALTER TABLE project_milestones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_outcomes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_audit_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_reminders       ENABLE ROW LEVEL SECURITY;

-- project_milestones: all proposal parties can read
CREATE POLICY "milestones_proposal_parties_select"
  ON project_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_id
        AND (
          p.faculty_mentor_id = auth.uid()
          OR auth.uid() = ANY(p.team_members)
          OR EXISTS (
               SELECT 1 FROM challenges c
               WHERE c.id = p.challenge_id AND c.submitted_by = auth.uid()
             )
          OR EXISTS (
               SELECT 1 FROM users_profile up
               WHERE up.id = auth.uid()
                 AND up.role IN ('supervisor', 'officer', 'admin', 'industry_partner')
             )
        )
    )
  );

-- Faculty mentor + admin can create/update milestones
CREATE POLICY "milestones_mentor_write"
  ON project_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_id AND p.faculty_mentor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- project_outcomes: all parties can read
CREATE POLICY "outcomes_parties_select"
  ON project_outcomes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_id
        AND (
          p.faculty_mentor_id = auth.uid()
          OR auth.uid() = ANY(p.team_members)
          OR EXISTS (SELECT 1 FROM users_profile up WHERE up.id = auth.uid()
                     AND up.role IN ('supervisor', 'officer', 'admin'))
        )
    )
  );

-- Faculty mentor / admin can update outcomes
CREATE POLICY "outcomes_mentor_write"
  ON project_outcomes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_id AND p.faculty_mentor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- project_audit_log: actor can see own entries; admin sees all
CREATE POLICY "audit_own_select"
  ON project_audit_log FOR SELECT
  USING (actor_id = auth.uid());

CREATE POLICY "audit_admin_select"
  ON project_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- All parties with access to the proposal can see its audit log
CREATE POLICY "audit_proposal_parties_select"
  ON project_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_id
        AND (
          p.faculty_mentor_id = auth.uid()
          OR auth.uid() = ANY(p.team_members)
          OR EXISTS (SELECT 1 FROM users_profile up WHERE up.id = auth.uid()
                     AND up.role IN ('supervisor', 'officer', 'admin'))
        )
    )
  );

-- due_reminders: admin/cron service only (service_role bypasses RLS for cron worker)
CREATE POLICY "reminders_admin_all"
  ON due_reminders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Deferred FK: industry_commitments.signed_off_milestone_id ────────────
-- Added here because project_milestones now exists
ALTER TABLE industry_commitments
  ADD CONSTRAINT fk_commitment_milestone
  FOREIGN KEY (signed_off_milestone_id)
  REFERENCES project_milestones(id)
  ON DELETE SET NULL;
