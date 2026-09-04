-- Migration 015: proposals
-- Module 1 (University Collaboration)
-- A proposal is submitted by a faculty mentor for a challenge that has been
-- accepted by their university. One proposal allowed per (challenge, university) pair.

CREATE TABLE IF NOT EXISTS proposals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linkage
  challenge_id      UUID NOT NULL REFERENCES challenges(id) ON DELETE RESTRICT,
  university_id     UUID NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
  faculty_mentor_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE RESTRICT,

  -- Team (array of users_profile UUIDs — students + co-mentors)
  team_members      UUID[] NOT NULL DEFAULT '{}',

  -- Proposal content stored as structured JSONB (Rule 15: one source of truth in DB)
  -- Expected shape: {
  --   problem_understanding: string,
  --   proposed_approach:     string,
  --   expected_outcomes:     string,
  --   timeline_weeks:        number,
  --   resource_needs:        string,
  --   needs_industry_support: boolean,
  --   industry_support_type:  string[]   -- mentorship | funding | prototyping | testing | deployment
  -- }
  content           JSONB NOT NULL DEFAULT '{}',

  -- File attachments (stored in same bucket as complaint evidence)
  attachment_urls   TEXT[] NOT NULL DEFAULT '{}',

  -- Status mirrors challenge lifecycle stages relevant to proposals
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN (
                      'draft',      -- being written by faculty
                      'submitted',  -- submitted for govt review
                      'approved',   -- govt approved: challenge moves to in_progress
                      'rejected',   -- govt rejected the proposal
                      'withdrawn'   -- university withdrew
                    )),

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Enforce: one active proposal per (challenge, university) pair
  CONSTRAINT uq_proposal_challenge_university UNIQUE (challenge_id, university_id)
);

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_proposals_challenge     ON proposals (challenge_id);
CREATE INDEX IF NOT EXISTS idx_proposals_university    ON proposals (university_id);
CREATE INDEX IF NOT EXISTS idx_proposals_mentor        ON proposals (faculty_mentor_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status        ON proposals (status);
-- Fast lookup: proposals needing industry support (for industry matching in Module 2)
CREATE INDEX IF NOT EXISTS idx_proposals_industry_need
  ON proposals ((content->>'needs_industry_support'))
  WHERE (content->>'needs_industry_support') = 'true';

-- ── Row-Level Security ────────────────────────────────────────────────────
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Faculty mentor can read/write their own proposals
CREATE POLICY "proposals_mentor_all"
  ON proposals FOR ALL
  USING (auth.uid() = faculty_mentor_id);

-- University admin sees all proposals for their institution
CREATE POLICY "proposals_university_admin_select"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM universities u
      JOIN users_profile up ON up.id = auth.uid()
      WHERE u.id = university_id
        AND u.admin_user_id = auth.uid()
        AND up.role = 'university_admin'
    )
  );

-- Students (team members) can read proposals they are part of
-- Array containment check: auth.uid() = ANY(team_members)
CREATE POLICY "proposals_team_member_select"
  ON proposals FOR SELECT
  USING (
    auth.uid() = ANY(team_members)
    AND EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Govt/admin can read all proposals (for approval gate)
CREATE POLICY "proposals_reviewer_select"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid()
        AND role IN ('supervisor', 'officer', 'admin')
    )
  );

-- Govt/admin can update status (approved/rejected approval gate)
CREATE POLICY "proposals_reviewer_update"
  ON proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid()
        AND role IN ('supervisor', 'officer', 'admin')
    )
  );

-- Citizens/org submitters: read-only view of proposals for their own challenge
CREATE POLICY "proposals_submitter_select"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_id
        AND c.submitted_by = auth.uid()
    )
  );

-- Industry partners: read proposals where they have a commitment (app-layer filter)
CREATE POLICY "proposals_industry_select"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'industry_partner'
    )
  );
