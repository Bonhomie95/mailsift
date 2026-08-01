/**
 * Country detection by weighted vote.
 *
 * Several cheap signals each cast a weighted vote for an ISO-3166 country; the
 * highest total wins (the owner's "3–5 criteria, then the country we find").
 * All signals are free — derived from DNS records we already fetch, the domain
 * name, the matched provider, and an offline IP table.
 *
 *   ccTLD    (5) — strongest: the domain's own country-code TLD
 *   provider (4) — regional mail provider implies a country (Orange → FR)
 *   IP geo   (3) — the domain's A-record IP, looked up offline
 *   host TLD (2) — ccTLD of an MX / NS hostname (ns1.host.de → DE)
 *
 * Confidence: high when the winner is backed by ccTLD / provider / IP,
 * medium when only host-TLD, none when nothing fired (→ Unknown bucket).
 */

import type { DnsRecords } from "./dns";
import type { CountryResult, CountrySignal } from "./types";
import { ccTLDCountry } from "./ccTLD";
import { providerCountry } from "./providerCountry";

const WEIGHT = { cctld: 5, provider: 4, ip: 3, host: 2 } as const;

export interface CountryInputs {
  domain: string;
  records: DnsRecords;
  /** From matchDomain(): the matched provider's id + category. */
  providerId: string;
  category: string;
  /** ISO country from the offline IP table, or null (signal absent/abstains). */
  ipCountry?: string | null;
}

/** Gather every signal that fired for a domain (order = priority for ties). */
export function collectSignals(inp: CountryInputs): CountrySignal[] {
  const signals: CountrySignal[] = [];

  const cc = ccTLDCountry(inp.domain);
  if (cc) {
    const tld = inp.domain.slice(inp.domain.lastIndexOf("."));
    signals.push({ source: "cctld", country: cc, weight: WEIGHT.cctld, evidence: tld });
  }

  const pc = providerCountry(inp.providerId, inp.category);
  if (pc) signals.push({ source: "provider", country: pc, weight: WEIGHT.provider, evidence: inp.category });

  if (inp.ipCountry) {
    signals.push({ source: "ip", country: inp.ipCountry, weight: WEIGHT.ip, evidence: "A-record IP" });
  }

  // Host TLD: first MX (then NS) host that sits on a ccTLD.
  for (const host of [...inp.records.mx, ...inp.records.ns]) {
    const hc = ccTLDCountry(host);
    if (hc) {
      signals.push({ source: "host", country: hc, weight: WEIGHT.host, evidence: host });
      break;
    }
  }

  return signals;
}

/** Score the signals and return the winning country result. */
export function scoreCountry(inp: CountryInputs): CountryResult {
  const signals = collectSignals(inp);
  const base = { domain: inp.domain, signals, mx: inp.records.mx, ns: inp.records.ns };

  if (signals.length === 0) {
    return { ...base, country: null, confidence: "none", matchedBy: "none" };
  }

  // Sum weights per country; keep the highest-weight signal per country as its
  // representative for the "matchedBy" of the winner.
  const totals = new Map<string, number>();
  for (const s of signals) totals.set(s.country, (totals.get(s.country) ?? 0) + s.weight);

  let winner = signals[0].country;
  let best = -1;
  for (const [country, total] of totals) {
    if (total > best) {
      best = total;
      winner = country;
    }
  }

  // The strongest single signal backing the winning country decides matchedBy.
  const backing = signals
    .filter((s) => s.country === winner)
    .sort((a, b) => b.weight - a.weight)[0];

  const confidence: CountryResult["confidence"] =
    backing.source === "host" ? "medium" : "high";

  return { ...base, country: winner, confidence, matchedBy: backing.source };
}
