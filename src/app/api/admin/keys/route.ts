import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { generateApiKey } from "@/lib/apiKeys";

export const runtime = "nodejs";

/** List API keys (metadata only — raw keys are never retrievable). Admin only. */
export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const db = getSupabase();
  if (!db) return NextResponse.json({ keys: [], dbConfigured: false });
  const { data, error } = await db
    .from("api_keys")
    .select("id, label, preview, active, created_at, last_used")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data, dbConfigured: true });
}

/** Create a key. Returns the raw key ONCE. Admin only. */
export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const label = String(body.label ?? "").trim() || "Untitled key";
  const { key, hash, preview } = generateApiKey();

  const { error } = await db.from("api_keys").insert({ label, key_hash: hash, preview, active: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The raw key is returned exactly once and never stored in plaintext.
  return NextResponse.json({ ok: true, key, preview });
}

/** Revoke (deactivate) a key. Admin only. */
export async function DELETE(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const { error } = await db.from("api_keys").update({ active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
