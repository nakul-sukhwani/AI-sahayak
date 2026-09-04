// src/app/api/proposals/[id]/milestones/route.ts
// GET  /api/proposals/:id/milestones — List milestones for a proposal
// POST /api/proposals/:id/milestones — Add a new milestone
//
// Module 4: Project Lifecycle Management
//
// Role gate: faculty_mentor (to POST), university roles + govt roles (to GET)
//
// Rule 7:  try/catch on every async op
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { CreateMilestoneSchema } from '@/lib/validators/milestone';
import type { UserRole } from '@/types/user';

// ── GET: fetch milestones for a proposal ──────────────────────────────────
export async function GET(
  _request: NextRequest,
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

    const role = (profile?.role ?? '') as UserRole;
    // Allow read access to project members, university admin, and govt reviewers
    const allowed = [
      'university_admin', 'faculty_mentor', 'student',
      'supervisor', 'officer', 'admin'
    ];
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const { data: milestones, error: fetchError } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('order_index', { ascending: true });

    if (fetchError) {
      console.error('milestones fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to load milestones.' }, { status: 500 });
    }

    return NextResponse.json({ milestones: milestones ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: add a milestone ───────────────────────────────────────────────
export async function POST(
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
        { error: 'Only faculty mentors can create milestones.' },
        { status: 403 }
      );
    }

    const rl = checkRateLimit(`${user.id}:milestoneCreate`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    const body = await request.json();
    // Inject proposal_id and owner_id securely
    const parsed = CreateMilestoneSchema.safeParse({
      ...body,
      proposal_id: proposalId,
      owner_id: user.id
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, order_index, due_date } = parsed.data;

    // Verify proposal ownership (mentor must own the proposal)
    if (profile?.role !== 'admin') {
      const { data: proposal } = await supabase
        .from('proposals')
        .select('faculty_mentor_id')
        .eq('id', proposalId)
        .single();
      
      if (!proposal || proposal.faculty_mentor_id !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to add milestones to this proposal.' },
          { status: 403 }
        );
      }
    }

    const { data: milestone, error: insertError } = await supabase
      .from('project_milestones')
      .insert({
        proposal_id: proposalId,
        title,
        description,
        order_index,
        owner_id: user.id,
        due_date,
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertError || !milestone) {
      console.error('milestone insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create milestone.' },
        { status: 500 }
      );
    }

    // Audit log
    await supabase.from('project_audit_log').insert({
      proposal_id: proposalId,
      actor_id: user.id,
      entity_type: 'milestone',
      entity_id: milestone.id,
      to_status: 'pending',
      note: `Milestone created: ${title}`,
    });

    return NextResponse.json({ id: milestone.id, status: 'pending' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
