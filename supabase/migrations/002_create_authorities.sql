-- Migration 002: authorities
-- Curated static database of municipal departments per city/ward/issue type

CREATE TABLE IF NOT EXISTS authorities (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  department    TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  city          TEXT NOT NULL DEFAULT 'Bangalore',
  issue_types   TEXT[] NOT NULL,
  wards         TEXT[] NOT NULL
);
