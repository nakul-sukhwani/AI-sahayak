import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { z } from 'zod';
import {
  ANALYZE_COMPLAINT_SYSTEM,
  buildAnalyzePrompt,
} from '@/prompts/analyze-complaint';
import {
  buildVerifyProofPrompt,
  VERIFY_PROOF_SYSTEM,
} from '@/prompts/verify-proof';
import {
  DETECT_AI_IMAGE_SYSTEM,
  buildDetectAiImagePrompt,
} from '@/prompts/detect-ai-image';
import {
  type AIAnalysisResult,
  AI_ANALYSIS_FALLBACK,
  type AIProofVerificationResult,
  AI_PROOF_FALLBACK,
  type AIImageDetectionResult,
  AI_IMAGE_DETECTION_FALLBACK,
} from '@/types/ai';

// Lazy-init the client — validates key at call time, not module load
function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(key);
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// ── Zod schemas for defensive AI output parsing (Rule 16) ─────────────

const AnalysisSchema = z.object({
  issue_type:           z.string(),
  subcategory:          z.string(),
  severity:             z.enum(['low', 'medium', 'high', 'critical']),
  description_en:       z.string(),
  description_hi:       z.string(),
  suggested_department: z.string(),
  suggested_worker_id:  z.null(),
  confidence_score:     z.number().min(0).max(1),
  tags:                 z.array(z.string()),
  urgency_reason:       z.string(),
});

const ProofSchema = z.object({
  issue_resolved:    z.boolean(),
  confidence:        z.number().min(0).max(1),
  observation:       z.string(),
  remaining_issues:  z.string().nullable(),
  new_issues:        z.string().nullable(),
});

const ImageDetectionSchema = z.object({
  classification: z.enum(['AUTHENTIC', 'AI_GENERATED', 'UNCERTAIN']),
  confidence:     z.number().min(0).max(1),
  reason:         z.string(),
  artifacts:      z.array(z.string()),
});

/** Strips markdown fences from AI output then attempts JSON.parse */
function parseJson<T>(raw: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const parsed = JSON.parse(stripped);
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Helper to fetch a signed URL and convert it to Gemini's inlineData format.
 */
async function fetchImageAsInlineData(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch image');
  const buffer = await res.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString('base64'),
      mimeType: res.headers.get('content-type') || 'image/jpeg',
    },
  };
}

/**
 * Analyzes a complaint image using Gemini 2.5 Flash.
 * @param signedImageUrl - 1-hour signed URL to the image in Supabase Storage
 */
export async function analyzeComplaint(
  signedImageUrl: string
): Promise<AIAnalysisResult> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: ANALYZE_COMPLAINT_SYSTEM,
      safetySettings: SAFETY_SETTINGS,
    });

    const imageData = await fetchImageAsInlineData(signedImageUrl);

    const result = await model.generateContent([
      imageData,
      buildAnalyzePrompt(),
    ]);
    const raw = result.response.text();
    return parseJson(raw, AnalysisSchema, AI_ANALYSIS_FALLBACK);
  } catch (err) {
    console.error('analyzeComplaint error:', err);
    return AI_ANALYSIS_FALLBACK;
  }
}

/**
 * Verifies proof of work by comparing before and after photos.
 * @param beforeUrl - Signed URL to the original complaint photo
 * @param afterUrl  - Signed URL to the worker's proof photo
 */
export async function verifyProof(
  beforeUrl: string,
  afterUrl: string
): Promise<AIProofVerificationResult> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: VERIFY_PROOF_SYSTEM,
      safetySettings: SAFETY_SETTINGS,
    });

    const beforeData = await fetchImageAsInlineData(beforeUrl);
    const afterData = await fetchImageAsInlineData(afterUrl);

    const result = await model.generateContent([
      { text: "BEFORE photo (original complaint):" },
      beforeData,
      { text: "AFTER photo (worker's proof of completion):" },
      afterData,
      buildVerifyProofPrompt(),
    ]);
    const raw = result.response.text();
    return parseJson(raw, ProofSchema, AI_PROOF_FALLBACK);
  } catch (err) {
    console.error('verifyProof error:', err);
    return AI_PROOF_FALLBACK;
  }
}

/**
 * Detects whether a complaint image is AI-generated or a real photograph.
 * Accepts a base64-encoded image and MIME type directly from the client.
 * @param imageBase64 - Raw base64 string (no data URL prefix)
 * @param mimeType    - MIME type of the image (e.g. 'image/jpeg')
 */
export async function detectAiImage(
  imageBase64: string,
  mimeType: string
): Promise<AIImageDetectionResult> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: DETECT_AI_IMAGE_SYSTEM,
      safetySettings: SAFETY_SETTINGS,
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
      { text: buildDetectAiImagePrompt() },
    ]);

    const raw = result.response.text();
    return parseJson(raw, ImageDetectionSchema, AI_IMAGE_DETECTION_FALLBACK);
  } catch (err) {
    console.error('detectAiImage error:', err);
    return AI_IMAGE_DETECTION_FALLBACK;
  }
}
