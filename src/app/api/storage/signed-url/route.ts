import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'complaints';

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return NextResponse.json({ signedUrl: path });
    }

    const supabase = await createClient();
    const cleanPath = path.replace(new RegExp(`^${bucket}/`), '');
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(cleanPath, 7200);

    if (error || !data?.signedUrl) {
      // Fallback check in alternative bucket
      const altBucket = bucket === 'complaints' ? 'work-proofs' : 'complaints';
      const { data: altData } = await supabase.storage.from(altBucket).createSignedUrl(cleanPath, 7200);
      if (altData?.signedUrl) {
        return NextResponse.json({ signedUrl: altData.signedUrl });
      }
      return NextResponse.json({ error: error?.message || 'Could not generate signed URL' }, { status: 404 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error generating signed URL' },
      { status: 500 }
    );
  }
}
