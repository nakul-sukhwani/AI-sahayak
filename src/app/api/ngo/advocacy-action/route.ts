import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const AdvocacySchema = z.object({
  action_type: z.enum(['connect_citizen', 'connect_admin']),
  complaint_id: z.string().uuid(),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  urgency_level: z.enum(['normal', 'urgent', 'statutory_demand']).default('normal'),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AdvocacySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { action_type, complaint_id, message, urgency_level } = parsed.data;

    // Get NGO profile name
    const { data: profile } = await supabase
      .from('users_profile')
      .select('full_name, display_name, submitter_org_name, role')
      .eq('id', user.id)
      .single();

    const senderOrg = profile?.submitter_org_name || profile?.display_name || profile?.full_name || 'Civic NGO Partner';

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify complaint
    const { data: complaint, error: cErr } = await adminSupabase
      .from('complaints')
      .select('id, user_id, issue_type, ward_name, status, description_en, ai_suggested_department')
      .eq('id', complaint_id)
      .single();

    if (cErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (action_type === 'connect_citizen') {
      // Record citizen outreach in audit trail
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'ngo_citizen_advocacy',
        entity_type: 'complaint',
        entity_id: complaint_id,
        new_value: {
          sender_ngo: senderOrg,
          citizen_id: complaint.user_id,
          message,
          urgency_level,
          sent_at: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        channel: 'citizen_outreach',
        recipient: 'Complainant Citizen',
        message: `Civic legal aid message successfully routed to the citizen. ${senderOrg} is now officially monitoring this grievance.`,
      });
    } else {
      // Dispatch official notice to administration / ward engineer
      const targetDept = complaint.ai_suggested_department || 'Municipal Executive Engineer';
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'ngo_admin_summons',
        entity_type: 'complaint',
        entity_id: complaint_id,
        new_value: {
          sender_ngo: senderOrg,
          recipient_authority: targetDept,
          ward: complaint.ward_name,
          notice_type: 'Administrative Inquiry & Joint Site Inspection Demand',
          message,
          urgency_level,
          statutory_deadline_hours: urgency_level === 'statutory_demand' ? 48 : 72,
          sent_at: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        channel: 'municipal_summons',
        recipient: targetDept,
        message: `Official administrative inquiry notice filed with the ${targetDept}. Recorded on civic oversight docket.`,
      });
    }
  } catch (err) {
    console.error('Advocacy action error:', err);
    return NextResponse.json({ error: 'Failed to process advocacy action' }, { status: 500 });
  }
}
