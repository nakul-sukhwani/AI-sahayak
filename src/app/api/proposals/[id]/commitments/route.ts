// src/app/api/proposals/[id]/commitments/route.ts
// POST /api/proposals/:id/commitments — Pledge an industry commitment to a proposal
// GET  /api/proposals/:id/commitments — List commitments for a proposal
//
// Module 2: Industry Partnership
//
// Role gate: industry_partner (to POST), project stakeholders (to GET)
//
// Rule 7:  try/catch on every async op
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { CreateCommitmentSchema } from '@/lib/validators/industry';
import type { UserRole } from '@/types/user';

// ── GET: fetch commitments for a proposal ─────────────────────────────────
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
    if (!role) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const { data: commitments, error: fetchError } = await supabase
      .from('industry_commitments')
      .select(`
        id,
        commitment_type,
        mentorship_hours,
        funding_inr,
        in_kind_description,
        status,
        created_at,
        industry_partners ( id, org_name, partner_type )
      `)
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('commitments fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to load commitments.' }, { status: 500 });
    }

    return NextResponse.json({ commitments: commitments ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST: add an industry commitment ──────────────────────────────────────
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

    if (profile?.role !== 'industry_partner' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only industry partners can pledge commitments.' },
        { status: 403 }
      );
    }

    const rl = checkRateLimit(`${user.id}:commitmentCreate`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    const body = await request.json();
    const parsed = CreateCommitmentSchema.safeParse({ ...body, proposal_id: proposalId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { commitment_type, mentorship_hours, funding_inr, in_kind_description } = parsed.data;

    // Fetch the industry_partner ID for this user
    let partnerId = body.industry_partner_id; // Admins might pass it
    
    if (profile?.role !== 'admin') {
      const { data: partner } = await supabase
        .from('industry_partners')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();
        
      if (!partner) {
        return NextResponse.json(
          { error: 'You are not associated with any industry partner profile.' },
          { status: 400 }
        );
      }
      partnerId = partner.id;
    }

    // Insert commitment
    const { data: commitment, error: insertError } = await supabase
      .from('industry_commitments')
      .insert({
        proposal_id:         proposalId,
        industry_partner_id: partnerId,
        commitment_type,
        mentorship_hours:    mentorship_hours ?? null,
        funding_inr:         funding_inr ?? null,
        in_kind_description: in_kind_description ?? null,
        status:              'committed', // Start as formally committed
      })
      .select('id')
      .single();

    if (insertError || !commitment) {
      console.error('commitment insert error:', insertError);
      return NextResponse.json({ error: 'Failed to record commitment.' }, { status: 500 });
    }

    // Audit log
    await supabase.from('project_audit_log').insert({
      proposal_id: proposalId,
      actor_id:    user.id,
      entity_type: 'commitment',
      entity_id:   commitment.id,
      to_status:   'committed',
      note:        `New ${commitment_type} commitment pledged.`,
    });

    // Notify faculty mentor
    const { data: proposal } = await supabase
      .from('proposals')
      .select('faculty_mentor_id, challenges ( title )')
      .eq('id', proposalId)
      .single();

    if (proposal) {
      await supabase.from('notifications').insert({
        user_id:      proposal.faculty_mentor_id,
        event_type:   'industry_committed',
        reference_id: commitment.id,
        message:      `An industry partner has pledged a ${commitment_type} commitment to your project "${proposal.challenges?.title}".`,
      });
    }

    return NextResponse.json({ id: commitment.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
