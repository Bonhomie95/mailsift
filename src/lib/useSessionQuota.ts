"use client";

import { useCallback, useEffect, useState } from "react";

export const FREE_SESSION_LIMIT = 50_000;
export const QUOTA_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
/** Short label for the tier, shown in the UI (keep in sync with the two above). */
export const QUOTA_LABEL = "50k / 3h";

/**
 * Each sorter tracks its OWN quota so the two tools are independent — using up
 * the Mail Sorter's allowance doesn't touch the Country Sorter's, and vice
 * versa. The scope namespaces the localStorage keys.
 */
export type QuotaScope = "mail" | "country";

function keysFor(scope: QuotaScope) {
  return {
    USED_KEY: `mailsift-quota-${scope}-used`,
    START_KEY: `mailsift-quota-${scope}-window-start`,
  };
}

interface QuotaState {
  used: number;
  windowStart: number | null;
}

function read(USED_KEY: string, START_KEY: string): QuotaState {
  const used = Number(localStorage.getItem(USED_KEY) || 0);
  const startRaw = localStorage.getItem(START_KEY);
  const windowStart = startRaw ? Number(startRaw) : null;
  return { used, windowStart };
}

/**
 * Free-tier quota: 50,000 domains per rolling 3-hour window, where the window
 * starts on first use and resets 3 hours later — whether or not the 50k was
 * reached. Client-side (honor system) until accounts exist; the server also
 * caps each request and can enforce a per-IP window as a backstop.
 *
 * `scope` keeps each sorter's usage separate (see QuotaScope).
 */
export function useSessionQuota(scope: QuotaScope) {
  const { USED_KEY, START_KEY } = keysFor(scope);
  const [used, setUsed] = useState(0);
  const [resetAt, setResetAt] = useState<number | null>(null);

  const refresh = useCallback(() => {
    const { used, windowStart } = read(USED_KEY, START_KEY);
    if (!windowStart || Date.now() - windowStart >= QUOTA_WINDOW_MS) {
      // No active window, or it has expired → reset.
      if (windowStart) {
        localStorage.removeItem(USED_KEY);
        localStorage.removeItem(START_KEY);
      }
      setUsed(0);
      setResetAt(null);
    } else {
      setUsed(used);
      setResetAt(windowStart + QUOTA_WINDOW_MS);
    }
  }, [USED_KEY, START_KEY]);

  useEffect(() => {
    refresh();
    // Re-check periodically so the window can expire while the tab is open.
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  const add = useCallback(
    (n: number) => {
      const now = Date.now();
      const { used, windowStart } = read(USED_KEY, START_KEY);
      let start = windowStart;
      let base = used;
      if (!start || now - start >= QUOTA_WINDOW_MS) {
        // Start a fresh 3-hour window on first use (or after expiry).
        start = now;
        base = 0;
        localStorage.setItem(START_KEY, String(start));
      }
      const next = base + n;
      localStorage.setItem(USED_KEY, String(next));
      setUsed(next);
      setResetAt(start + QUOTA_WINDOW_MS);
    },
    [USED_KEY, START_KEY]
  );

  const remaining = Math.max(0, FREE_SESSION_LIMIT - used);
  return { used, remaining, limit: FREE_SESSION_LIMIT, resetAt, add };
}
