/**
 * RDAP registrar lookups (the modern, JSON replacement for WHOIS).
 *
 * For scale, we route each domain to its TLD's authoritative RDAP server using
 * the IANA bootstrap registry (data.iana.org/rdap/dns.json), instead of
 * funneling every request through rdap.org (which rate-limits bursts). rdap.org
 * is kept only as a fallback for TLDs missing from the bootstrap.
 *
 * Best-effort by design: registrar data is a bonus dimension. Genuine "no
 * registrar" results (a 200 response with no registrar entity) ARE cached;
 * transient failures (network error, timeout, non-2xx) are NOT cached, so a
 * blip never poisons the cache for 7 days.
 */

interface CacheEntry {
  registrar: string | null;
  expires: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const CACHE_MAX = 750_000;

// --- IANA bootstrap: TLD -> authoritative RDAP base URL ---
let bootstrapPromise: Promise<Map<string, string>> | null = null;

async function loadBootstrap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch("https://data.iana.org/rdap/dns.json", {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = (await res.json()) as { services?: [string[], string[]][] };
      for (const [tlds, urls] of json.services ?? []) {
        const base = urls.find((u) => u.startsWith("https")) ?? urls[0];
        if (!base) continue;
        for (const tld of tlds) map.set(tld.toLowerCase(), base.replace(/\/?$/, "/"));
      }
    }
  } catch {
    // Fall back to rdap.org-only routing.
  }
  return map;
}

function getBootstrap(): Promise<Map<string, string>> {
  if (!bootstrapPromise) bootstrapPromise = loadBootstrap();
  return bootstrapPromise;
}

// --- RDAP response parsing ---
interface RdapVcardProp {
  0: string;
  1: Record<string, unknown>;
  2: string;
  3: string;
}
interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, RdapVcardProp[]];
  entities?: RdapEntity[];
}
interface RdapResponse {
  entities?: RdapEntity[];
}

function extractFn(entity: RdapEntity): string | null {
  const props = entity.vcardArray?.[1];
  if (!props) return null;
  for (const p of props) {
    if (p[0] === "fn" && typeof p[3] === "string" && p[3].trim()) return p[3].trim();
  }
  return null;
}

function findRegistrar(entities: RdapEntity[] | undefined): string | null {
  if (!entities) return null;
  for (const e of entities) {
    if (e.roles?.includes("registrar")) {
      const fn = extractFn(e);
      if (fn) return fn;
    }
    const nested = findRegistrar(e.entities);
    if (nested) return nested;
  }
  return null;
}

// --- Cache helpers (only definitive results are cached) ---
function cacheGet(domain: string): string | null | undefined {
  const hit = CACHE.get(domain);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    CACHE.delete(domain);
    return undefined;
  }
  return hit.registrar;
}

function cacheSet(domain: string, registrar: string | null) {
  if (CACHE.size >= CACHE_MAX) {
    let i = 0;
    const drop = Math.ceil(CACHE_MAX * 0.1);
    for (const k of CACHE.keys()) {
      CACHE.delete(k);
      if (++i >= drop) break;
    }
  }
  CACHE.set(domain, { registrar, expires: Date.now() + CACHE_TTL_MS });
}

/** Fetch one RDAP URL. Returns registrar name on a 2xx (may be null if none),
 *  or throws on network error / timeout / non-2xx so the caller can retry. */
async function fetchRegistrarAt(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { accept: "application/rdap+json" },
    signal: AbortSignal.timeout(6000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`RDAP ${res.status}`);
  const json = (await res.json()) as RdapResponse;
  return findRegistrar(json.entities);
}

export async function lookupRegistrar(domain: string): Promise<string | null> {
  const cached = cacheGet(domain);
  if (cached !== undefined) return cached;

  const tld = domain.split(".").pop()?.toLowerCase() ?? "";
  const bootstrap = await getBootstrap();
  const base = bootstrap.get(tld);

  // Prefer the authoritative server; fall back to the rdap.org redirector.
  const candidates = [
    base ? `${base}domain/${encodeURIComponent(domain)}` : null,
    `https://rdap.org/domain/${encodeURIComponent(domain)}`,
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    try {
      const registrar = await fetchRegistrarAt(url);
      cacheSet(domain, registrar); // definitive: cache it (even if null)
      return registrar;
    } catch {
      // Try the next candidate; if all fail we return null WITHOUT caching.
    }
  }
  return null;
}

export async function lookupRegistrarMany(
  domains: string[],
  concurrency = 15
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  const queue = [...domains];

  async function worker() {
    while (queue.length) {
      const domain = queue.shift();
      if (!domain) break;
      results.set(domain, await lookupRegistrar(domain));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, domains.length) }, worker));
  return results;
}
