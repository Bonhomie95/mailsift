"use client";

import { useCallback, useEffect, useState } from "react";

export const FREE_SESSION_LIMIT = 20_000;
export const QUOTA_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

const USED_KEY = "mailsift-quota-used";
const START_KEY = "mailsift-quota-window-start";

interface QuotaState {
  used: number;
  windowStart: number | null;
}

function read(): QuotaState {
  const used = Number(localStorage.getItem(USED_KEY) || 0);
  const startRaw = localStorage.getItem(START_KEY);
  const windowStart = startRaw ? Number(startRaw) : null;
  return { used, windowStart };
}

/**
 * Free-tier quota: 20,000 domains per rolling 6-hour window, where the window
 * starts on first use and resets 6 hours later — whether or not the 20k was
 * reached. Client-side (honor system) until accounts exist; the server also
 * caps each request and can enforce a per-IP window as a backstop.
 */
export function useSessionQuota() {
  const [used, setUsed] = useState(0);
  const [resetAt, setResetAt] = useState<number | null>(null);

  const refresh = useCallback(() => {
    const { used, windowStart } = read();
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
  }, []);

  useEffect(() => {
    refresh();
    // Re-check periodically so the window can expire while the tab is open.
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  const add = useCallback((n: number) => {
    const now = Date.now();
    const { used, windowStart } = read();
    let start = windowStart;
    let base = used;
    if (!start || now - start >= QUOTA_WINDOW_MS) {
      // Start a fresh 6-hour window on first use (or after expiry).
      start = now;
      base = 0;
      localStorage.setItem(START_KEY, String(start));
    }
    const next = base + n;
    localStorage.setItem(USED_KEY, String(next));
    setUsed(next);
    setResetAt(start + QUOTA_WINDOW_MS);
  }, []);

  const remaining = Math.max(0, FREE_SESSION_LIMIT - used);
  return { used, remaining, limit: FREE_SESSION_LIMIT, resetAt, add };
}
