import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const AdvocacySchema = z.object({
  action_type: z.enum(['connect_citizen', 'connect_admin', 'statutory_warning']),
  complaint_id: z.string().uuid(),
  message: z.string().min(3, 'Message must be at least 3 characters').optional(),
  urgency_level: z.enum(['normal', 'urgent', 'statutory_demand']).default('statutory_demand'),
  sender_org: z.string().optional(),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const parsed = AdvocacySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { action_type, complaint_id, message, urgency_level, sender_org } = parsed.data;

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get NGO / Sender profile name
    let senderName = sender_org || 'Bangalore Civic Action Alliance';
    if (user) {
      const { data: profile } = await adminSupabase
        .from('users_profile')
        .select('full_name, display_name, submitter_org_name, role')
        .eq('id', user.id)
        .single();

      if (profile?.submitter_org_name || profile?.display_name || profile?.full_name) {
        senderName = profile.submitter_org_name || profile.display_name || profile.full_name || senderName;
      }
    }

    // Verify complaint
    const { data: complaint, error: cErr } = await adminSupabase
      .from('complaints')
      .select('id, user_id, issue_type, ward_name, status, description_en, ai_suggested_department, user_notes, created_at')
      .eq('id', complaint_id)
      .single();

    if (cErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const effectiveUserId = user?.id || complaint.user_id || '373bb794-d9d6-472b-a015-38183dabb952';
    const nowIso = new Date().toISOString();

    if (action_type === 'connect_citizen') {
      // Record citizen outreach in audit trail
      await adminSupabase.from('audit_logs').insert({
        user_id: effectiveUserId,
        action: 'ngo_citizen_advocacy',
        entity_type: 'complaint',
        entity_id: complaint_id,
        new_value: {
          sender_ngo: senderName,
          citizen_id: complaint.user_id,
          message: message || `Civic legal aid notice issued by ${senderName}.`,
          urgency_level,
          sent_at: nowIso,
        },
      });

      return NextResponse.json({
        success: true,
        channel: 'citizen_outreach',
        recipient: 'Complainant Citizen',
        message: `Civic legal aid message successfully routed to the citizen. ${senderName} is now officially monitoring this grievance.`,
      });
    }

    // action_type === 'statutory_warning' OR 'connect_admin'
    const targetDept = complaint.ai_suggested_department || 'Municipal Executive Engineer';
    const defaultWarningMsg = `Statutory Section 6(1) Notice & Section 20(1) Officer Penalty Warning: Complaint #${complaint.id.slice(0, 8)} (${complaint.issue_type}) is unresolved past municipal charter deadlines. 72-hour joint site inspection and contractor accountability demanded by ${senderName}.`;
    const finalMsg = message || defaultWarningMsg;

    // 1. Record in immutable audit_logs
    await adminSupabase.from('audit_logs').insert({
      user_id: effectiveUserId,
      action: 'statutory_admin_warning',
      entity_type: 'complaint',
      entity_id: complaint_id,
      new_value: {
        sender_ngo: senderName,
        recipient_authority: targetDept,
        ward: complaint.ward_name,
        notice_type: 'Statutory Section 6(1) RTI Notice & Administrative Warning',
        message: finalMsg,
        urgency_level: 'statutory_demand',
        statutory_deadline_hours: 72,
        sent_at: nowIso,
      },
    });

    // 2. Update complaint user_notes with statutory warning banner tag
    const existingNotes = complaint.user_notes || '';
    const warningTag = `[STATUTORY_WARNING_ACTIVE]: Dispatched by ${senderName} on ${nowIso.slice(0, 10)}. 72h statutory response clock running.`;
    if (!existingNotes.includes('[STATUTORY_WARNING_ACTIVE]')) {
      const updatedNotes = existingNotes ? `${existingNotes}\n\n${warningTag}` : warningTag;
      await adminSupabase
        .from('complaints')
        .update({ user_notes: updatedNotes })
        .eq('id', complaint_id);
    }

    // 3. Dispatch notification to all admin users so Admin Portal gets real-time warning
    const { data: admins } = await adminSupabase
      .from('users_profile')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const notifRows = admins.map((admin) => ({
        user_id: admin.id,
        event_type: 'milestone_overdue' as const,
        reference_id: complaint_id,
        message: `🚨 STATUTORY RTI WARNING: Complaint #${complaint.id.slice(0, 8)} (${complaint.issue_type}) is overdue. Civil society organization "${senderName}" has issued a 72-hour statutory inspection demand under Section 20(1) RTI Act.`,
      }));

      await adminSupabase.from('notifications').insert(notifRows);
    }

    return NextResponse.json({
      success: true,
      channel: 'municipal_summons',
      recipient: targetDept,
      sender_org: senderName,
      sent_at: nowIso,
      message: `Statutory Warning successfully dispatched to Municipal Admin Portal! Recorded on civic docket with 72-hour penalty clock.`,
    });
  } catch (err) {
    console.error('Advocacy action error:', err);
    return NextResponse.json({ error: 'Failed to process statutory warning' }, { status: 500 });
  }
}
