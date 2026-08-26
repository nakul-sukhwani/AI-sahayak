-- Migration 003: wards
-- Ward geographic data for Bangalore/BBMP

CREATE TABLE IF NOT EXISTS wards (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,
  city          TEXT NOT NULL DEFAULT 'Bangalore',
  center_lat    NUMERIC(10, 7),
  center_lng    NUMERIC(10, 7),
  boundary_geo  JSONB
);
