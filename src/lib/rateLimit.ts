/**
 * Per-IP rate limiting for the public API routes.
 *
 * Two backends, chosen automatically:
 *  - Upstash Redis (via its REST API) when UPSTASH_REDIS_REST_URL/TOKEN are set —
 *    correct across all serverless instances. Recommended for production.
 *  - In-memory fallback otherwise — works out of the box but is per-instance,
 *    so it's a soft guard rather than a hard global limit.
 *
 * Fixed-window counters: INCR the key, set a TTL on first hit.
 */

interface RateResult {
  ok: boolean;
  remaining: number;
  resetSec: number;
}

// --- In-memory backend ---
const mem = new Map<string, { count: number; resetAt: number }>();
const MEM_MAX = 20_000;

function memIncr(key: string, windowSec: number): number {
  const now = Date.now();
  const e = mem.get(key);
  if (!e || e.resetAt <= now) {
    if (mem.size >= MEM_MAX) {
      // Drop expired / oldest entries to bound memory.
      for (const [k, v] of mem) {
        if (v.resetAt <= now) mem.delete(k);
      }
      if (mem.size >= MEM_MAX) mem.clear();
    }
    mem.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return 1;
  }
  e.count++;
  return e.count;
}

// --- Upstash REST backend ---
async function upstashIncr(key: string, windowSec: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result: number }[];
    const count = Number(data?.[0]?.result);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateResult> {
  const count = (await upstashIncr(key, windowSec)) ?? memIncr(key, windowSec);
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetSec: windowSec,
  };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Returns a 429 Response if the limit is exceeded, else null. */
export async function enforceRateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowSec: number
): Promise<Response | null> {
  const rl = await checkRateLimit(`${scope}:${clientIp(req)}`, limit, windowSec);
  if (rl.ok) return null;
  return Response.json(
    { error: "You're going a bit fast — please wait a moment and try again." },
    { status: 429, headers: { "retry-after": String(rl.resetSec) } }
  );
}
