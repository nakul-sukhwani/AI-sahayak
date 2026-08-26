import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateComplaintPDF } from '@/lib/pdf';
import type { Complaint } from '@/types/complaint';

const QuerySchema = z.object({
  id: z.string().uuid('Invalid complaint ID'),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate complaint ID
    const parsed = QuerySchema.safeParse({
      id: request.nextUrl.searchParams.get('id'),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid complaint ID is required' }, { status: 400 });
    }
    const { id } = parsed.data;

    // 3. Fetch complaint — RLS ensures user can only access their own
    const { data: complaint, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // 4. Fetch citizen name (unless anonymous)
    let citizenName: string | null = null;
    if (!complaint.is_anonymous) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('full_name, display_name')
        .eq('id', complaint.user_id)
        .single();
      citizenName = profile?.full_name ?? profile?.display_name ?? null;
    }

    // 5. Fetch officer name if resolved
    let officerName: string | null = null;
    if (complaint.status === 'resolved') {
      const { data: proof } = await supabase
        .from('work_proof')
        .select('verified_by, users_profile:verified_by(full_name, display_name)')
        .eq('complaint_id', id)
        .eq('status', 'approved')
        .single();

      if (proof?.verified_by) {
        const vp = (proof.users_profile as unknown) as { full_name: string | null; display_name: string | null } | null;
        officerName = vp?.full_name ?? vp?.display_name ?? null;
      }
    }

    // 6. Generate PDF
    const pdfBytes = await generateComplaintPDF({
      complaint: complaint as Complaint,
      citizenName,
      officerName,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://nagrikseva.in',
    });

    // 7. Return PDF with appropriate headers
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="nagrik-seva-${id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch {
    return NextResponse.json({ error: 'PDF generation failed. Please try again.' }, { status: 500 });
  }
}
