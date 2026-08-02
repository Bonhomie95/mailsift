/**
 * DNS-over-HTTPS lookups for MX and NS records.
 *
 * Uses Cloudflare (1.1.1.1) as primary and Google (dns.google) as fallback.
 * Both are free, globally distributed, and built for very high query volumes,
 * which is what lets MailSift scale without running its own resolvers.
 *
 * An in-memory LRU-ish cache dedupes repeated lookups within a warm instance.
 * On serverless this cache is per-instance; for cross-instance persistence,
 * wire up the optional Supabase `dns_cache` table (see supabase/schema.sql).
 */

import { getSupabase } from "./supabase";

type RecordType = "MX" | "NS";

interface DohAnswer {
  name: string;
  type: number;
  data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
}

interface CacheEntry {
  mx: string[];
  ns: string[];
  expires: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 1; // 6 hours
const CACHE_MAX = 750_000;

const DOH_ENDPOINTS = [
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
];

function cacheGet(domain: string): CacheEntry | null {
  const hit = CACHE.get(domain);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    CACHE.delete(domain);
    return null;
  }
  return hit;
}

function cacheSet(domain: string, mx: string[], ns: string[]) {
  if (CACHE.size >= CACHE_MAX) {
    // Evict oldest ~10% to keep memory bounded.
    const drop = Math.ceil(CACHE_MAX * 0.1);
    let i = 0;
    for (const key of CACHE.keys()) {
      CACHE.delete(key);
      if (++i >= drop) break;
    }
  }
  CACHE.set(domain, { mx, ns, expires: Date.now() + CACHE_TTL_MS });
}

async function queryType(domain: string, type: RecordType): Promise<string[]> {
  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const url = `${endpoint}?name=${encodeURIComponent(domain)}&type=${type}`;
      const res = await fetch(url, {
        headers: { accept: "application/dns-json" },
        // Keep DNS lookups snappy so a slow domain can't stall a batch.
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as DohResponse;
      if (!json.Answer) return [];
      return json.Answer.filter((a) => a.data)
        .map((a) => {
          // MX data looks like "10 aspmx.l.google.com." — strip priority + trailing dot.
          let host = a.data.trim();
          if (type === "MX") host = host.replace(/^\d+\s+/, "");
          return host.replace(/\.$/, "").toLowerCase();
        })
        .filter(Boolean);
    } catch {
      // Try the next endpoint.
    }
  }
  return [];
}

export interface DnsRecords {
  mx: string[];
  ns: string[];
}

/** Is this domain already in the fast in-memory (L1) cache? */
export function memoryHas(domain: string): boolean {
  return cacheGet(domain) !== null;
}

/** Seed the L1 cache (e.g. from the Supabase L2 cache) so `lookup` is instant. */
export function primeMemory(domain: string, mx: string[], ns: string[]) {
  cacheSet(domain, mx, ns);
}

export async function lookup(domain: string): Promise<DnsRecords> {
  const cached = cacheGet(domain);
  if (cached) return { mx: cached.mx, ns: cached.ns };

  const [mx, ns] = await Promise.all([
    queryType(domain, "MX"),
    queryType(domain, "NS"),
  ]);
  cacheSet(domain, mx, ns);
  return { mx, ns };
}

// --- Deliverability signals (SPF / DMARC via TXT records) ---
async function queryTxt(name: string): Promise<string[]> {
  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const url = `${endpoint}?name=${encodeURIComponent(name)}&type=TXT`;
      const res = await fetch(url, {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as DohResponse;
      if (!json.Answer) return [];
      return json.Answer.filter((a) => a.data).map((a) =>
        a.data.replace(/\\"/g, "").replace(/^"|"$/g, "").replace(/" "/g, "").toLowerCase()
      );
    } catch {
      // try next endpoint
    }
  }
  return [];
}

/**
 * Resolve a domain's IPv4 (A) addresses over DoH. Used by the Country Sorter's
 * offline IP-geolocation signal. Follows the same endpoint-fallback pattern as
 * queryType; returns dotted-quad strings (may be empty).
 */
export async function queryA(domain: string): Promise<string[]> {
  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const url = `${endpoint}?name=${encodeURIComponent(domain)}&type=A`;
      const res = await fetch(url, {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as DohResponse;
      if (!json.Answer) return [];
      // type 1 = A record; ignore CNAME (5) rows in the chain.
      return json.Answer.filter((a) => a.type === 1 && a.data).map((a) => a.data.trim());
    } catch {
      // try next endpoint
    }
  }
  return [];
}

export interface Deliverability {
  spf: boolean;
  dmarc: boolean;
}

/** Detect whether a domain publishes SPF (TXT) and DMARC (_dmarc TXT). */
export async function checkDeliverability(domain: string): Promise<Deliverability> {
  const [txt, dmarcTxt] = await Promise.all([queryTxt(domain), queryTxt(`_dmarc.${domain}`)]);
  return {
    spf: txt.some((t) => t.includes("v=spf1")),
    dmarc: dmarcTxt.some((t) => t.includes("v=dmarc1")),
  };
}

// --- Persistent L2 cache (Supabase `dns_cache`) ---
// Optional: when Supabase is configured, DNS results survive restarts and are
// shared across serverless instances, so repeat domains resolve instantly and
// we stop re-querying the free resolvers for the same names.

const L2_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** Batch-read persistent cache for the given domains (empty if no Supabase). */
export async function dnsCacheGetMany(domains: string[]): Promise<Map<string, DnsRecords>> {
  const out = new Map<string, DnsRecords>();
  const db = getSupabase();
  if (!db || domains.length === 0) return out;

  const cutoff = new Date(Date.now() - L2_TTL_MS).toISOString();
  const CHUNK = 500;
  const chunks: string[][] = [];
  for (let i = 0; i < domains.length; i += CHUNK) chunks.push(domains.slice(i, i + CHUNK));

  await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await db
        .from("dns_cache")
        .select("domain, mx, ns")
        .in("domain", chunk)
        .gte("fetched_at", cutoff)
        // Don't let a slow cache read stall the whole sort — skip on timeout.
        .abortSignal(AbortSignal.timeout(2000));
      if (!error && data) {
        for (const row of data as { domain: string; mx: string[] | null; ns: string[] | null }[]) {
          out.set(row.domain, { mx: row.mx ?? [], ns: row.ns ?? [] });
        }
      }
    })
  );
  return out;
}

/**
 * Batch-write freshly resolved domains to the persistent cache. We skip domains
 * with no records at all (both mx and ns empty) — those are almost always
 * NXDOMAIN or a transient failure, and caching them would poison future reads.
 */
export async function dnsCachePutMany(records: Map<string, DnsRecords>): Promise<void> {
  const db = getSupabase();
  if (!db || records.size === 0) return;

  const rows = [...records.entries()]
    .filter(([, r]) => r.mx.length || r.ns.length)
    .map(([domain, r]) => ({ domain, mx: r.mx, ns: r.ns, fetched_at: new Date().toISOString() }));
  if (rows.length === 0) return;

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.from("dns_cache").upsert(rows.slice(i, i + CHUNK), { onConflict: "domain" });
  }
}

/**
 * Resolve many domains with a bounded concurrency pool so we never open
 * thousands of sockets at once (which would get us rate-limited and eat memory).
 */
export async function lookupMany(
  domains: string[],
  concurrency = 40,
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, DnsRecords>> {
  const results = new Map<string, DnsRecords>();
  const queue = [...domains];
  let done = 0;

  async function worker() {
    while (queue.length) {
      const domain = queue.shift();
      if (!domain) break;
      try {
        results.set(domain, await lookup(domain));
      } catch {
        results.set(domain, { mx: [], ns: [] });
      }
      done++;
      onProgress?.(done, domains.length);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, domains.length) }, worker);
  await Promise.all(workers);
  return results;
}
