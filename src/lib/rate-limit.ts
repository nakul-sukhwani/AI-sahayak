/**
 * In-memory rate limiter using a sliding window.
 * For production, replace with Redis (Upstash) or Vercel KV.
 * Works fine for single-server deployments on Vercel (serverless — each instance isolated).
 *
 * Assumption: This is sufficient for MVP. For multi-region prod, upgrade to KV store.
 */

interface RateEntry {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, RateEntry>();

// Clean up stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// Per DOC5 §3.2 rate limits
export const LIMITS = {
  analyze:          { maxRequests: 5,  windowMs: 60_000 },
  uploadImage:      { maxRequests: 10, windowMs: 60_000 },
  uploadProof:      { maxRequests: 10, windowMs: 60_000 },
  submitProof:      { maxRequests: 5,  windowMs: 60_000 },
  fileComplaint:    { maxRequests: 3,  windowMs: 60_000 },
  default:          { maxRequests: 30, windowMs: 60_000 },
} satisfies Record<string, RateLimitConfig>;

/**
 * Checks rate limit for a given key (typically userId + endpoint).
 * @param key - unique key, e.g. `${userId}:analyze`
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = LIMITS.default
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Start new window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Returns a 429 JSON response with Retry-After header */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait and try again.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}
