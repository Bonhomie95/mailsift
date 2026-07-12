import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { getSupabase, isDbConfigured } from "@/lib/supabase";
import { loadProviders, invalidateProviderCache } from "@/lib/providers";

export const runtime = "nodejs";

/** List all active providers (seed + admin-added). Admin only. */
export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const rules = await loadProviders();

  // A provider is "custom" (editable/deletable) if it actually exists as a DB
  // row — whether hand-added or seeded from the built-ins. Ones that live only
  // in code are "seed" (read-only until synced to the database).
  const db = getSupabase();
  let dbIds = new Set<string>();
  if (db) {
    const { data } = await db.from("providers").select("id");
    if (data) dbIds = new Set((data as { id: string }[]).map((r) => r.id));
  }

  return NextResponse.json({
    dbConfigured: isDbConfigured(),
    providers: rules.map((r) => ({ ...r, source: dbIds.has(r.id) ? "custom" : "seed" })),
  });
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toPatternArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (typeof v === "string")
    return v.split(/[\n,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  return [];
}

/** Add or update a provider rule. Admin only. Requires Supabase. */
export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = getSupabase();
  if (!db) {
    return NextResponse.json(
      { error: "Adding providers requires Supabase. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const mxPatterns = toPatternArray(b.mxPatterns);
  const nsPatterns = toPatternArray(b.nsPatterns);
  if (!mxPatterns.length && !nsPatterns.length) {
    return NextResponse.json(
      { error: "Provide at least one MX or NS pattern to match on." },
      { status: 400 }
    );
  }

  const matchOn: "mx" | "ns" | "both" =
    mxPatterns.length && nsPatterns.length ? "both" : mxPatterns.length ? "mx" : "ns";

  const row = {
    id: String(b.id ?? "").trim() || slugify(name),
    name,
    category: String(b.category ?? "").trim() || name,
    match_on: matchOn,
    mx_patterns: mxPatterns,
    ns_patterns: nsPatterns,
    priority: Number.isFinite(Number(b.priority)) ? Number(b.priority) : 5,
    color: String(b.color ?? "").trim() || "#6d5efc",
    icon: (b.icon ? String(b.icon).trim() : null) || null,
  };

  const { error } = await db.from("providers").upsert(row, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateProviderCache();
  return NextResponse.json({ ok: true, id: row.id });
}

/** Delete a custom provider. Admin only. */
export async function DELETE(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { error } = await db.from("providers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateProviderCache();
  return NextResponse.json({ ok: true });
}
