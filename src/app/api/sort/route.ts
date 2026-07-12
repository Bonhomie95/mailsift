import { NextRequest } from "next/server";
import {
  lookup,
  memoryHas,
  primeMemory,
  dnsCacheGetMany,
  dnsCachePutMany,
  checkDeliverability,
  type DnsRecords,
} from "@/lib/dns";
import { matchDomain } from "@/lib/match";
import { loadProviders } from "@/lib/providers";
import { normalizeToDomain } from "@/lib/parse";
import { enforceRateLimit } from "@/lib/rateLimit";
import { validateApiKey } from "@/lib/apiKeys";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Free-tier cap. Also enforced client-side per session. */
const MAX_DOMAINS = 20_000;
const CONCURRENCY = 40;

/**
 * Streams results as newline-delimited JSON (NDJSON): one JSON object per line,
 * emitted the moment each domain resolves — so the client can display buckets
 * live "as it sees them" rather than waiting for the whole batch.
 *
 * Flow: seed the L1 memory cache from the persistent L2 cache (Supabase), then
 * resolve everything with bounded concurrency (memory/cache hits are instant),
 * emitting each result and writing newly-resolved ones back to L2.
 */
export async function POST(req: NextRequest) {
  // API-key callers (Authorization: Bearer ms_...) skip the free rate limit.
  const auth = req.headers.get("authorization");
  const apiKey = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const isApiUser = apiKey ? await validateApiKey(apiKey) : false;

  if (!isApiUser) {
    // Abuse guard: cap requests per IP (each request carries up to 1000 domains).
    const limited = await enforceRateLimit(req, "sort", 40, 60);
    if (limited) return limited;
  }

  let body: { domains?: unknown; deliverability?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!Array.isArray(body.domains)) {
    return Response.json({ error: "Expected { domains: string[] }." }, { status: 400 });
  }
  const wantDeliverability = body.deliverability === true;

  const unique = new Set<string>();
  for (const raw of body.domains) {
    if (typeof raw !== "string") continue;
    const d = normalizeToDomain(raw);
    if (d) unique.add(d);
  }
  const domains = [...unique];
  if (domains.length === 0) {
    return Response.json({ error: "No valid domains found." }, { status: 400 });
  }
  if (domains.length > MAX_DOMAINS) {
    return Response.json(
      { error: `Free tier is limited to ${MAX_DOMAINS.toLocaleString()} domains per request.` },
      { status: 413 }
    );
  }

  const rules = await loadProviders();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      // Seed L1 from persistent L2 cache (no-op if Supabase isn't configured).
      let fromCache = 0;
      try {
        const l2 = await dnsCacheGetMany(domains);
        for (const [domain, rec] of l2) primeMemory(domain, rec.mx, rec.ns);
      } catch {
        // Cache is best-effort; continue with live lookups.
      }

      const newlyResolved = new Map<string, DnsRecords>();
      const queue = [...domains];

      const emitResult = (
        domain: string,
        records: DnsRecords,
        cached: boolean,
        deliv?: { spf: boolean; dmarc: boolean }
      ) => {
        if (cached) fromCache++;
        const m = matchDomain(records, rules, domain);
        emit({
          domain,
          providerId: m.providerId,
          provider: m.provider,
          category: m.category,
          color: m.color,
          matchedBy: m.matchedBy,
          matchedPattern: m.matchedPattern,
          evidence: m.evidence,
          confidence: m.confidence,
          hasSpf: deliv?.spf,
          hasDmarc: deliv?.dmarc,
          mx: records.mx,
          ns: records.ns,
        });
      };

      async function worker() {
        while (queue.length) {
          const domain = queue.shift();
          if (!domain) break;
          const cached = memoryHas(domain);
          try {
            const records = await lookup(domain);
            if (!cached) newlyResolved.set(domain, records);
            // Optional SPF/DMARC deliverability check (extra TXT lookups).
            const deliv = wantDeliverability ? await checkDeliverability(domain) : undefined;
            emitResult(domain, records, cached, deliv);
          } catch (err) {
            Sentry.captureException(err);
            emitResult(domain, { mx: [], ns: [] }, false);
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, domains.length) }, worker)
      );

      // Persist newly-resolved domains for next time (best-effort).
      try {
        await dnsCachePutMany(newlyResolved);
      } catch {
        /* ignore */
      }

      // Final line: a summary marker the client can use to finalize.
      emit({ done: true, count: domains.length, fromCache });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
    },
  });
}
