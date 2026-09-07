// src/app/api/ngo/generate-letter/route.ts
// GET /api/ngo/generate-letter?id=<complaint-id>&district=<district>
// Generates a formal accountability letter to the Jharkhand district government.
// Role gate: community_org + admin only.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateNGOLetter } from '@/lib/pdf';
import type { Complaint } from '@/types/complaint';
import type { WorkProof } from '@/types/work-proof';

const QuerySchema = z.object({
  id:       z.string().uuid('Invalid complaint ID'),
  district: z.string().min(1).max(60).default('Ranchi'),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Role gate — only community_org or admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role, full_name, display_name, submitter_org_name, address')
      .eq('id', user.id)
      .single();

    if (!profile || !['community_org', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden — NGO access only' }, { status: 403 });
    }

    // 3. Validate query params
    const parsed = QuerySchema.safeParse({
      id:       request.nextUrl.searchParams.get('id'),
      district: request.nextUrl.searchParams.get('district') ?? 'Ranchi',
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid complaint ID is required' }, { status: 400 });
    }
    const { id, district } = parsed.data;

    // 4. Fetch complaint
    const { data: complaint, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // 5. Fetch work proof (if any) for AI observation and after-image
    const { data: proof } = await supabase
      .from('work_proof')
      .select('*')
      .eq('complaint_id', id)
      .maybeSingle();

    const workProof = proof as WorkProof | null;

    // 6. Fetch before-image bytes
    let beforeImageBytes: Uint8Array | null = null;
    if (complaint.image_url) {
      try {
        const { data: signed } = await supabase.storage
          .from('complaints')
          .createSignedUrl(complaint.image_url, 300);
        if (signed?.signedUrl) {
          const res = await fetch(signed.signedUrl);
          if (res.ok) {
            beforeImageBytes = new Uint8Array(await res.arrayBuffer());
          }
        }
      } catch { /* skip */ }
    }

    // 7. Fetch after-image bytes (from work proof)
    let afterImageBytes: Uint8Array | null = null;
    if (workProof?.after_photo_url) {
      try {
        const { data: signed } = await supabase.storage
          .from('complaints')
          .createSignedUrl(workProof.after_photo_url, 300);
        if (signed?.signedUrl) {
          const res = await fetch(signed.signedUrl);
          if (res.ok) {
            afterImageBytes = new Uint8Array(await res.arrayBuffer());
          }
        }
      } catch { /* skip */ }
    }

    const daysOpen = Math.floor(
      (Date.now() - new Date(complaint.created_at).getTime()) / (1000 * 3600 * 24)
    );

    const orgName = profile.submitter_org_name ?? profile.display_name ?? profile.full_name ?? 'Community Organisation';
    const orgAddress = profile.address ?? null;

    // 8. Generate PDF letter
    const pdfBytes = await generateNGOLetter({
      complaint: complaint as Complaint,
      orgName,
      orgAddress,
      daysOpen,
      district,
      beforeImageBytes,
      afterImageBytes,
      proofAiObservation: workProof?.ai_observation ?? null,
    });

    const letterDate = new Date().toISOString().slice(0, 10);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ngo-letter-${id.slice(0, 8)}-${letterDate}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (err) {
    console.error('[NGO Letter Generation]', err);
    return NextResponse.json({ error: 'Letter generation failed. Please try again.' }, { status: 500 });
  }
}
