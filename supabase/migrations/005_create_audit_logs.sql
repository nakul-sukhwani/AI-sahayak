-- Migration 005: audit_logs + reports
-- Immutable audit trail for all state changes

CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES users_profile(id),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- Reports: for public-feed abuse prevention
CREATE TABLE IF NOT EXISTS reports (
  id            BIGSERIAL PRIMARY KEY,
  reporter_id   UUID REFERENCES users_profile(id),
  complaint_id  UUID REFERENCES complaints(id),
  reason        TEXT NOT NULL,
  status        TEXT DEFAULT 'pending'
                CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at    TIMESTAMPTZ DEFAULT now()
);
