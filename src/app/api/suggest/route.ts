import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Public "suggest a mail host / MX / NS we're missing" endpoint. Stores the
 * suggestion in Supabase for the admin to review. Rate-limited per IP.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "suggest", 10, 60);
  if (limited) return limited;

  let body: { value?: unknown; note?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const value = String(body.value ?? "").trim().slice(0, 300);
  if (!value) return NextResponse.json({ error: "Please enter a domain, MX or NS host." }, { status: 400 });

  const db = getSupabase();
  if (!db) {
    return NextResponse.json(
      { error: "Suggestions aren't set up yet — please try again later." },
      { status: 503 }
    );
  }

  const { error } = await db.from("suggestions").insert({
    value,
    note: body.note ? String(body.note).trim().slice(0, 1000) : null,
    email: body.email ? String(body.email).trim().slice(0, 200) : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
