import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildImagePath } from '@/lib/image';
import { z } from 'zod';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 512 * 1024; // 512 KB (matches bucket limit)

const QuerySchema = z.object({
  complaintId: z.string().uuid('Invalid complaint ID'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate query param
    const searchParams = request.nextUrl.searchParams;
    const parsed = QuerySchema.safeParse({
      complaintId: searchParams.get('complaintId'),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'complaintId (UUID) is required' }, { status: 400 });
    }
    const { complaintId } = parsed.data;

    // 3. Parse multipart form
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 4. Server-side MIME + size validation (defense in depth — Rule 17 DOC5)
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image must be under 512 KB after compression.' },
        { status: 400 }
      );
    }

    // 5. Build storage path — user-controlled path prevention (DOC5 §4.3)
    const path = buildImagePath(user.id, complaintId);
    const buffer = await file.arrayBuffer();

    // 6. Upload to private bucket
    const { error: uploadError } = await supabase.storage
      .from('complaints')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ path }, { status: 201 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
