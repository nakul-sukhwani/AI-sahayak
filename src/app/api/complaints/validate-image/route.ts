import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/server';
import { detectAiImage } from '@/lib/gemini';
import { checkRateLimit, LIMITS, rateLimitResponse } from '@/lib/rate-limit';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BASE64_CHARS = 7 * 1024 * 1024; // ~5MB file → ~7MB base64 string

const BodySchema = z.object({
  imageBase64: z.string().min(1, 'Image data required'),
  mimeType:    z.string().min(1, 'MIME type required'),
}).strict();

/** Creates a service-role client (bypasses RLS) for server-side audit logging */
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit (10 validations per user per minute) ─────────────────
    const rl = checkRateLimit(`${user.id}:validateImage`, LIMITS.validateImage);
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetAt) as unknown as NextResponse;
    }

    // ── Parse & validate body ────────────────────────────────────────────
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { imageBase64, mimeType } = parsed.data;

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    if (imageBase64.length > MAX_BASE64_CHARS) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image under 5MB.' },
        { status: 400 }
      );
    }

    // ── AI Detection ─────────────────────────────────────────────────────
    const analysis = await detectAiImage(imageBase64, mimeType);

    // ── Audit log (fire-and-forget, non-blocking) ─────────────────────────
    const serviceClient = createServiceClient();
    (async () => {
      try {
        await serviceClient.from('image_validation_logs').insert({
          user_id:        user.id,
          classification: analysis.classification,
          confidence:     analysis.confidence,
          status:         analysis.classification === 'AI_GENERATED'
                            ? 'REJECTED'
                            : (analysis.classification === 'UNCERTAIN' && analysis.confidence < 0.6)
                              ? 'FLAGGED'
                              : 'APPROVED',
          reason: analysis.reason,
        });
      } catch (e) {
        console.error('audit log error:', e);
      }
    })();

    // ── Classification result ─────────────────────────────────────────────

    // AI_GENERATED → always reject
    if (analysis.classification === 'AI_GENERATED') {
      return NextResponse.json(
        {
          status:         'REJECTED',
          classification: analysis.classification,
          confidence:     analysis.confidence,
          // Terse message only — don't expose artifact details (prevents gaming)
          message: '❌ This image appears to be AI-generated. Please upload a real photograph of the civic issue.',
          reason:  analysis.reason,
        },
        { status: 403 }
      );
    }

    // UNCERTAIN with low confidence → flag for re-upload
    if (analysis.classification === 'UNCERTAIN' && analysis.confidence < 0.6) {
      return NextResponse.json(
        {
          status:         'FLAGGED',
          classification: analysis.classification,
          confidence:     analysis.confidence,
          message: '⚠️ We couldn\'t confirm this is a real photo. Please upload a clearer image.',
          reason:  analysis.reason,
        },
        { status: 202 }
      );
    }

    // AUTHENTIC or UNCERTAIN with sufficient confidence → approved
    return NextResponse.json({
      status:         'APPROVED',
      classification: analysis.classification,
      confidence:     analysis.confidence,
      message: '✅ Image verified as authentic.',
    });

  } catch (err) {
    console.error('validate-image route error:', err);
    // Fail open — if Gemini is unavailable, don't block legitimate complaints
    return NextResponse.json({
      status:         'APPROVED',
      classification: 'UNCERTAIN',
      confidence:     0,
      message: '✅ Image accepted. (Automated check temporarily unavailable.)',
    });
  }
}
