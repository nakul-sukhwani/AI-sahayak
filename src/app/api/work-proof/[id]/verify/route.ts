import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().nullable().optional(),
}).strict();

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['supervisor', 'admin', 'officer'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { status, rejection_reason } = parsed.data;

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Get the proof to find the associated complaint
    const { data: proof } = await supabase
      .from('work_proof')
      .select('complaint_id, status')
      .eq('id', id)
      .single();

    if (!proof) {
      return NextResponse.json({ error: 'Work proof not found' }, { status: 404 });
    }

    if (['approved', 'rejected'].includes(proof.status)) {
      return NextResponse.json({ error: `Proof is already ${proof.status}` }, { status: 409 });
    }

    // Update proof
    const { error: proofError } = await supabase
      .from('work_proof')
      .update({
        status,
        rejection_reason,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (proofError) {
      return NextResponse.json({ error: 'Failed to update work proof' }, { status: 500 });
    }

    // Update complaint status
    const complaintStatus = status === 'approved' ? 'resolved' : 'in_progress';
    
    await supabase
      .from('complaints')
      .update({
        status: complaintStatus,
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', proof.complaint_id);

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `proof_${status}`,
      entity_type: 'work_proof',
      entity_id: id,
      new_value: { status, rejection_reason, complaint_status: complaintStatus },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
