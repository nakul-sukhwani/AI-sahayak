import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const AdoptIssueSchema = z.object({
  complaint_id: z.string().uuid(),
  estimated_budget_inr: z.number().int().min(500).max(500000),
  sponsor_name: z.string().min(3).max(100),
  adoption_type: z.enum(['csr_grant', 'community_crowdfund', 'rwa_volunteer_crew']),
  notes: z.string().min(5).max(1000),
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
        { error: 'Only community organizations and admins can adopt issues for CSR/community repair.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = AdoptIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { complaint_id, estimated_budget_inr, sponsor_name, adoption_type, notes } = parsed.data;
    const orgName = profile.submitter_org_name || profile.display_name || profile.full_name || 'Civic NGO';

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify complaint
    const { data: complaint, error: cErr } = await adminSupabase
      .from('complaints')
      .select('id, issue_type, ward_name, status')
      .eq('id', complaint_id)
      .single();

    if (cErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Record in audit_logs
    await adminSupabase.from('audit_logs').insert({
      complaint_id,
      user_id: user.id,
      action: 'community_csr_adoption',
      details: {
        adopting_org: orgName,
        sponsor_name,
        estimated_budget_inr,
        adoption_type,
        notes,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Issue adopted successfully by ${orgName}! ₹${estimated_budget_inr.toLocaleString('en-IN')} allocated via ${sponsor_name}.`,
      complaint_id,
      estimated_budget_inr,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error adopting issue' },
      { status: 500 }
    );
  }
}
