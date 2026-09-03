// src/app/api/milestones/[id]/route.ts
// PATCH /api/milestones/:id — Update milestone status or evidence
//
// Module 4: Project Lifecycle Management
//
// Role gate: faculty_mentor (owner) or admin
//
// Rule 7:  try/catch on every async op
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { UpdateMilestoneSchema } from '@/lib/validators/milestone';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: milestoneId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'faculty_mentor' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only faculty mentors can update milestones.' },
        { status: 403 }
      );
    }

    const rl = checkRateLimit(`${user.id}:milestoneUpdate`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    const body = await request.json();
    const parsed = UpdateMilestoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    // Fetch existing to verify ownership and record transition
    const { data: existing, error: fetchError } = await supabase
      .from('project_milestones')
      .select('proposal_id, owner_id, status, title')
      .eq('id', milestoneId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }

    if (profile?.role !== 'admin' && existing.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own milestones.' },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from('project_milestones')
      .update(updates)
      .eq('id', milestoneId);

    if (updateError) {
      console.error('milestone update error:', updateError);
      return NextResponse.json({ error: 'Failed to update milestone.' }, { status: 500 });
    }

    // Audit log if status changed
    if (updates.status && updates.status !== existing.status) {
      await supabase.from('project_audit_log').insert({
        proposal_id: existing.proposal_id,
        actor_id: user.id,
        entity_type: 'milestone',
        entity_id: milestoneId,
        from_status: existing.status,
        to_status: updates.status,
        note: `Milestone "${existing.title}" marked as ${updates.status}`,
      });

      // Notify stakeholders if completed
      if (updates.status === 'completed') {
        const { data: proposal } = await supabase
          .from('proposals')
          .select('challenges ( submitted_by )')
          .eq('id', existing.proposal_id)
          .single();

        const submitterId = proposal?.challenges?.submitted_by;
        if (submitterId) {
          await supabase.from('notifications').insert({
            user_id: submitterId,
            event_type: 'milestone_completed',
            reference_id: milestoneId,
            message: `Milestone "${existing.title}" has been completed.`,
          });
        }
      }
    }

    return NextResponse.json({ message: 'Milestone updated' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
