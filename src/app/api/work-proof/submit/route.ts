import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { verifyProof } from '@/lib/gemini';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';

const BodySchema = z.object({
  complaint_id:     z.string().uuid(),
  after_photo_path: z.string().min(1),
  worker_notes:     z.string().nullable().optional(),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Worker/admin only
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['worker', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limit
    const rl = checkRateLimit(`${user.id}:submitProof`, LIMITS.submitProof);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { complaint_id, after_photo_path, worker_notes } = parsed.data;

    // Verify complaint is assigned to this worker
    const { data: complaint } = await supabase
      .from('complaints')
      .select('id, status, assigned_to, image_url')
      .eq('id', complaint_id)
      .single();

    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    if (complaint.assigned_to !== user.id) return NextResponse.json({ error: 'Not assigned to you' }, { status: 403 });
    if (!['assigned', 'in_progress'].includes(complaint.status)) {
      return NextResponse.json({ error: 'Complaint is not in a state that accepts proof' }, { status: 409 });
    }

    // Generate signed URLs for AI verification
    const { data: beforeSigned } = await supabase.storage
      .from('complaints')
      .createSignedUrl(complaint.image_url, 3600);

    const { data: afterSigned } = await supabase.storage
      .from('complaints')
      .createSignedUrl(after_photo_path, 3600);

    // Run AI verification (non-blocking to response, stored in DB)
    let aiResult = null;
    if (beforeSigned?.signedUrl && afterSigned?.signedUrl) {
      aiResult = await verifyProof(beforeSigned.signedUrl, afterSigned.signedUrl);
    }

    // Insert work_proof row
    const { data: proof, error: insertError } = await supabase
      .from('work_proof')
      .insert({
        complaint_id,
        worker_id: user.id,
        before_photo_url: complaint.image_url,
        after_photo_url: after_photo_path,
        worker_notes: worker_notes ?? null,
        submitted_at: new Date().toISOString(),
        ai_verified: aiResult?.issue_resolved ?? null,
        ai_confidence: aiResult?.confidence ?? null,
        ai_observation: aiResult?.observation ?? null,
        ai_remaining_issues: aiResult?.remaining_issues ?? null,
        ai_new_issues: aiResult?.new_issues ?? null,
        ai_analyzed_at: aiResult ? new Date().toISOString() : null,
        status: 'ai_verified',
      })
      .select('id')
      .single();

    if (insertError || !proof) {
      return NextResponse.json({ error: 'Failed to submit proof' }, { status: 500 });
    }

    // Update complaint status to proof_submitted
    await supabase
      .from('complaints')
      .update({ status: 'proof_submitted', status_updated_at: new Date().toISOString() })
      .eq('id', complaint_id);

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'proof_submitted',
      entity_type: 'work_proof',
      entity_id: proof.id,
      new_value: { complaint_id, ai_verified: aiResult?.issue_resolved },
    });

    return NextResponse.json({ id: proof.id, aiResult }, { status: 201 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
