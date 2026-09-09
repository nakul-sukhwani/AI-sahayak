import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { rankWorkersForDispatch, type WorkerCandidate } from '@/lib/dispatch-agent';

const DispatchRequestSchema = z.object({
  complaint_id: z.string().uuid(),
  auto_assign: z.boolean().optional().default(false),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check — only admin, officer, or supervisor can trigger smart dispatch
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'officer', 'supervisor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = DispatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { complaint_id, auto_assign } = parsed.data;

    // Use admin client to bypass RLS for aggregate dispatch queries
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch complaint
    const { data: complaint, error: complaintError } = await adminSupabase
      .from('complaints')
      .select('id, issue_type, severity, ward_name, ai_suggested_department, status')
      .eq('id', complaint_id)
      .single();

    if (complaintError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // 2. Fetch all registered workers
    const { data: workerProfiles, error: workerError } = await adminSupabase
      .from('users_profile')
      .select('id, full_name, display_name, ward_name')
      .eq('role', 'worker');

    if (workerError || !workerProfiles || workerProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        evaluations: [],
        message: 'No registered workers available in system.',
      });
    }

    // 3. Fetch workers table metadata (department, area_name)
    const workerIds = workerProfiles.map((w) => w.id);
    const { data: workerMeta } = await adminSupabase
      .from('workers')
      .select('user_id, department, area_name, max_concurrent_tasks, is_available')
      .in('user_id', workerIds);

    const metaMap = new Map((workerMeta || []).map((m) => [m.user_id, m]));

    // 4. Fetch active task counts per worker
    const { data: activeAssignments } = await adminSupabase
      .from('complaints')
      .select('assigned_to')
      .in('assigned_to', workerIds)
      .in('status', ['assigned', 'in_progress', 'proof_submitted']);

    const taskCountMap = new Map<string, number>();
    for (const a of activeAssignments || []) {
      if (a.assigned_to) {
        taskCountMap.set(a.assigned_to, (taskCountMap.get(a.assigned_to) || 0) + 1);
      }
    }

    // 5. Construct candidate models
    const candidates: WorkerCandidate[] = workerProfiles.map((wp) => {
      const meta = metaMap.get(wp.id);
      return {
        id: wp.id,
        name: wp.display_name || wp.full_name || `Worker #${wp.id.slice(0, 6)}`,
        department: meta?.department || null,
        area_name: meta?.area_name || wp.ward_name || null,
        active_tasks_count: taskCountMap.get(wp.id) || 0,
        max_concurrent_tasks: meta?.max_concurrent_tasks || 3,
        is_available: meta?.is_available !== false,
      };
    });

    // 6. Execute autonomous dispatch evaluation
    const evaluations = rankWorkersForDispatch(
      {
        id: complaint.id,
        issue_type: complaint.issue_type,
        severity: complaint.severity,
        ward_name: complaint.ward_name,
        ai_suggested_department: complaint.ai_suggested_department,
      },
      candidates
    );

    let autoAssignedWorker = null;

    // 7. If auto_assign was requested and a top candidate exists
    if (auto_assign && evaluations.length > 0) {
      const topPick = evaluations[0];
      const { error: updateError } = await adminSupabase
        .from('complaints')
        .update({
          assigned_to: topPick.worker_id,
          assigned_by: user.id,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
        })
        .eq('id', complaint.id);

      if (!updateError) {
        autoAssignedWorker = topPick;
      }
    }

    return NextResponse.json({
      success: true,
      evaluations,
      recommended_worker: evaluations[0] || null,
      auto_assigned: !!autoAssignedWorker,
      assigned_worker: autoAssignedWorker,
    });
  } catch (err) {
    console.error('Auto-dispatch route error:', err);
    return NextResponse.json(
      { error: 'Failed to compute dispatch recommendations' },
      { status: 500 }
    );
  }
}
