// src/app/api/universities/[id]/proposals/route.ts
// POST /api/universities/:id/proposals — Submit a research proposal for an accepted challenge
// GET  /api/universities/:id/proposals — List proposals for this university
//
// Module 1: University Collaboration
//
// A faculty_mentor submits a proposal once their university has accepted the challenge.
// Prerequisite: challenge_routing row for (challenge_id, university_id) must be 'accepted'.
//
// Role gate (POST): faculty_mentor (must belong to this university)
// Role gate (GET):  university_admin | faculty_mentor | student | admin
//
// Rule 7:  try/catch on every async op
// Rule 18: server client
// Rule 21: Zod schema (CreateProposalSchema) is the source of truth

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { CreateProposalSchema } from '@/lib/validators/proposal';
import type { UserRole } from '@/types/user';

// ── POST: submit a new proposal ───────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: universityId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role gate: faculty_mentor or admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile?.role ?? '') as UserRole;
    if (!['faculty_mentor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Only faculty mentors can submit research proposals.' },
        { status: 403 }
      );
    }

    // Rate limit: 5/min (same as routingSuggest — low frequency deliberate action)
    const rl = checkRateLimit(`${user.id}:proposalSubmit`, LIMITS.routingSuggest);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // Validate body
    const body = await request.json();
    // Inject university_id from URL — client cannot override
    const parsed = CreateProposalSchema.safeParse({ ...body, university_id: universityId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { challenge_id, team_members, content, attachment_urls } = parsed.data;

    // Verify prerequisite: routing must be 'accepted' for this (challenge, university) pair
    const { data: routing, error: routingError } = await supabase
      .from('challenge_routing')
      .select('id, status')
      .eq('challenge_id', challenge_id)
      .eq('university_id', universityId)
      .single();

    if (routingError || !routing) {
      return NextResponse.json(
        { error: 'No routing found for this challenge at your university.' },
        { status: 404 }
      );
    }

    if (routing.status !== 'accepted') {
      return NextResponse.json(
        { error: `Your university must accept the challenge before submitting a proposal. Current status: ${routing.status}` },
        { status: 409 }
      );
    }

    // Check no active proposal already exists for this (challenge, university) pair
    const { data: existing } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('challenge_id', challenge_id)
      .eq('university_id', universityId)
      .single();

    if (existing && !['rejected', 'withdrawn'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'A proposal for this challenge already exists. Update the existing proposal instead.' },
        { status: 409 }
      );
    }

    // Insert proposal (status = 'draft' — mentor can save and submit separately)
    const { data: proposal, error: insertError } = await supabase
      .from('proposals')
      .insert({
        challenge_id,
        university_id:     universityId,
        faculty_mentor_id: user.id,
        team_members,
        content,
        attachment_urls,
        status:            'draft',
      })
      .select('id')
      .single();

    if (insertError || !proposal) {
      console.error('proposal insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save proposal. Please try again.' },
        { status: 500 }
      );
    }

    // Update challenge status to team_formed (team is now actively working)
    await supabase
      .from('challenges')
      .update({ status: 'team_formed', status_updated_at: new Date().toISOString() })
      .eq('id', challenge_id);

    // Audit log (Module 4: project_audit_log for proposals)
    await supabase.from('project_audit_log').insert({
      proposal_id:  proposal.id,
      actor_id:     user.id,
      entity_type:  'proposal',
      entity_id:    proposal.id,
      from_status:  null,
      to_status:    'draft',
      note:         'Proposal created by faculty mentor.',
    });

    // Notify challenge submitter
    const { data: challenge } = await supabase
      .from('challenges')
      .select('submitted_by, title')
      .eq('id', challenge_id)
      .single();

    if (challenge) {
      await supabase.from('notifications').insert({
        user_id:      challenge.submitted_by,
        event_type:   'team_formed',
        reference_id: proposal.id,
        message:      `A research team has been formed for your challenge "${challenge.title}". A proposal is being prepared.`,
      });
    }

    return NextResponse.json({ id: proposal.id, status: 'draft' }, { status: 201 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── GET: list proposals for this university ───────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: universityId } = await params;

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

    const role = (profile?.role ?? '') as UserRole;
    const allowed: UserRole[] = ['university_admin', 'faculty_mentor', 'student', 'admin', 'supervisor', 'officer'];
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const { data: proposals, error: fetchError } = await supabase
      .from('proposals')
      .select(`
        id,
        challenge_id,
        faculty_mentor_id,
        team_members,
        content,
        status,
        created_at,
        updated_at,
        challenges (
          id,
          title,
          domain,
          district,
          status
        )
      `)
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('proposals fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to load proposals.' }, { status: 500 });
    }

    return NextResponse.json({ proposals: proposals ?? [] }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
