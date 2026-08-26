-- Migration 001: users_profile
-- Stores citizen/worker/supervisor/officer/admin profiles linked to Supabase Auth

CREATE TABLE IF NOT EXISTS users_profile (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL,
  full_name     TEXT,
  display_name  TEXT,
  ward_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'citizen'
                CHECK (role IN ('citizen', 'worker', 'supervisor', 'officer', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auto-create profile row on new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, phone, role)
  VALUES (NEW.id, COALESCE(NEW.phone, ''), 'citizen')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
