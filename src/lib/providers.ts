import { SEED_PROVIDERS } from "./providers-seed";
import { getSupabase } from "./supabase";
import type { ProviderRule } from "./types";

/**
 * Load the active provider rule set = seed rules + admin-added rules from
 * Supabase (admin rows override seeds on id collision).
 *
 * Cached briefly in-instance so a big sort request doesn't hammer the DB.
 */
let cache: { rules: ProviderRule[]; expires: number } | null = null;
// Cache long-ish to avoid repeated Supabase round-trips on the hot sort path;
// admin writes call invalidateProviderCache() so changes still show immediately.
const TTL_MS = 1000 * 60 * 5;

interface DbProviderRow {
  id: string;
  name: string;
  category: string;
  match_on: "mx" | "ns" | "both";
  mx_patterns: string[] | null;
  ns_patterns: string[] | null;
  priority: number | null;
  color: string | null;
  icon: string | null;
}

function rowToRule(row: DbProviderRow): ProviderRule {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    matchOn: row.match_on,
    mxPatterns: (row.mx_patterns ?? []).map((s) => s.toLowerCase()),
    nsPatterns: (row.ns_patterns ?? []).map((s) => s.toLowerCase()),
    priority: row.priority ?? 0,
    color: row.color ?? "#6d5efc",
    icon: row.icon ?? undefined,
  };
}

export async function loadProviders(): Promise<ProviderRule[]> {
  if (cache && cache.expires > Date.now()) return cache.rules;

  const merged = new Map<string, ProviderRule>();
  for (const rule of SEED_PROVIDERS) merged.set(rule.id, rule);

  const db = getSupabase();
  if (db) {
    // Time-bound the query so a slow/distant Supabase can't hang admin or sort
    // requests — fall back to the built-in seed rules instead.
    const { data, error } = await db
      .from("providers")
      .select("*")
      .abortSignal(AbortSignal.timeout(2500));
    if (!error && data) {
      for (const row of data as DbProviderRow[]) merged.set(row.id, rowToRule(row));
    }
  }

  // domainPatterns are a code-only concern (not stored in the DB). Re-attach them
  // from the seed by id so a DB-overridden provider still matches by domain.
  const seedDomainPatterns = new Map(
    SEED_PROVIDERS.filter((s) => s.domainPatterns?.length).map((s) => [s.id, s.domainPatterns])
  );
  for (const [id, dp] of seedDomainPatterns) {
    const rule = merged.get(id);
    if (rule && !rule.domainPatterns?.length) rule.domainPatterns = dp;
  }

  const rules = [...merged.values()];
  cache = { rules, expires: Date.now() + TTL_MS };
  return rules;
}

export function invalidateProviderCache() {
  cache = null;
}
