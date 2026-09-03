// src/app/api/universities/route.ts
// POST /api/universities — Onboard a university onto the platform
// Module 1 (University Collaboration) + Module 3 (Routing Engine)
//
// At onboarding time:
//   1. Creates the universities row
//   2. For every discipline provided, creates a university_expertise row
//   3. Generates a RETRIEVAL_DOCUMENT embedding for each expertise row
//
// Role gate: admin only (platform-admin onboards institutions)
//
// Rule 7:  try/catch on every async op
// Rule 8:  Matches exact pattern from /api/complaints/route.ts
// Rule 18: server client in route handler

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import {
  generateEmbedding,
  buildExpertiseText,
} from '@/lib/embedding';
import {
  CreateUniversitySchema,
  CreateExpertiseSchema,
  type CreateExpertiseInput,
} from '@/lib/validators/university';
import { z } from 'zod';

// Combined onboarding schema:
// The caller provides university fields + an array of expertise entries.
const OnboardUniversitySchema = CreateUniversitySchema.extend({
  expertise: z.array(
    CreateExpertiseSchema.omit({ university_id: true })  // university_id injected server-side
  ).min(1, 'At least one expertise entry is required').max(30),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role gate — admin only
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only platform administrators can onboard universities.' },
        { status: 403 }
      );
    }

    // 3. Rate limit (use default: onboarding is low-frequency admin action)
    const rl = checkRateLimit(`${user.id}:universityOnboard`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // 4. Validate body
    const body = await request.json();
    const parsed = OnboardUniversitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      name, short_name, district, state, address,
      latitude, longitude,
      disciplines, incubation_facilities, innovation_cell,
      website_url, admin_user_id,
      expertise,
    } = parsed.data;

    // 5. Build PostGIS WKT if coordinates provided
    const locationWkt = (latitude !== undefined && longitude !== undefined)
      ? `SRID=4326;POINT(${longitude} ${latitude})`
      : null;

    // 6. Insert university row
    const { data: university, error: uniError } = await supabase
      .from('universities')
      .insert({
        name,
        short_name:            short_name ?? null,
        district:              district ?? null,
        state,
        address:               address ?? null,
        location:              locationWkt,
        disciplines,
        incubation_facilities: incubation_facilities ?? null,
        innovation_cell,
        website_url:           website_url ?? null,
        admin_user_id:         admin_user_id ?? null,
      })
      .select('id, name')
      .single();

    if (uniError || !university) {
      console.error('university insert error:', uniError);
      return NextResponse.json(
        { error: 'Failed to onboard university. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Generate embeddings + insert expertise rows
    // Process sequentially (not parallel) to avoid hitting Gemini rate limits
    const expertiseResults: Array<{ domain: string; embedded: boolean }> = [];

    for (const entry of expertise) {
      const expertiseText = buildExpertiseText(entry.domain, entry.description);

      // Rate-limit check per embedding call
      const embRl = checkRateLimit(`${user.id}:embedding`, LIMITS.embedding);
      const embedding = embRl.allowed
        ? await generateEmbedding(expertiseText, 'RETRIEVAL_DOCUMENT')
        : [];

      const row: CreateExpertiseInput & { university_id: string; expertise_embedding?: string } = {
        university_id: university.id,
        domain:        entry.domain,
        description:   entry.description,
      };

      // Store embedding as JSON string — Supabase expects vector input as array
      if (embedding.length > 0) {
        row.expertise_embedding = JSON.stringify(embedding);
      }

      const { error: expertiseError } = await supabase
        .from('university_expertise')
        .insert(row);

      if (expertiseError) {
        console.error(`expertise insert error (${entry.domain}):`, expertiseError);
        // Don't abort — continue with remaining expertise entries
      }

      expertiseResults.push({
        domain:   entry.domain,
        embedded: embedding.length > 0,
      });
    }

    // 8. Update admin_user_id role to university_admin if provided
    if (admin_user_id) {
      await supabase
        .from('users_profile')
        .update({ role: 'university_admin' })
        .eq('id', admin_user_id);
    }

    // 9. Audit log
    await supabase.from('audit_logs').insert({
      user_id:     user.id,
      action:      'university_onboarded',
      entity_type: 'university',
      entity_id:   university.id,
      new_value:   {
        name:              university.name,
        expertise_domains: expertiseResults.map((e) => e.domain),
        all_embedded:      expertiseResults.every((e) => e.embedded),
      },
    });

    return NextResponse.json(
      {
        id:        university.id,
        name:      university.name,
        expertise: expertiseResults,
      },
      { status: 201 }
    );

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
