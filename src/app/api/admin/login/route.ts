import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, issueSessionCookie, clearSessionCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Admin is not configured. Set ADMIN_PASSWORD in your environment." },
      { status: 503 }
    );
  }
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.password || !verifyPassword(body.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  issueSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
