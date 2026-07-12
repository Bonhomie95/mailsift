import { createHash, randomBytes } from "crypto";
import { getSupabase } from "./supabase";

/**
 * Minimal API-key auth for programmatic access to /api/sort.
 *
 * Keys look like `ms_live_<32 hex>`. Only the SHA-256 hash is stored in the
 * Supabase `api_keys` table, so a leaked database never exposes usable keys.
 * The raw key is shown to the admin exactly once, at creation.
 */

const PREFIX = "ms_live_";

export function generateApiKey(): { key: string; hash: string; preview: string } {
  const key = PREFIX + randomBytes(24).toString("hex");
  return { key, hash: hashApiKey(key), preview: key.slice(0, 12) + "…" + key.slice(-4) };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** True if the key matches an active row. Best-effort updates last_used. */
export async function validateApiKey(key: string): Promise<boolean> {
  if (!key.startsWith(PREFIX)) return false;
  const db = getSupabase();
  if (!db) return false;

  const hash = hashApiKey(key);
  const { data, error } = await db
    .from("api_keys")
    .select("id")
    .eq("key_hash", hash)
    .eq("active", true)
    .limit(1)
    .abortSignal(AbortSignal.timeout(2500));
  if (error || !data || data.length === 0) return false;

  // Fire-and-forget usage timestamp.
  db.from("api_keys").update({ last_used: new Date().toISOString() }).eq("id", data[0].id).then(
    () => {},
    () => {}
  );
  return true;
}
