"use client";

import { useEffect, useState } from "react";

/**
 * Enforce a single active MailSift tab (free-tier rule).
 *
 * Uses a BroadcastChannel handshake: a new tab announces itself; if an existing
 * tab replies "I'm here", the new tab marks itself blocked. Falls back to a
 * localStorage heartbeat when BroadcastChannel is unavailable.
 */
export function useSingleTab(): { blocked: boolean } {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const id = Math.random().toString(36).slice(2);

    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel("mailsift-tabs");
      let alive = true;

      ch.onmessage = (e: MessageEvent) => {
        const msg = e.data as { type: string; from: string };
        if (msg.from === id) return;
        if (msg.type === "hello") {
          // Someone new arrived — tell them we're already here.
          ch.postMessage({ type: "here", from: id });
        } else if (msg.type === "here" && alive) {
          // An older tab exists; we're the newcomer -> block ourselves.
          setBlocked(true);
        }
      };

      ch.postMessage({ type: "hello", from: id });
      return () => {
        alive = false;
        ch.close();
      };
    }

    // Fallback: heartbeat in localStorage.
    const KEY = "mailsift-tab-heartbeat";
    const now = Date.now();
    const prev = Number(localStorage.getItem(KEY) || 0);
    if (prev && now - prev < 4000) setBlocked(true);
    const timer = setInterval(() => localStorage.setItem(KEY, String(Date.now())), 2000);
    localStorage.setItem(KEY, String(now));
    return () => clearInterval(timer);
  }, []);

  return { blocked };
}
