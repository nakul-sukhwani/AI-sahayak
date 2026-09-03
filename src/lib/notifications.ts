// src/lib/notifications.ts
// Module 6: Notification & Communication
// Helper for server-side endpoints to emit notifications

import { createClient } from '@/lib/supabase/server';
import type { CreateNotificationInput } from '@/lib/validators/notification';

/**
 * Creates a notification for a user.
 * Call this from server actions or API routes.
 */
export async function createNotification(input: CreateNotificationInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id:      input.user_id,
      event_type:   input.event_type,
      reference_id: input.reference_id,
      message:      input.message,
    });

  if (error) {
    console.error('Failed to create notification:', error);
  }
}
