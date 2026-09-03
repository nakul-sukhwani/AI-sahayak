-- Migration 016: industry_partners + industry_commitments
-- Module 2 (Industry Partnership) + Module 3 (Routing Engine — industry side)

-- ── industry_partners ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS industry_partners (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organisation identity
  org_name             TEXT NOT NULL,
  partner_type         TEXT NOT NULL
                       CHECK (partner_type IN (
                         'startup', 'msme', 'csr', 'research_lab', 'incubator'
                       )),
  website_url          TEXT,

  -- Sector tags (e.g. ['AgriTech', 'WaterTech', 'HealthTech'])
  sectors              TEXT[] NOT NULL DEFAULT '{}',

  -- Engagement types this partner offers
  engagement_types     TEXT[] NOT NULL DEFAULT '{}'
                       -- values from: mentorship | funding | prototyping | testing | deployment
                       CHECK (engagement_types <@ ARRAY[
                         'mentorship','funding','prototyping','testing','deployment'
                       ]::TEXT[]),

  -- Capacity / availability
  mentorship_hours_per_month  INTEGER,   -- NULL = unspecified
  max_concurrent_engagements  INTEGER DEFAULT 3,

  -- Industry matching embedding (Gemini text-embedding-004, 768-dim)
  -- Generated from sectors + engagement_types description at onboarding
  capability_embedding VECTOR(768),

  -- Linked user account
  owner_user_id        UUID REFERENCES users_profile(id) ON DELETE SET NULL,

  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_industry_partners_updated_at
  BEFORE UPDATE ON industry_partners
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- IVFFlat for Module 3 industry matching (B3 / E2 routes)
CREATE INDEX IF NOT EXISTS idx_industry_capability_embedding
  ON industry_partners
  USING ivfflat (capability_embedding vector_cosine_ops)
  WITH (lists = 10);

CREATE INDEX IF NOT EXISTS idx_industry_partner_type ON industry_partners (partner_type);
CREATE INDEX IF NOT EXISTS idx_industry_owner        ON industry_partners (owner_user_id);

-- ── industry_commitments ──────────────────────────────────────────────────
-- Structured record of what an industry partner commits to for a specific proposal.
-- All numeric fields for dashboard rollups (Module 5) without manual re-entry.
CREATE TABLE IF NOT EXISTS industry_commitments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linkage
  proposal_id          UUID NOT NULL REFERENCES proposals(id) ON DELETE RESTRICT,
  industry_partner_id  UUID NOT NULL REFERENCES industry_partners(id) ON DELETE RESTRICT,

  -- Commitment type (single per row; multiple rows allowed per proposal-partner pair)
  commitment_type      TEXT NOT NULL
                       CHECK (commitment_type IN (
                         'mentorship', 'funding', 'prototyping', 'testing', 'deployment'
                       )),

  -- Structured amount fields (Rule 4: no free text, actual working fields)
  mentorship_hours     INTEGER,          -- for commitment_type = 'mentorship'
  funding_inr          NUMERIC(15, 2),   -- for commitment_type = 'funding' (INR)
  in_kind_description  TEXT,             -- for prototyping/testing/deployment

  -- Status
  status               TEXT NOT NULL DEFAULT 'committed'
                       CHECK (status IN (
                         'interested',   -- expressed interest, not yet confirmed
                         'committed',    -- formally committed
                         'active',       -- engagement is ongoing
                         'completed',    -- milestone sign-off done
                         'withdrawn'     -- partner withdrew
                       )),

  -- Industry sign-off on a milestone (Module 4 integration)
  signed_off_milestone_id UUID,          -- references project_milestones(id); added via FK after migration 017

  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_industry_commitments_updated_at
  BEFORE UPDATE ON industry_commitments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_commitments_proposal  ON industry_commitments (proposal_id);
CREATE INDEX IF NOT EXISTS idx_commitments_partner   ON industry_commitments (industry_partner_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status    ON industry_commitments (status);
-- Analytics rollup: active funding commitments by partner type (Module 5)
CREATE INDEX IF NOT EXISTS idx_commitments_funding
  ON industry_commitments (commitment_type, status)
  WHERE commitment_type = 'funding';

-- ── Row-Level Security ────────────────────────────────────────────────────
ALTER TABLE industry_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_commitments ENABLE ROW LEVEL SECURITY;

-- industry_partners: public read (university teams need to see who is committing)
CREATE POLICY "industry_partners_public_read"
  ON industry_partners FOR SELECT
  USING (true);

-- industry_partners: owner can update their own profile
CREATE POLICY "industry_partners_owner_update"
  ON industry_partners FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- industry_partners: platform_admin can create/update all
CREATE POLICY "industry_partners_admin_all"
  ON industry_partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- industry_commitments: industry partner sees/manages their own commitments
CREATE POLICY "commitments_partner_all"
  ON industry_commitments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM industry_partners ip
      WHERE ip.id = industry_partner_id
        AND ip.owner_user_id = auth.uid()
    )
  );

-- University team can read commitments on their proposals
CREATE POLICY "commitments_university_select"
  ON industry_commitments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_id
        AND (
          p.faculty_mentor_id = auth.uid()
          OR auth.uid() = ANY(p.team_members)
        )
    )
  );

-- Govt/admin can read all commitments (feeds analytics dashboard Module 5)
CREATE POLICY "commitments_reviewer_select"
  ON industry_commitments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid()
        AND role IN ('supervisor', 'officer', 'admin')
    )
  );
