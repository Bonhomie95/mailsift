import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { SEED_PROVIDERS, RETIRED_PROVIDER_IDS } from "@/lib/providers-seed";
import { invalidateProviderCache } from "@/lib/providers";

export const runtime = "nodejs";

/**
 * Upsert all built-in provider rules into Supabase so they become editable rows
 * in /admin. Idempotent (upsert on id) — safe to run repeatedly, e.g. after new
 * providers are added to the code.
 */
export async function POST() {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = getSupabase();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase isn't configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const rows = SEED_PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    match_on: p.matchOn,
    mx_patterns: p.mxPatterns,
    ns_patterns: p.nsPatterns,
    priority: p.priority,
    color: p.color,
    icon: p.icon ?? null,
  }));

  let seeded = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const slice = rows.slice(i, i + 200);
    const { error } = await db.from("providers").upsert(slice, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    seeded += slice.length;
  }

  // Remove providers we've since split/renamed so their stale merged rules don't
  // shadow the replacements. Only touches this explicit list — never custom rows.
  let pruned = 0;
  if (RETIRED_PROVIDER_IDS.length) {
    const { error, count } = await db
      .from("providers")
      .delete({ count: "exact" })
      .in("id", RETIRED_PROVIDER_IDS);
    if (!error) pruned = count ?? 0;
  }

  invalidateProviderCache();
  return NextResponse.json({ ok: true, seeded, pruned });
}
