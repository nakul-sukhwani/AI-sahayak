// src/app/api/challenges/route.ts
// POST /api/challenges — Submit a societal innovation challenge
// Module 7 (Extended Submitter Base) + Module 3 (Routing Engine — embedding generation)
//
// Rule 8:  Follows exact pattern from /api/complaints/route.ts
// Rule 7:  try/catch on every async op
// Rule 18: Uses supabase/server.ts (server component)
// Doc5 §1.3: Role checked server-side, never trusted from client

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { generateEmbedding } from '@/lib/embedding';
import { CreateChallengeSchema } from '@/lib/validators/challenge';
import { SUBMITTER_ROLES } from '@/constants/roles';
import type { UserRole } from '@/types/user';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check (Rule 18: server client in route.ts)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role check — only submitter roles can post challenges (Doc5 §1.3)
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('role, submitter_org_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const role = profile.role as UserRole;
    if (!SUBMITTER_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Only citizens, community organisations, PRI/ULB officials, and admins can submit challenges.' },
        { status: 403 }
      );
    }

    // 3. Rate limit — 3 per minute (matches fileComplaint limit, Doc5 §3.2)
    const rl = checkRateLimit(`${user.id}:challengeSubmit`, LIMITS.challengeSubmit);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // 4. Validate body (Rule 7: Zod on every POST)
    const body = await request.json();
    const parsed = CreateChallengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      title, description, domain, tags,
      submitter_type, submitted_on_behalf_of,
      district, address, latitude, longitude,
      image_url, voice_url, document_urls,
    } = parsed.data;

    // 5. Build PostGIS geography string if lat/lng provided
    // Supabase PostGIS accepts WKT strings: 'SRID=4326;POINT(lng lat)'
    const locationWkt = (latitude !== undefined && longitude !== undefined)
      ? `SRID=4326;POINT(${longitude} ${latitude})`
      : null;

    // 6. Insert challenge (embedding generated asynchronously after insert)
    const { data: challenge, error: insertError } = await supabase
      .from('challenges')
      .insert({
        submitted_by:           user.id,
        submitter_type,
        submitted_on_behalf_of: submitted_on_behalf_of ?? null,
        title,
        description,
        domain,
        tags,
        location:               locationWkt,
        district:               district ?? null,
        address:                address ?? null,
        image_url:              image_url ?? null,
        voice_url:              voice_url ?? null,
        document_urls,
        status:                 'submitted',
        status_updated_at:      new Date().toISOString(),
        // challenge_embedding intentionally omitted — set in step 8
      })
      .select('id')
      .single();

    if (insertError || !challenge) {
      console.error('challenge insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save challenge. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Generate embedding (fire-and-forget: store result, don't block response)
    // Rate-limited separately via LIMITS.embedding
    const embeddingRl = checkRateLimit(`${user.id}:embedding`, LIMITS.embedding);
    if (embeddingRl.allowed) {
      // Await embedding but don't fail the request if it errors — DB stores NULL
      const embeddingText = `${title}\n${description}\nDomain: ${domain}`;
      const embedding = await generateEmbedding(embeddingText, 'RETRIEVAL_DOCUMENT');

      if (embedding.length > 0) {
        // Update in background — ignore error (embedding can be regenerated later)
        await supabase
          .from('challenges')
          .update({ challenge_embedding: JSON.stringify(embedding) })
          .eq('id', challenge.id);
      }
    }

    // 8. Audit log (matches complaints pattern from Doc4 Phase 16)
    await supabase.from('audit_logs').insert({
      user_id:     user.id,
      action:      'challenge_submitted',
      entity_type: 'challenge',
      entity_id:   challenge.id,
      new_value:   { status: 'submitted', domain, submitter_type },
    });

    return NextResponse.json({ id: challenge.id }, { status: 201 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
