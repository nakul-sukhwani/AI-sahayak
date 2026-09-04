-- Migration 018: notifications
-- Module 6 (Notification & Communication System)
-- In-app notification store. Event-driven: API routes insert rows via server-side helper.
-- Email delivery handled in application layer (src/lib/notifications.ts).

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  user_id       UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,

  -- Event metadata
  event_type    TEXT NOT NULL
                CHECK (event_type IN (
                  -- Module 3: routing
                  'routing_suggested',
                  'routing_approved',
                  'routing_declined',
                  -- Module 1: university collaboration
                  'challenge_accepted',
                  'challenge_declined',
                  'team_formed',
                  'proposal_submitted',
                  -- Module 4: lifecycle
                  'stage_transition',
                  'milestone_due_soon',    -- N days before due_date
                  'milestone_overdue',     -- past due_date, not completed
                  'milestone_completed',
                  -- Module 2: industry
                  'industry_interest',
                  'industry_committed',
                  'industry_withdrawn',
                  -- General
                  'govt_approval',
                  'govt_rejection'
                )),

  -- Polymorphic reference: UUID of the related entity
  -- (challenge_id, proposal_id, milestone_id, routing_id, commitment_id)
  reference_id  UUID,

  -- Human-readable message (pre-rendered server-side; never raw stack traces)
  message       TEXT NOT NULL,

  -- Read state
  read          BOOLEAN NOT NULL DEFAULT false,
  read_at       TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at: only read/read_at change, handled by PATCH route
);

-- ── Indexes ───────────────────────────────────────────────────────────────
-- Primary access pattern: fetch unread notifications for a user, newest first
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read = false;

-- All notifications for a user (read history)
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, created_at DESC);

-- ── Row-Level Security ────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications (strict: user_id = auth.uid())
CREATE POLICY "notifications_own_select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications read (PATCH route sets read = true)
CREATE POLICY "notifications_own_update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inserts are performed server-side only via service_role (API route helper)
-- No INSERT policy needed for end users: createNotification() uses server client
