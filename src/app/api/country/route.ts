import { NextRequest } from "next/server";
import {
  lookup,
  queryA,
  memoryHas,
  primeMemory,
  dnsCacheGetMany,
  dnsCachePutMany,
  type DnsRecords,
} from "@/lib/dns";
import { matchDomain } from "@/lib/match";
import { loadProviders } from "@/lib/providers";
import { normalizeToDomain } from "@/lib/parse";
import { enforceRateLimit } from "@/lib/rateLimit";
import { validateApiKey } from "@/lib/apiKeys";
import { scoreCountry } from "@/lib/countryMatch";
import { ipToCountry, ipGeoAvailable } from "@/lib/ipCountry";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Free-tier cap. Also enforced client-side per session. */
const MAX_DOMAINS = 20_000;
const CONCURRENCY = 40;

/**
 * Country Sorter endpoint — same streaming NDJSON contract as /api/sort, but
 * each line is a CountryResult (winning country + confidence + the signals that
 * voted for it). Reuses the L1/L2 DNS cache, provider matching, rate limiting
 * and API-key bypass from the mail sorter.
 *
 * When `geo` is true AND the offline IP table is present, we also resolve each
 * domain's A record and add the IP-geolocation vote (free, offline). Without the
 * table the request still works on the ccTLD / provider / host-TLD signals.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const apiKey = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const isApiUser = apiKey ? await validateApiKey(apiKey) : false;

  if (!isApiUser) {
    const limited = await enforceRateLimit(req, "sort", 40, 60);
    if (limited) return limited;
  }

  let body: { domains?: unknown; geo?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!Array.isArray(body.domains)) {
    return Response.json(
      { error: "Expected { domains: string[] }." },
      { status: 400 },
    );
  }
  const useGeo = body.geo === true && ipGeoAvailable();

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
      {
        error: `Free tier is limited to ${MAX_DOMAINS.toLocaleString()} domains per request.`,
      },
      { status: 413 },
    );
  }

  const rules = await loadProviders();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      // Seed L1 from persistent L2 cache (no-op without Supabase).
      try {
        const l2 = await dnsCacheGetMany(domains);
        for (const [domain, rec] of l2) primeMemory(domain, rec.mx, rec.ns);
      } catch {
        // best-effort cache
      }

      const newlyResolved = new Map<string, DnsRecords>();
      const queue = [...domains];

      async function worker() {
        while (queue.length) {
          const domain = queue.shift();
          if (!domain) break;
          const cached = memoryHas(domain);
          try {
            const records = await lookup(domain);
            if (!cached) newlyResolved.set(domain, records);

            // Optional offline IP-geolocation vote.
            let ipCountry: string | null = null;
            if (useGeo) {
              const ips = await queryA(domain);
              for (const ip of ips) {
                ipCountry = ipToCountry(ip);
                if (ipCountry) break;
              }
            }

            const m = matchDomain(records, rules, domain);
            emit(
              scoreCountry({
                domain,
                records,
                providerId: m.providerId,
                category: m.category,
                ipCountry,
              }),
            );
          } catch (err) {
            Sentry.captureException(err);
            emit(
              scoreCountry({
                domain,
                records: { mx: [], ns: [] },
                providerId: "",
                category: "",
              }),
            );
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, domains.length) }, worker),
      );

      try {
        await dnsCachePutMany(newlyResolved);
      } catch {
        /* ignore */
      }

      emit({ done: true, count: domains.length });
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
