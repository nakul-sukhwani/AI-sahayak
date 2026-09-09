import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const GroundAuditSchema = z.object({
  complaint_id: z.string().uuid(),
  audit_verdict: z.enum(['verified_solid', 'flagged_substandard', 'fake_completion']),
  quality_rating: z.number().int().min(1).max(5),
  notes: z.string().min(5, 'Inspection notes must be at least 5 characters').max(1000),
  debris_cleared: z.boolean().default(true),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check
    const { data: profile } = await supabase
      .from('users_profile')
      .select('full_name, display_name, submitter_org_name, role')
      .eq('id', user.id)
      .single();

    if (!profile || !['community_org', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Only registered community organizations and admins can submit ground audits.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = GroundAuditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid audit parameters' },
        { status: 400 }
      );
    }

    const { complaint_id, audit_verdict, quality_rating, notes, debris_cleared } = parsed.data;
    const orgName = profile.submitter_org_name || profile.display_name || profile.full_name || 'Community Organization';

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify complaint exists
    const { data: complaint, error: cErr } = await adminSupabase
      .from('complaints')
      .select('id, status, issue_type')
      .eq('id', complaint_id)
      .single();

    if (cErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Record in immutable audit_logs
    await adminSupabase.from('audit_logs').insert({
      complaint_id,
      user_id: user.id,
      action: 'community_ground_audit',
      details: {
        audit_verdict,
        quality_rating,
        debris_cleared,
        notes,
        audited_by_org: orgName,
        timestamp: new Date().toISOString(),
      },
    });

    // If flagged as fake or substandard, notify supervisor and flag the proof
    if (audit_verdict !== 'verified_solid') {
      try {
        await adminSupabase
          .from('work_proof')
          .update({
            ai_observation: `COMMUNITY AUDIT ALERT (${orgName}): ${notes} [Quality Rating: ${quality_rating}/5]`,
          })
          .eq('complaint_id', complaint_id);
      } catch {
        // Non-fatal if work_proof table column differs
      }
    }

    return NextResponse.json({
      success: true,
      message:
        audit_verdict === 'verified_solid'
          ? 'Independent community audit submitted: Work verified as solid!'
          : 'Independent community audit submitted: Substandard work flagged for municipal re-inspection!',
      audit_verdict,
      quality_rating,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error submitting ground audit' },
      { status: 500 }
    );
  }
}
