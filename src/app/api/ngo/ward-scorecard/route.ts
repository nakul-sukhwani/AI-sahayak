import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeWardScorecards, generateWardScorecardPDF } from '@/lib/ward-scorecard';
import type { Complaint } from '@/types/complaint';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const orgName = searchParams.get('orgName') || 'Nagrik Seva Civic Oversight Coalition';

    const supabase = await createClient();

    // Fetch complaints
    const { data: complaintsRaw } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    const complaints = (complaintsRaw ?? []) as Complaint[];
    const report = computeWardScorecards(complaints);

    if (format === 'pdf') {
      const pdfBytes = await generateWardScorecardPDF(report, orgName);
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Ward_Civic_Audit_Scorecard_${new Date().toISOString().slice(0, 10)}.pdf"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate ward scorecard' },
      { status: 500 }
    );
  }
}
