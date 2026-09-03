// src/lib/validators/notification.ts
// Rule 21: Zod schemas are the source of truth.
// Used by: GET /api/notifications, PATCH /api/notifications/:id/read

import { z } from 'zod';

export const NotificationEventTypeSchema = z.enum([
  // Module 3: routing
  'routing_suggested',
  'routing_approved',
  'routing_declined',
  // Module 1: university collaboration
  'challenge_accepted',
  'challenge_declined',
  'team_formed',
  'proposal_submitted',
  // Module 4: lifecycle
  'stage_transition',
  'milestone_due_soon',
  'milestone_overdue',
  'milestone_completed',
  // Module 2: industry
  'industry_interest',
  'industry_committed',
  'industry_withdrawn',
  // General
  'govt_approval',
  'govt_rejection',
]);

export type NotificationEventType = z.infer<typeof NotificationEventTypeSchema>;

export interface Notification {
  id:           string;
  user_id:      string;
  event_type:   NotificationEventType;
  reference_id: string | null;
  message:      string;
  read:         boolean;
  read_at:      string | null;
  created_at:   string;
}

// Server-side helper input (not a request schema — called internally)
export interface CreateNotificationInput {
  user_id:      string;
  event_type:   NotificationEventType;
  reference_id: string | null;
  message:      string;
}
