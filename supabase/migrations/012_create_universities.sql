-- Migration 012: universities + university_expertise
-- Module 1 (University Collaboration) + Module 3 (Routing Engine)
-- Requires: pgvector extension enabled in Supabase (Dashboard -> Extensions -> vector)
-- Requires: PostGIS extension enabled (Dashboard -> Extensions -> postgis)

-- Enable extensions if not already active (safe no-op if they are)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── universities ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS universities (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Basic identity
  name                  TEXT NOT NULL,
  short_name            TEXT,                          -- e.g. "IIT Dhanbad"
  -- Location (Jharkhand context)
  district              TEXT,
  state                 TEXT NOT NULL DEFAULT 'Jharkhand',
  address               TEXT,
  location              GEOGRAPHY(POINT, 4326),        -- PostGIS; used for distance ranking
  -- Academic profile
  disciplines           TEXT[] NOT NULL DEFAULT '{}', -- e.g. ['Civil Engineering', 'Public Health']
  incubation_facilities JSONB,                        -- flexible: {name, capacity, contact}
  innovation_cell       BOOLEAN NOT NULL DEFAULT false,
  website_url           TEXT,
  -- Admin linkage
  admin_user_id         UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at (reuses trigger function created in migration 001)
CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ── university_expertise ─────────────────────────────────────────────────
-- One row per discipline/research-centre per university.
-- expertise_embedding is generated at onboarding from the description text
-- using Gemini text-embedding-004 (768 dimensions).
CREATE TABLE IF NOT EXISTS university_expertise (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id       UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  domain              TEXT NOT NULL,                   -- e.g. "Water Sanitation"
  description         TEXT NOT NULL,                   -- rich text used to generate the embedding
  expertise_embedding VECTOR(768),                     -- Gemini text-embedding-004; NULL until embedded
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_university_expertise_updated_at
  BEFORE UPDATE ON university_expertise
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ── Indexes ───────────────────────────────────────────────────────────────
-- Cosine similarity search for routing engine (Module 3)
-- IVFFlat: good for Supabase free tier. Upgrade to HNSW if pgvector >= 0.5 and dataset grows.
CREATE INDEX IF NOT EXISTS idx_university_expertise_embedding
  ON university_expertise
  USING ivfflat (expertise_embedding vector_cosine_ops)
  WITH (lists = 10);                                   -- lists = sqrt(row_count) at scale

-- Fast lookups by university
CREATE INDEX IF NOT EXISTS idx_university_expertise_university
  ON university_expertise (university_id);

-- District lookup for PostGIS proximity pre-filter
CREATE INDEX IF NOT EXISTS idx_universities_district
  ON universities (district);

-- ── Row-Level Security ────────────────────────────────────────────────────
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_expertise ENABLE ROW LEVEL SECURITY;

-- Universities: public read (govt reviewers, citizens can see institution names)
CREATE POLICY "universities_public_read"
  ON universities FOR SELECT
  USING (true);

-- Universities: only platform_admin can create/update
CREATE POLICY "universities_admin_write"
  ON universities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- university_expertise: university_admin sees only their own institution
CREATE POLICY "expertise_university_admin_select"
  ON university_expertise FOR SELECT
  USING (
    -- platform admin sees all
    EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin')
    OR
    -- university_admin / faculty_mentor see their own institution
    EXISTS (
      SELECT 1 FROM universities u
      WHERE u.id = university_id
        AND u.admin_user_id = auth.uid()
    )
    OR
    -- faculty_mentor linked to this university (checked via proposals in app layer)
    -- For simplicity, all university-role users can read expertise rows
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid()
        AND role IN ('university_admin', 'faculty_mentor', 'student')
    )
  );

-- university_expertise: only platform_admin can insert/update embeddings
CREATE POLICY "expertise_admin_write"
  ON university_expertise FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
