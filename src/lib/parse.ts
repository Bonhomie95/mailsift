/**
 * Input parsing: turn arbitrary pasted text or an uploaded file into a clean,
 * de-duplicated list of domains.
 *
 * Accepts emails or bare domains, mixed together, separated by ANY of:
 * comma, semicolon, tab, pipe, whitespace, or newlines. URLs are tolerated too
 * (https://foo.com/bar -> foo.com).
 */

const SPLIT_RE = /[\s,;|]+/;

/** Extract the registrable-ish domain from an email, URL, or bare domain. */
export function normalizeToDomain(raw: string): string | null {
  let s = raw.trim().toLowerCase();
  if (!s) return null;

  // Strip common wrappers.
  s = s.replace(/^["'<(]+/, "").replace(/[">')]+$/, "");

  // Email -> part after the last @.
  if (s.includes("@")) s = s.split("@").pop() as string;

  // URL -> hostname.
  if (s.includes("://")) s = s.split("://")[1];
  s = s.split("/")[0].split("?")[0].split("#")[0];

  // Drop port and trailing dot.
  s = s.split(":")[0].replace(/\.$/, "");

  // Must look like a domain: at least one dot, valid chars.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(s)) return null;
  // Strip leading "www."
  s = s.replace(/^www\./, "");
  return s;
}

export interface ParsedInput {
  /** Unique, normalized domains ready for DNS lookup. */
  domains: string[];
  /** Map of domain -> the original raw tokens that produced it. */
  originals: Record<string, string[]>;
  /** Count of tokens that couldn't be parsed into a domain. */
  invalid: number;
  /** Total raw tokens seen (pre-dedupe). */
  total: number;
}

export function parseText(text: string): ParsedInput {
  const tokens = text.split(SPLIT_RE).map((t) => t.trim()).filter(Boolean);
  const originals: Record<string, string[]> = {};
  let invalid = 0;

  for (const token of tokens) {
    const domain = normalizeToDomain(token);
    if (!domain) {
      invalid++;
      continue;
    }
    (originals[domain] ??= []).push(token);
  }

  return {
    domains: Object.keys(originals),
    originals,
    invalid,
    total: tokens.length,
  };
}
