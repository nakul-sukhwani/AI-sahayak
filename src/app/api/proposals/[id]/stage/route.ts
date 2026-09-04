// src/app/api/proposals/[id]/stage/route.ts
// PATCH /api/proposals/:id/stage — State machine transition for a proposal
//
// Module 4: Project Lifecycle Management
//
// Role gate: faculty_mentor (owner) or admin
//
// Rule 7:  try/catch on every async op
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { ProposalStatusSchema } from '@/lib/validators/proposal';
import type { ChallengeStatus } from '@/lib/validators/challenge';

const StageUpdateSchema = z.object({
  status: ProposalStatusSchema,
  note: z.string().max(500).optional(),
}).strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: proposalId } = await params;

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
        { error: 'Only faculty mentors can update the proposal stage.' },
        { status: 403 }
      );
    }

    const rl = checkRateLimit(`${user.id}:proposalStage`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    const body = await request.json();
    const parsed = StageUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status: newStatus, note } = parsed.data;

    // Fetch existing
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('status, challenge_id, faculty_mentor_id')
      .eq('id', proposalId)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found.' }, { status: 404 });
    }

    if (profile?.role !== 'admin' && proposal.faculty_mentor_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only manage your own proposals.' },
        { status: 403 }
      );
    }

    if (proposal.status === newStatus) {
      return NextResponse.json({ message: 'No change' }, { status: 200 });
    }

    // Determine corresponding challenge status (synchronised lifecycle)
    let challengeStatus: ChallengeStatus | null = null;
    if (newStatus === 'approved') challengeStatus = 'in_progress';
    if (newStatus === 'withdrawn') challengeStatus = 'stalled';

    // Transactional-ish updates
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', proposalId);

    if (updateError) {
      console.error('proposal update error:', updateError);
      return NextResponse.json({ error: 'Failed to update proposal stage.' }, { status: 500 });
    }

    if (challengeStatus) {
      await supabase
        .from('challenges')
        .update({ status: challengeStatus, status_updated_at: new Date().toISOString() })
        .eq('id', proposal.challenge_id);
    }

    // Audit log
    await supabase.from('project_audit_log').insert({
      proposal_id: proposalId,
      actor_id: user.id,
      entity_type: 'proposal',
      entity_id: proposalId,
      from_status: proposal.status,
      to_status: newStatus,
      note: note || `Proposal moved to ${newStatus}`,
    });

    // Notify submitter of major stage transitions
    if (newStatus === 'approved' || newStatus === 'rejected') {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('submitted_by, title')
        .eq('id', proposal.challenge_id)
        .single();
        
      if (challenge) {
        await supabase.from('notifications').insert({
          user_id: challenge.submitted_by,
          event_type: 'stage_transition',
          reference_id: proposalId,
          message: newStatus === 'approved' 
            ? `The research proposal for "${challenge.title}" has been formally approved. Prototype development begins.`
            : `The project for "${challenge.title}" has been completed and marked ready for deployment!`,
        });
      }
    }

    return NextResponse.json({ message: 'Stage updated' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
