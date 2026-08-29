import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ReportSchema = z.object({
  work_proof_id: z.string().uuid(),
  damage_type: z.string().min(1),
  worker_issues: z.string().nullable().optional(),
  tools_required: z.array(z.string()).default([]),
  team_members_count: z.number().int().min(1).default(1),
  captured_latitude: z.number().min(-90).max(90),
  captured_longitude: z.number().min(-180).max(180),
  captured_at: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const {
      work_proof_id,
      damage_type,
      worker_issues,
      tools_required,
      team_members_count,
      captured_latitude,
      captured_longitude,
      captured_at,
    } = parsed.data;

    // Verify proof belongs to this worker or user is admin
    const { data: proof, error: proofErr } = await supabase
      .from('work_proof')
      .select('id, worker_id')
      .eq('id', work_proof_id)
      .single();

    if (proofErr || !proof) {
      return NextResponse.json({ error: 'Work proof not found' }, { status: 404 });
    }

    if (proof.worker_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this work proof' }, { status: 403 });
    }

    const { data: report, error: insertError } = await supabase
      .from('worker_job_reports')
      .insert({
        work_proof_id,
        damage_type,
        worker_issues: worker_issues ?? null,
        tools_required,
        team_members_count,
        captured_latitude,
        captured_longitude,
        captured_at: captured_at ?? new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertError || !report) {
      return NextResponse.json({ error: insertError?.message || 'Failed to create job report' }, { status: 500 });
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
