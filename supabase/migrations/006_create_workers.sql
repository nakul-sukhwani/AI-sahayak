-- Migration 006: workers
-- Extended profile for users with role='worker'

CREATE TABLE IF NOT EXISTS workers (
  user_id               UUID PRIMARY KEY REFERENCES users_profile(id),
  area_name             TEXT NOT NULL,
  department            TEXT NOT NULL,
  is_available          BOOLEAN DEFAULT true,
  max_concurrent_tasks  INT DEFAULT 3,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workers_department ON workers(department);
CREATE INDEX idx_workers_available  ON workers(is_available) WHERE is_available = true;
