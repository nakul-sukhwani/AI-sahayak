-- Migration 010: image_validation_logs
-- Audit log for every AI image detection result (authenticated user uploads only)

-- Add image validation columns to the complaints table
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS image_validation_status  VARCHAR(20),      -- AUTHENTIC | AI_GENERATED | UNCERTAIN
  ADD COLUMN IF NOT EXISTS image_ai_confidence      NUMERIC(4, 3);    -- 0.000 to 1.000

-- Audit log table for every validation attempt
CREATE TABLE IF NOT EXISTS image_validation_logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  complaint_id      UUID        REFERENCES complaints(id) ON DELETE SET NULL,  -- NULL if rejected before submit
  classification    VARCHAR(20) NOT NULL,   -- AUTHENTIC | AI_GENERATED | UNCERTAIN
  confidence        NUMERIC(4, 3),
  status            VARCHAR(20) NOT NULL,   -- APPROVED | REJECTED | FLAGGED
  reason            TEXT,                   -- Gemini explanation (stored server-side, not exposed to client)
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Index for querying rejections per user (abuse monitoring)
CREATE INDEX IF NOT EXISTS idx_img_validation_user_id    ON image_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_img_validation_status     ON image_validation_logs(status);
CREATE INDEX IF NOT EXISTS idx_img_validation_created_at ON image_validation_logs(created_at);

-- RLS
ALTER TABLE image_validation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all logs
CREATE POLICY "admins_select_validation_logs" ON image_validation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('admin', 'officer')
    )
  );

-- Users can see only their own logs
CREATE POLICY "users_select_own_validation_logs" ON image_validation_logs
  FOR SELECT USING (user_id = auth.uid());

-- Insert allowed from server-side only (using service_role, bypasses RLS)
-- No direct client INSERT policy needed
