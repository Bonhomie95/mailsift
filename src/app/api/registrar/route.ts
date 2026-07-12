import { NextRequest, NextResponse } from "next/server";
import { lookupRegistrarMany } from "@/lib/rdap";
import { normalizeRegistrar } from "@/lib/registrars";
import { normalizeToDomain } from "@/lib/parse";
import { enforceRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_DOMAINS = 20_000;

/**
 * Lazy, best-effort registrar (RDAP) lookup. The client calls this only when
 * the user switches to the "Registrar" view, so it never slows the main sort.
 */
export async function POST(req: NextRequest) {
  // RDAP is slower and rate-limited upstream, so guard it a little tighter.
  const limited = await enforceRateLimit(req, "registrar", 30, 60);
  if (limited) return limited;

  let body: { domains?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!Array.isArray(body.domains)) {
    return NextResponse.json({ error: "Expected { domains: string[] }." }, { status: 400 });
  }

  const unique = new Set<string>();
  for (const raw of body.domains) {
    if (typeof raw !== "string") continue;
    const d = normalizeToDomain(raw);
    if (d) unique.add(d);
  }
  const domains = [...unique];
  if (domains.length === 0) {
    return NextResponse.json({ error: "No valid domains found." }, { status: 400 });
  }
  if (domains.length > MAX_DOMAINS) {
    return NextResponse.json({ error: `Limited to ${MAX_DOMAINS} domains.` }, { status: 413 });
  }

  const map = await lookupRegistrarMany(domains);
  const results = domains.map((domain) => {
    const raw = map.get(domain) ?? null;
    const bucket = normalizeRegistrar(raw);
    return {
      domain,
      registrarRaw: raw,
      registrarId: bucket.id,
      registrar: bucket.name,
      color: bucket.color,
    };
  });

  return NextResponse.json({ count: results.length, results });
}
