// src/app/api/proposals/[id]/audit-log/route.ts
// GET /api/proposals/:id/audit-log — Fetch project lifecycle audit trail
//
// Module 4: Project Lifecycle Management
//
// Returns a chronological timeline of stage transitions, milestone updates,
// and industry commitments for the given proposal.
//
// Role gate: Any authenticated project stakeholder (submitter, mentor, admin, govt)
//
// Rule 7:  try/catch on every async op
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import type { UserRole } from '@/types/user';

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

    // Role check: must be logged in and part of the system
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile?.role ?? '') as UserRole;
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 403 });
    }

    const rl = checkRateLimit(`${user.id}:auditLog`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // Fetch audit logs with actor profile details joined
    const { data: logs, error: fetchError } = await supabase
      .from('project_audit_log')
      .select(`
        id,
        entity_type,
        entity_id,
        from_status,
        to_status,
        note,
        created_at,
        actor:users_profile(name, role)
      `)
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('audit log fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to load audit trail.' }, { status: 500 });
    }

    // Format the response slightly to flatten the joined actor object
    const formattedLogs = (logs ?? []).map((log: any) => ({
      id: log.id,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      from_status: log.from_status,
      to_status: log.to_status,
      note: log.note,
      created_at: log.created_at,
      actor_name: log.actor?.name ?? 'System',
      actor_role: log.actor?.role ?? 'system',
    }));

    return NextResponse.json({ audit_trail: formattedLogs }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
