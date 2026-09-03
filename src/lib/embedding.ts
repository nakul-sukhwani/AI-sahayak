// src/lib/embedding.ts
// Module 3: Institution-Based Routing Engine
// Generates 768-dimensional text embeddings using Gemini text-embedding-004.
// Used by: POST /api/challenges (challenge embedding on submit)
//          POST /api/universities (expertise embedding at onboarding)
//          POST /api/industry-partners (capability embedding at onboarding)
//
// Rule 8: Lazy-init pattern matches gemini.ts getClient().
// Rule 16: Defensive parse — returns EMBEDDING_FALLBACK (empty array) on any failure.
// Rule 7: try/catch on every async call.

import { GoogleGenerativeAI } from '@google/generative-ai';

// 768 dimensions — matches VECTOR(768) in all embedding columns.
// Gemini text-embedding-004 always returns exactly 768 floats.
const EMBEDDING_DIM = 768;

// Typed fallback: empty array signals "not yet embedded" — stored as NULL in DB.
export const EMBEDDING_FALLBACK: number[] = [];

/** Lazy-init embedding client — validates key at call time (matches gemini.ts pattern). */
function getEmbeddingClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(key);
}

/**
 * Generates a 768-dimensional embedding for the given text using
 * Gemini text-embedding-004. Returns EMBEDDING_FALLBACK (empty array) on
 * any error — callers should treat an empty array as "embedding pending".
 *
 * @param text - The text to embed (e.g. challenge description, expertise description)
 * @param taskType - Gemini embedding task type; defaults to SEMANTIC_SIMILARITY
 *                   Use 'RETRIEVAL_DOCUMENT' for corpus entries (expertise/capability rows).
 *                   Use 'RETRIEVAL_QUERY' for the query (challenge description at routing time).
 */
export async function generateEmbedding(
  text: string,
  taskType:
    | 'SEMANTIC_SIMILARITY'
    | 'RETRIEVAL_DOCUMENT'
    | 'RETRIEVAL_QUERY'
    | 'CLASSIFICATION'
    | 'CLUSTERING' = 'SEMANTIC_SIMILARITY'
): Promise<number[]> {
  try {
    if (!text || text.trim().length === 0) {
      console.error('generateEmbedding: empty text provided');
      return EMBEDDING_FALLBACK;
    }

    const genAI = getEmbeddingClient();
    // text-embedding-004 is the current Gemini embedding model (768-dim).
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent({
      content: { parts: [{ text: text.trim() }], role: 'user' },
      taskType: taskType as Parameters<typeof model.embedContent>[0]['taskType'],
    });

    const values = result.embedding?.values;

    // Validate dimension — guard against API changes
    if (!Array.isArray(values) || values.length !== EMBEDDING_DIM) {
      console.error(
        `generateEmbedding: unexpected dimension ${values?.length ?? 0}, expected ${EMBEDDING_DIM}`
      );
      return EMBEDDING_FALLBACK;
    }

    return values;
  } catch (err) {
    // Rule 7: never throw from this helper — callers store NULL and retry later
    console.error('generateEmbedding error:', err);
    return EMBEDDING_FALLBACK;
  }
}

/**
 * Builds a combined text string for a university expertise row.
 * Concatenating domain + description gives the embedding maximum context.
 */
export function buildExpertiseText(domain: string, description: string): string {
  return `Domain: ${domain}\n\n${description}`.trim();
}

/**
 * Builds a combined text string for an industry partner capability row.
 * Combines sector tags and engagement types into a rich descriptor.
 */
export function buildCapabilityText(
  sectors: string[],
  engagementTypes: string[],
  orgName: string
): string {
  return [
    `Organisation: ${orgName}`,
    `Sectors: ${sectors.join(', ')}`,
    `Engagement types offered: ${engagementTypes.join(', ')}`,
  ].join('\n').trim();
}
