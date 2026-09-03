// src/app/api/dashboard/analytics/route.ts
// GET /api/dashboard/analytics — Aggregate statistics for SIH 26043 Dashboard
//
// Module 5: Analytics Dashboard
//
// Rule 7:  try/catch on every async op
// Rule 18: server client

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only admin and govt reviewers can view full analytics
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    if (!role || !['admin', 'supervisor', 'officer'].includes(role)) {
      return NextResponse.json(
        { error: 'Only administrators and government officers can view analytics.' },
        { status: 403 }
      );
    }

    const rl = checkRateLimit(`${user.id}:analytics`, LIMITS.default);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // Aggregations
    // 1. Total challenges submitted
    const { count: challengesCount } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true });

    // 2. Active proposals (not draft, not rejected)
    const { count: activeProposalsCount } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("draft","rejected")');

    // 3. Industry Funding Total (INR)
    const { data: commitments } = await supabase
      .from('industry_commitments')
      .select('funding_inr')
      .eq('commitment_type', 'funding')
      .in('status', ['committed', 'active', 'completed']);

    const totalFunding = commitments?.reduce((acc, curr) => acc + (curr.funding_inr || 0), 0) || 0;

    // 4. Deployed solutions
    const { count: deployedCount } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'deployed');

    // 5. Challenges by domain for chart
    const { data: challengesByDomain } = await supabase.rpc('get_challenges_by_domain_stats');
    
    // If RPC not available, fallback to manual grouping (in a real app, prefer RPC for analytics)
    let domainStats = challengesByDomain;
    if (!domainStats) {
      const { data: allChallenges } = await supabase.from('challenges').select('domain');
      const grouped = (allChallenges || []).reduce((acc: any, c) => {
        acc[c.domain] = (acc[c.domain] || 0) + 1;
        return acc;
      }, {});
      domainStats = Object.keys(grouped).map(k => ({ name: k, value: grouped[k] }));
    }

    return NextResponse.json({
      stats: {
        total_challenges: challengesCount || 0,
        active_proposals: activeProposalsCount || 0,
        total_funding_inr: totalFunding,
        deployed_solutions: deployedCount || 0,
      },
      charts: {
        challenges_by_domain: domainStats,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
