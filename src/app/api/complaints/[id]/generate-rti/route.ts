import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildRTIPetition, generateRTIPdfBytes } from '@/lib/legal-agent';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const orgName = searchParams.get('orgName') || 'Nagrik Seva Civic Oversight Coalition';

    const supabase = await createClient();

    // Fetch complaint
    const { data: complaint, error } = await supabase
      .from('complaints')
      .select('id, issue_type, severity, ward_name, address, description_en, created_at, ai_suggested_department')
      .eq('id', id)
      .single();

    if (error || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const petition = buildRTIPetition({
      id: complaint.id,
      issue_type: complaint.issue_type,
      severity: complaint.severity,
      ward_name: complaint.ward_name,
      address: complaint.address,
      description_en: complaint.description_en,
      created_at: complaint.created_at,
      ai_suggested_department: complaint.ai_suggested_department,
      org_name: orgName,
    });

    if (format === 'pdf') {
      const pdfBytes = await generateRTIPdfBytes(petition);
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="RTI-Section-6-${complaint.id.slice(0, 8)}.pdf"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      petition,
    });
  } catch (err) {
    console.error('RTI generation error:', err);
    return NextResponse.json({ error: 'Failed to generate RTI petition' }, { status: 500 });
  }
}
