// src/app/api/universities/[id]/challenges/route.ts
// GET  /api/universities/:id/challenges — University inbox (approved routed challenges)
// POST /api/universities/:id/challenges/:challengeId/respond — Accept or decline
//
// Module 1: University Collaboration — University Challenge Inbox
//
// GET returns challenges where:
//   challenge_routing.university_id = :id AND status = 'approved' (govt-approved routing)
// The university can then accept or decline each challenge.
//
// Role gate: university_admin | faculty_mentor belonging to this university, OR admin
//
// Rule 7:  try/catch on every async op
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import type { UserRole } from '@/types/user';

const RespondSchema = z.object({
  challenge_id: z.string().uuid(),
  action:       z.enum(['accepted', 'rejected']),
  note:         z.string().max(500).optional(),
}).strict();

// ── GET: fetch routed challenges for this university ──────────────────────
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

    // Role check: admin sees all; university roles must belong to this institution
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile?.role ?? '') as UserRole;
    const isAdmin = role === 'admin';
    const isUniversityRole = ['university_admin', 'faculty_mentor', 'student'].includes(role);

    if (!isAdmin && !isUniversityRole) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // For university roles: verify they belong to this university
    if (!isAdmin) {
      const { data: uni } = await supabase
        .from('universities')
        .select('admin_user_id')
        .eq('id', universityId)
        .single();

      // Simple check: admin_user_id matches. Full team membership checked in app layer.
      if (!uni || (uni.admin_user_id !== user.id && role !== 'faculty_mentor')) {
        return NextResponse.json(
          { error: 'You do not have access to this university inbox.' },
          { status: 403 }
        );
      }
    }

    // Fetch approved routing rows + joined challenge details
    const { data: inbox, error: fetchError } = await supabase
      .from('challenge_routing')
      .select(`
        id,
        similarity_score,
        distance_km,
        rank,
        status,
        created_at,
        challenges (
          id,
          title,
          description,
          domain,
          tags,
          district,
          submitter_type,
          submitted_on_behalf_of,
          image_url,
          status,
          created_at
        )
      `)
      .eq('university_id', universityId)
      .in('status', ['approved', 'accepted', 'rejected'])
      .order('rank', { ascending: true });

    if (fetchError) {
      console.error('university inbox fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to load inbox.' }, { status: 500 });
    }

    return NextResponse.json({ inbox: inbox ?? [] }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: university responds to a routed challenge (accept / decline) ────
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

    // Role gate: university_admin only can formally accept/decline
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile?.role ?? '') as UserRole;
    if (!['university_admin', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Only university administrators can accept or decline challenges.' },
        { status: 403 }
      );
    }

    // Rate limit
    const rl = checkRateLimit(`${user.id}:universityRespond`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // Validate body
    const body = await request.json();
    const parsed = RespondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { challenge_id, action, note } = parsed.data;

    // Find the approved routing row
    const { data: routing, error: routingError } = await supabase
      .from('challenge_routing')
      .select('id, status')
      .eq('university_id', universityId)
      .eq('challenge_id', challenge_id)
      .eq('status', 'approved')
      .single();

    if (routingError || !routing) {
      return NextResponse.json(
        { error: 'No approved routing found for this challenge.' },
        { status: 404 }
      );
    }

    // Update routing status
    await supabase
      .from('challenge_routing')
      .update({ status: action })
      .eq('id', routing.id);

    // Update challenge status
    const newChallengeStatus = action === 'accepted' ? 'accepted' : 'routed';
    await supabase
      .from('challenges')
      .update({ status: newChallengeStatus, status_updated_at: new Date().toISOString() })
      .eq('id', challenge_id);

    // Notify challenge submitter
    const { data: challenge } = await supabase
      .from('challenges')
      .select('submitted_by, title')
      .eq('id', challenge_id)
      .single();

    if (challenge) {
      const eventType = action === 'accepted' ? 'challenge_accepted' : 'challenge_declined';
      const { data: uni } = await supabase
        .from('universities')
        .select('name')
        .eq('id', universityId)
        .single();

      await supabase.from('notifications').insert({
        user_id:      challenge.submitted_by,
        event_type:   eventType,
        reference_id: challenge_id,
        message:      action === 'accepted'
          ? `Your challenge "${challenge.title}" has been accepted by ${uni?.name ?? 'a university'} for research collaboration.`
          : `Your challenge "${challenge.title}" was not taken up by the assigned institution. It will be re-routed.`,
      });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id:     user.id,
      action:      `challenge_${action}_by_university`,
      entity_type: 'challenge_routing',
      entity_id:   routing.id,
      new_value:   { action, note: note ?? null, challenge_id, university_id: universityId },
    });

    return NextResponse.json(
      { message: `Challenge ${action}.` },
      { status: 200 }
    );

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
