// src/app/api/industry-partners/route.ts
// POST /api/industry-partners — Onboard an industry partner
// Module 2: Industry Partnership
//
// Generates a RETRIEVAL_DOCUMENT embedding for the partner based on their
// sectors and engagement_types, which allows proposals to semantically
// match with them later.
//
// Role gate: admin (or the partner themselves during signup if they have the role)
//
// Rule 7:  try/catch on every async op
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { generateEmbedding, buildCapabilityText } from '@/lib/embedding';
import { CreateIndustryPartnerSchema } from '@/lib/validators/industry';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role gate
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    // Allow admins to onboard anyone, or allow an industry_partner to onboard themselves
    if (profile?.role !== 'admin' && profile?.role !== 'industry_partner') {
      return NextResponse.json(
        { error: 'Access denied.' },
        { status: 403 }
      );
    }

    // 3. Rate limit
    const rl = checkRateLimit(`${user.id}:industryOnboard`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // 4. Validate body
    const body = await request.json();
    const parsed = CreateIndustryPartnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      org_name,
      partner_type,
      website_url,
      sectors,
      engagement_types,
      mentorship_hours_per_month,
      max_concurrent_engagements,
    } = parsed.data;

    // 5. Generate embedding (RETRIEVAL_DOCUMENT)
    const capabilityText = buildCapabilityText(sectors, engagement_types, org_name);
    
    const embRl = checkRateLimit(`${user.id}:embedding`, LIMITS.embedding);
    let embedding: number[] = [];
    if (embRl.allowed) {
      embedding = await generateEmbedding(capabilityText, 'RETRIEVAL_DOCUMENT');
    }

    // 6. Insert industry partner
    const { data: partner, error: insertError } = await supabase
      .from('industry_partners')
      .insert({
        org_name,
        partner_type,
        website_url:                website_url ?? null,
        sectors,
        engagement_types,
        mentorship_hours_per_month: mentorship_hours_per_month ?? null,
        max_concurrent_engagements,
        capability_embedding:       embedding.length > 0 ? JSON.stringify(embedding) : null,
        owner_user_id:              profile.role === 'industry_partner' ? user.id : null,
      })
      .select('id')
      .single();

    if (insertError || !partner) {
      console.error('industry partner insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to onboard industry partner.' },
        { status: 500 }
      );
    }

    // 7. Audit log
    await supabase.from('audit_logs').insert({
      user_id:     user.id,
      action:      'industry_partner_onboarded',
      entity_type: 'industry_partner',
      entity_id:   partner.id,
      new_value:   { org_name, sectors, has_embedding: embedding.length > 0 },
    });

    return NextResponse.json({ id: partner.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
