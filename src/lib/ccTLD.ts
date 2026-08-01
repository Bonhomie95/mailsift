/**
 * Country-code TLD → ISO-3166 country.
 *
 * The country is decided by the domain's FINAL label when that label is a
 * country-code TLD. Second-level suffixes (co.uk, com.br, com.au, co.jp, gov.ng)
 * don't change the country, so we only inspect the last label — e.g. "bbc.co.uk"
 * and "gov.uk" both resolve via "uk" → GB.
 *
 * Two guards keep this honest:
 *   - Codes that aren't real countries in our table (eu, su, …) return null.
 *   - GENERIC_CCTLDS lists ccTLDs sold/used as vanity domains worldwide
 *     (.io, .co, .me, .tv, .ai …). A ".io" domain tells us nothing about the
 *     owner's country, so we abstain rather than vote for its assigned territory.
 */

import { isCountry } from "./countries";

/** ccTLDs whose ISO code ≠ the TLD string. Most ccTLDs are the ISO code itself. */
const CCTLD_ALIAS: Record<string, string> = {
  uk: "GB", // .uk is assigned to the United Kingdom (ISO GB)
};

/**
 * ccTLDs that are marketed/used as generic vanity TLDs, so their presence does
 * NOT indicate the owner's country. We abstain on these.
 */
export const GENERIC_CCTLDS = new Set([
  "io", "co", "me", "tv", "ai", "cc", "to", "fm", "ws", "gg", "sh",
  "la", "ly", "gl", "gs", "nu", "ac", "st", "ms", "mn", "im",
]);

/**
 * Return the ISO-3166 alpha-2 country a domain's ccTLD implies, or null when the
 * TLD is generic, non-country, or gives no country signal.
 */
export function ccTLDCountry(domain: string): string | null {
  const labels = domain.toLowerCase().split(".");
  const last = labels[labels.length - 1];
  if (!last || last.length !== 2) return null; // gTLD (.com/.net/.io-style handled below by length!=2 → e.g. "com")
  if (GENERIC_CCTLDS.has(last)) return null;
  const cc = CCTLD_ALIAS[last] ?? last.toUpperCase();
  return isCountry(cc) ? cc : null;
}
