// src/app/api/routing/[id]/approve/route.ts
// POST /api/routing/:id/approve
// Module 3: Human-in-the-loop routing approval gate
//
// A govt reviewer approves OR declines a specific challenge_routing row.
// Approved routing: notifies university_admin, marks challenge.status = 'routed'.
// Declined routing: no notification sent; reviewer can re-run route-suggestions.
//
// Rule 7:  try/catch on every async op
// Rule 8:  Matches complaints/route.ts pattern
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { ROUTING_APPROVER_ROLES } from '@/constants/roles';
import type { UserRole } from '@/types/user';

const ApproveSchema = z.object({
  action: z.enum(['approved', 'declined']),
  note:   z.string().max(500).optional(),
}).strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: routingId } = await params;

    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role gate -- only routing approvers
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const role = profile.role as UserRole;
    if (!ROUTING_APPROVER_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Only government reviewers can approve or decline routing suggestions.' },
        { status: 403 }
      );
    }

    // 3. Rate limit (use default: 30/min -- approval is low frequency)
    const rl = checkRateLimit(`${user.id}:routingApprove`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // 4. Validate body
    const body = await request.json();
    const parsed = ApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, note } = parsed.data;

    // 5. Fetch the routing row -- must be in 'suggested' state to act on
    const { data: routing, error: fetchError } = await supabase
      .from('challenge_routing')
      .select('id, challenge_id, university_id, status')
      .eq('id', routingId)
      .single();

    if (fetchError || !routing) {
      return NextResponse.json({ error: 'Routing suggestion not found' }, { status: 404 });
    }

    if (routing.status !== 'suggested') {
      return NextResponse.json(
        { error: `Cannot act on a routing suggestion with status: ${routing.status}` },
        { status: 409 }
      );
    }

    // 6. Update routing row
    const { error: updateError } = await supabase
      .from('challenge_routing')
      .update({
        status:       action,
        reviewed_by:  user.id,
        reviewed_at:  new Date().toISOString(),
      })
      .eq('id', routingId);

    if (updateError) {
      console.error('routing update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update routing suggestion. Please try again.' },
        { status: 500 }
      );
    }

    // 7. On approval: notify university_admin of their institution
    if (action === 'approved') {
      // Find the university admin
      const { data: university } = await supabase
        .from('universities')
        .select('id, name, admin_user_id')
        .eq('id', routing.university_id)
        .single();

      if (university?.admin_user_id) {
        await supabase.from('notifications').insert({
          user_id:      university.admin_user_id,
          event_type:   'routing_approved',
          reference_id: routing.challenge_id,
          message:      `A new societal challenge has been routed to ${university.name} for review. Please check your challenge inbox.`,
        });
      }
    }

    // 8. Audit log
    await supabase.from('audit_logs').insert({
      user_id:     user.id,
      action:      `routing_${action}`,
      entity_type: 'challenge_routing',
      entity_id:   routingId,
      new_value:   { action, note: note ?? null, challenge_id: routing.challenge_id },
    });

    return NextResponse.json(
      { message: `Routing suggestion ${action}.`, routing_id: routingId },
      { status: 200 }
    );

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
