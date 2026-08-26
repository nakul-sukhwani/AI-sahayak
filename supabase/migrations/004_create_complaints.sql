-- Migration 004: complaints
-- Core complaint table with full assignment and privacy fields

CREATE TABLE IF NOT EXISTS complaints (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users_profile(id),

  -- Location
  latitude                NUMERIC(10, 7) NOT NULL,
  longitude               NUMERIC(10, 7) NOT NULL,
  address                 TEXT,
  ward_name               TEXT,

  -- Issue details
  issue_type              TEXT NOT NULL,
  subcategory             TEXT,
  severity                TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Content
  description_en          TEXT NOT NULL,
  description_hi          TEXT,
  user_notes              TEXT,

  -- AI metadata
  ai_confidence           NUMERIC(3, 2),
  ai_tags                 TEXT[],
  ai_urgency_reason       TEXT,
  ai_suggested_department TEXT,

  -- Privacy
  is_anonymous            BOOLEAN DEFAULT false,
  visibility              TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),

  -- Authority routing
  suggested_authority_id  INTEGER REFERENCES authorities(id),

  -- Assignment
  ai_suggested_worker_id  UUID REFERENCES users_profile(id),
  assigned_to             UUID REFERENCES users_profile(id),
  assigned_by             UUID REFERENCES users_profile(id),
  assigned_at             TIMESTAMPTZ,

  -- Media
  image_url               TEXT NOT NULL,
  voice_url               TEXT,

  -- Status
  status                  TEXT NOT NULL DEFAULT 'filed'
                          CHECK (status IN ('draft', 'filed', 'assigned', 'in_progress',
                                            'proof_submitted', 'resolved', 'rejected')),
  status_updated_at       TIMESTAMPTZ DEFAULT now(),

  -- Timestamps
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for common query patterns
CREATE INDEX idx_complaints_user_id   ON complaints(user_id);
CREATE INDEX idx_complaints_status    ON complaints(status);
CREATE INDEX idx_complaints_ward      ON complaints(ward_name);
CREATE INDEX idx_complaints_created   ON complaints(created_at DESC);
CREATE INDEX idx_complaints_assigned  ON complaints(assigned_to) WHERE assigned_to IS NOT NULL;
