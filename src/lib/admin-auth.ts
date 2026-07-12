import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Minimal admin auth: a single shared password (ADMIN_PASSWORD) exchanged for a
 * signed, time-limited cookie. "Nothing fancy" as requested — no user table.
 *
 * The cookie value is `<expiry>.<hmac>` signed with ADMIN_SECRET so it can't be
 * forged. Rotate ADMIN_SECRET to invalidate all sessions.
 */
const COOKIE = "mailsift_admin";
const MAX_AGE_S = 60 * 60 * 8; // 8 hours

function secret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "dev-insecure-secret";
}

function sign(expiry: number): string {
  return createHmac("sha256", secret()).update(String(expiry)).digest("hex");
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueSessionCookie() {
  const expiry = Date.now() + MAX_AGE_S * 1000;
  const value = `${expiry}.${sign(expiry)}`;
  cookies().set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}

export function isAuthed(): boolean {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return false;
  const [expStr, mac] = raw.split(".");
  const expiry = Number(expStr);
  if (!expiry || Number.isNaN(expiry) || expiry < Date.now()) return false;
  const expected = sign(expiry);
  if (mac?.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}
