import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { findSpatialDuplicates, type ExistingComplaintRecord } from '@/lib/spatial-clustering';

const ClusterCheckSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  issue_type: z.string().min(1),
  radius_meters: z.number().min(10).max(2000).default(150),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = ClusterCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { latitude, longitude, issue_type, radius_meters } = parsed.data;

    const supabase = await createClient();

    // Query active non-resolved complaints
    const { data: openComplaints, error: dbError } = await supabase
      .from('complaints')
      .select('id, latitude, longitude, issue_type, description_en, severity, status, address, ward_name, created_at')
      .in('status', ['filed', 'assigned', 'in_progress', 'proof_submitted'])
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(100);

    if (dbError) {
      console.error('Cluster check db error:', dbError);
      return NextResponse.json({
        is_potential_duplicate: false,
        cluster_count: 0,
        nearby_candidates: [],
        master_ticket: null,
        reason: 'Unable to query open complaints at this time.',
      });
    }

    const records: ExistingComplaintRecord[] = (openComplaints || []).map((c) => ({
      id: c.id,
      latitude: Number(c.latitude),
      longitude: Number(c.longitude),
      issue_type: c.issue_type,
      description_en: c.description_en,
      severity: c.severity,
      status: c.status,
      address: c.address,
      ward_name: c.ward_name,
      created_at: c.created_at,
    }));

    const result = findSpatialDuplicates(
      latitude,
      longitude,
      issue_type,
      records,
      radius_meters
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Spatial clustering endpoint error:', err);
    return NextResponse.json(
      {
        is_potential_duplicate: false,
        cluster_count: 0,
        nearby_candidates: [],
        master_ticket: null,
        reason: 'Clustering check failed safely.',
      },
      { status: 200 }
    );
  }
}
