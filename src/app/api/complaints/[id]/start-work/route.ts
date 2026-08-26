import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Props): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Must be a worker
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['worker', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify complaint is assigned to this worker and in 'assigned' status
    const { data: complaint } = await supabase
      .from('complaints')
      .select('id, status, assigned_to')
      .eq('id', id)
      .single();

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (complaint.assigned_to !== user.id) {
      return NextResponse.json({ error: 'This task is not assigned to you' }, { status: 403 });
    }

    if (complaint.status !== 'assigned') {
      return NextResponse.json(
        { error: `Cannot start work — complaint is already "${complaint.status}"` },
        { status: 409 }
      );
    }

    // Update status to in_progress
    const { error: updateError } = await supabase
      .from('complaints')
      .update({ status: 'in_progress', status_updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'work_started',
      entity_type: 'complaint',
      entity_id: id,
      old_value: { status: 'assigned' },
      new_value: { status: 'in_progress' },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
