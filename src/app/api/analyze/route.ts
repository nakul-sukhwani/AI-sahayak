import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { analyzeComplaint } from '@/lib/gemini';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';

const BodySchema = z.object({
  imagePath: z.string().min(1, 'imagePath is required'),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limit — 5 req/min per user (DOC5 §3.2)
    const rl = checkRateLimit(`${user.id}:analyze`, LIMITS.analyze);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt) as unknown as NextResponse;

    // 3. Validate body
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { imagePath } = parsed.data;

    // 4. Generate a 1-hour signed URL — never expose raw storage paths (DOC5 §4.3)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('complaints')
      .createSignedUrl(imagePath, 3600);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Could not access image for analysis.' }, { status: 400 });
    }

    // 5. Run Gemini analysis — returns typed fallback on any AI failure (Rule 16)
    const result = await analyzeComplaint(signedData.signedUrl);

    return NextResponse.json(result, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
