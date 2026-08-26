import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';

const ComplaintSchema = z.object({
  latitude:              z.number().min(-90).max(90),
  longitude:             z.number().min(-180).max(180),
  address:               z.string().nullable().optional(),
  ward_name:             z.string().nullable().optional(),
  issue_type:            z.string().min(1),
  subcategory:           z.string().nullable().optional(),
  severity:              z.enum(['low', 'medium', 'high', 'critical']),
  description_en:        z.string().min(5, 'Description too short'),
  description_hi:        z.string().nullable().optional(),
  user_notes:            z.string().nullable().optional(),
  ai_confidence:         z.number().min(0).max(1).nullable().optional(),
  ai_tags:               z.array(z.string()).nullable().optional(),
  ai_urgency_reason:     z.string().nullable().optional(),
  ai_suggested_department: z.string().nullable().optional(),
  is_anonymous:          z.boolean().default(false),
  visibility:            z.enum(['private', 'public', 'shared']).default('private'),
  suggested_authority_id: z.number().int().positive().nullable().optional(),
  image_url:             z.string().min(1, 'Image path is required'),
  voice_url:             z.string().nullable().optional(),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role check — only citizens file complaints
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'citizen') {
      return NextResponse.json({ error: 'Only citizens can file complaints.' }, { status: 403 });
    }

    // 3. Rate limit — 3 per minute (DOC5 §3.2)
    const rl = checkRateLimit(`${user.id}:fileComplaint`, LIMITS.fileComplaint);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // 4. Validate body
    const body = await request.json();
    const parsed = ComplaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 5. Insert complaint
    const { data: complaint, error: insertError } = await supabase
      .from('complaints')
      .insert({
        user_id: user.id,
        ...parsed.data,
        status: 'filed',
        status_updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !complaint) {
      return NextResponse.json(
        { error: 'Failed to save complaint. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'complaint_filed',
      entity_type: 'complaint',
      entity_id: complaint.id,
      new_value: { status: 'filed', issue_type: parsed.data.issue_type },
    });

    return NextResponse.json({ id: complaint.id }, { status: 201 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
