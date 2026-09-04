// src/app/api/challenges/[id]/route-suggestions/route.ts
// POST /api/challenges/:id/route-suggestions
// Module 3: Institution-Based Routing Engine -- pgvector cosine similarity search
//
// Generates ranked university suggestions for a challenge using:
//   1. pgvector cosine similarity (<=> operator) between challenge and expertise embeddings
//   2. Optional PostGIS distance as secondary ranking factor
//
// Human-in-the-loop: returns suggestions for a govt reviewer to confirm (never auto-routes).
// Role gate: supervisor | officer | admin (ROUTING_APPROVER_ROLES)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { generateEmbedding } from '@/lib/embedding';
import { ROUTING_APPROVER_ROLES } from '@/constants/roles';
import type { UserRole } from '@/types/user';
import type { RoutingSuggestion } from '@/lib/validators/university';

const TOP_N = 5;

const RequestSchema = z.object({
  district_filter: z.string().max(100).optional(),
}).strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: challengeId } = await params;

    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role gate -- only routing approvers can trigger suggestions
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const role = profile.role as UserRole;
    if (!ROUTING_APPROVER_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Only government reviewers can generate routing suggestions.' },
        { status: 403 }
      );
    }

    // 3. Rate limit -- 5 per minute
    const rl = checkRateLimit(`${user.id}:routingSuggest`, LIMITS.routingSuggest);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // 4. Validate optional body
    let body: Record<string, unknown> = {};
    try { body = await request.json(); } catch { /* empty body is fine */ }
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // 5. Fetch the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, description, domain, challenge_embedding, district, status')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (!['submitted', 'routed'].includes(challenge.status)) {
      return NextResponse.json(
        { error: 'Routing suggestions can only be generated for submitted or routed challenges.' },
        { status: 409 }
      );
    }

    // 6. Get or generate challenge embedding
    let embedding: number[] = challenge.challenge_embedding ?? [];

    if (embedding.length === 0) {
      const embRl = checkRateLimit(`${user.id}:embedding`, LIMITS.embedding);
      if (!embRl.allowed) {
        return NextResponse.json(
          { error: 'Embedding rate limit reached. Please try again in a minute.' },
          { status: 429 }
        );
      }

      const text = `${challenge.title}\n${challenge.description}\nDomain: ${challenge.domain}`;
      embedding = await generateEmbedding(text, 'RETRIEVAL_QUERY');

      if (embedding.length === 0) {
        return NextResponse.json(
          { error: 'Failed to generate routing embedding. Please try again.' },
          { status: 503 }
        );
      }

      await supabase
        .from('challenges')
        .update({ challenge_embedding: JSON.stringify(embedding) })
        .eq('id', challengeId);
    }

    // 7. pgvector cosine similarity via Supabase RPC
    // Requires: match_university_expertise(query_embedding vector, match_count int, district_filter text)
    // Create this function in: supabase/rls/match_university_expertise.sql
    const districtFilter = parsed.data.district_filter ?? challenge.district ?? null;

    const { data: matches, error: rpcError } = await supabase.rpc(
      'match_university_expertise',
      {
        query_embedding: embedding,
        match_count:     TOP_N,
        district_filter: districtFilter,
      }
    );

    if (rpcError) {
      console.error('match_university_expertise RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Routing engine unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // 8. Shape response
    const suggestions: RoutingSuggestion[] = (matches ?? []).map(
      (
        row: {
          university_id:   string;
          university_name: string;
          district:        string | null;
          similarity:      number;
          distance_km:     number | null;
          matched_domain:  string;
        },
        idx: number
      ) => ({
        university_id:    row.university_id,
        university_name:  row.university_name,
        district:         row.district,
        similarity_score: Math.round(row.similarity * 10000) / 10000,
        distance_km:      row.distance_km ? Math.round(row.distance_km * 10) / 10 : null,
        rank:             idx + 1,
        matched_domain:   row.matched_domain,
      })
    );

    // 9. Upsert routing rows and mark challenge as routed
    if (suggestions.length > 0) {
      const routingRows = suggestions.map((s) => ({
        challenge_id:     challengeId,
        university_id:    s.university_id,
        similarity_score: s.similarity_score,
        distance_km:      s.distance_km,
        rank:             s.rank,
        status:           'suggested',
      }));

      await supabase
        .from('challenge_routing')
        .upsert(routingRows, { onConflict: 'challenge_id,university_id' });

      await supabase
        .from('challenges')
        .update({ status: 'routed', status_updated_at: new Date().toISOString() })
        .eq('id', challengeId);
    }

    // 10. Audit log
    await supabase.from('audit_logs').insert({
      user_id:     user.id,
      action:      'routing_suggestions_generated',
      entity_type: 'challenge',
      entity_id:   challengeId,
      new_value:   { suggestions_count: suggestions.length, district_filter: districtFilter },
    });

    return NextResponse.json({ suggestions }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
