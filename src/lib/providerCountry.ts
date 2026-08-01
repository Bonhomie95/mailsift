/**
 * Provider → country signal.
 *
 * The provider seed already encodes each regional provider's country as a
 * "(CC)" suffix on its `category` (e.g. "Orange (FR)", "Tencent (CN)",
 * "Seznam (CZ)"). Rather than maintain a parallel map, we read that suffix — so
 * every provider added to the seed contributes a country signal for free.
 *
 * Global providers (Google, Microsoft, Zoho, Proton, security gateways) have no
 * "(CC)" suffix and correctly contribute nothing.
 */

import { isCountry } from "./countries";

/** Category suffixes use "UK", which isn't ISO-3166; the country is GB. */
const ALIAS: Record<string, string> = { UK: "GB" };

/**
 * Providers that carry a country suffix but are used by consumers WORLDWIDE, so
 * their country would mislead (a yahoo.com or mail.com address says nothing
 * about where the person is). These abstain.
 */
const GLOBAL_WEBMAIL = new Set(["yahoo-aol", "mailcom"]);

/**
 * Country implied by a matched provider, or null. Pass the matched provider's
 * `providerId` and `category` (both already returned by `matchDomain`).
 */
export function providerCountry(providerId: string, category: string): string | null {
  if (GLOBAL_WEBMAIL.has(providerId)) return null;
  const m = category.match(/\(([A-Za-z]{2})\)\s*$/);
  if (!m) return null;
  const cc = ALIAS[m[1].toUpperCase()] ?? m[1].toUpperCase();
  return isCountry(cc) ? cc : null;
}
