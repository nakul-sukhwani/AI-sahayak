import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildImagePath } from '@/lib/image';
import { z } from 'zod';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 512 * 1024;

const QuerySchema = z.object({
  complaintId: z.string().uuid('Invalid complaint ID'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Worker/admin only
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['worker', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = QuerySchema.safeParse({
      complaintId: request.nextUrl.searchParams.get('complaintId'),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'complaintId (UUID) is required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be under 512 KB.' }, { status: 400 });
    }

    const path = buildImagePath(user.id, parsed.data.complaintId, 'proof');
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('complaints')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ path }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
