import type { DnsRecords } from "./dns";
import type { ProviderRule } from "./types";

export type Confidence = "high" | "medium" | "none";

export interface MatchOutcome {
  providerId: string;
  provider: string;
  category: string;
  color: string;
  matchedBy: "domain" | "mx" | "ns" | "none";
  /** The specific pattern that matched, e.g. "privateemail.com". */
  matchedPattern?: string;
  /** The actual MX/NS host that contained the pattern (the evidence). */
  evidence?: string;
  /** MX evidence = high, NS-only = medium, no match = none. */
  confidence: Confidence;
}

/** Synthetic buckets for domains that don't match any provider rule. */
export const UNMATCHED_MX: MatchOutcome = {
  providerId: "__other_mail__",
  provider: "Other / Unknown Mail Host",
  category: "Unknown",
  color: "#8a8aa0",
  matchedBy: "none",
  confidence: "none",
};

export const NO_MAIL: MatchOutcome = {
  providerId: "__no_mail__",
  provider: "No Mail (no MX record)",
  category: "None",
  color: "#4b4b63",
  matchedBy: "none",
  confidence: "none",
};

/** Return the first (host, pattern) pair where a host contains a pattern. */
function firstMatch(
  haystacks: string[],
  needles: string[]
): { host: string; pattern: string } | null {
  for (const host of haystacks) {
    for (const pattern of needles) {
      if (pattern && host.includes(pattern)) return { host, pattern };
    }
  }
  return null;
}

/**
 * Match a domain's DNS records against provider rules.
 *
 * MX evidence is preferred over NS (mail host is more specific than DNS host),
 * and higher `priority` wins among same-evidence matches. NS-only matches act
 * as a medium-confidence fallback — e.g. a parked domain on Namecheap
 * nameservers still sorts to Namecheap before mail is configured.
 */
export function matchDomain(
  records: DnsRecords,
  rules: ProviderRule[],
  domain?: string
): MatchOutcome {
  // Domain-literal match wins outright: the domain IS a known provider domain.
  if (domain) {
    let best: ProviderRule | null = null;
    for (const rule of rules) {
      if (!rule.domainPatterns?.length) continue;
      const hit = rule.domainPatterns.some((p) => domain === p || domain.endsWith("." + p));
      if (hit && (!best || rule.priority > best.priority)) best = rule;
    }
    if (best) {
      return {
        providerId: best.id,
        provider: best.name,
        category: best.category,
        color: best.color,
        matchedBy: "domain",
        matchedPattern: domain,
        evidence: "domain name",
        confidence: "high",
      };
    }
  }

  let bestMx: { rule: ProviderRule; host: string; pattern: string } | null = null;
  let bestNs: { rule: ProviderRule; host: string; pattern: string } | null = null;

  for (const rule of rules) {
    if (rule.matchOn !== "ns" && rule.mxPatterns.length) {
      const hit = firstMatch(records.mx, rule.mxPatterns);
      if (hit && (!bestMx || rule.priority > bestMx.rule.priority)) {
        bestMx = { rule, host: hit.host, pattern: hit.pattern };
      }
    }
    if (rule.matchOn !== "mx" && rule.nsPatterns.length) {
      const hit = firstMatch(records.ns, rule.nsPatterns);
      if (hit && (!bestNs || rule.priority > bestNs.rule.priority)) {
        bestNs = { rule, host: hit.host, pattern: hit.pattern };
      }
    }
  }

  const chosen = bestMx ?? bestNs;
  if (chosen) {
    return {
      providerId: chosen.rule.id,
      provider: chosen.rule.name,
      category: chosen.rule.category,
      color: chosen.rule.color,
      matchedBy: bestMx ? "mx" : "ns",
      matchedPattern: chosen.pattern,
      evidence: chosen.host,
      confidence: bestMx ? "high" : "medium",
    };
  }

  return records.mx.length ? UNMATCHED_MX : NO_MAIL;
}
