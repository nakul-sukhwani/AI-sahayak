import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  assigned_to: z.string().uuid('Invalid worker ID'),
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

    const { assigned_to } = parsed.data;

    // Verify worker exists and is actually a worker
    const { data: worker } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', assigned_to)
      .single();
    
    if (!worker || worker.role !== 'worker') {
      return NextResponse.json({ error: 'Invalid worker selected' }, { status: 400 });
    }

    // Update complaint
    const { error: updateError } = await supabase
      .from('complaints')
      .update({
        assigned_to,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        status: 'assigned',
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'filed'); // only unassigned

    if (updateError) {
      return NextResponse.json({ error: 'Failed to assign complaint' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'complaint_assigned',
      entity_type: 'complaint',
      entity_id: id,
      old_value: { status: 'filed' },
      new_value: { status: 'assigned', assigned_to },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
