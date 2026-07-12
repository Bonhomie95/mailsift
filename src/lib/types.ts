export type MatchOn = "mx" | "ns" | "both";

export interface ProviderRule {
  /** Stable id/slug, e.g. "google-workspace" */
  id: string;
  /** Display name shown as the bucket label, e.g. "Google Workspace" */
  name: string;
  /** Broad grouping used for coloring/sections, e.g. "Google", "Microsoft", "Namecheap" */
  category: string;
  /** Which DNS records this rule inspects */
  matchOn: MatchOn;
  /**
   * Lowercased substrings tested against MX hostnames.
   * A domain matches if ANY mx hostname contains ANY of these.
   */
  mxPatterns: string[];
  /** Lowercased substrings tested against NS hostnames. */
  nsPatterns: string[];
  /**
   * Exact domains this provider owns (e.g. "foxmail.com"). Matched against the
   * domain itself, not its DNS — for consumer webmail that shares mail infra
   * with a sibling brand (foxmail.com uses QQ's MX, so only the domain name
   * separates them). Highest-priority signal. Code-only (not admin-editable).
   */
  domainPatterns?: string[];
  /** Higher wins when multiple providers match. Default 0. */
  priority: number;
  /** Hex color for the bucket chip. */
  color: string;
  /** Optional emoji/short icon. */
  icon?: string;
}

export interface DomainResult {
  /** Normalized domain, e.g. "hinet.net" */
  domain: string;
  /** Original inputs (emails/domains) that resolved to this domain. */
  inputs: string[];
  /** Matched provider id, or a synthetic bucket id. */
  providerId: string;
  /** Matched provider display name, or synthetic bucket label. */
  provider: string;
  category: string;
  color: string;
  /** "mx" | "ns" | "none" — what the match was based on. */
  matchedBy: "mx" | "ns" | "none";
  mx: string[];
  ns: string[];
  error?: string;
}

export interface SortSummaryBucket {
  providerId: string;
  provider: string;
  category: string;
  color: string;
  count: number;
}
