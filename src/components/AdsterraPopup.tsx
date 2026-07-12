"use client";

import { useEffect } from "react";

const POPUP_TS_KEY = "mailsift-ad-popup-ts";
const THIRTY_MIN_MS = 30 * 60 * 1000;

/**
 * Adsterra Popunder / Social Bar, capped to at most once per 30 minutes.
 *
 * We enforce the cap by only injecting the ad script when 30 minutes have
 * elapsed since the last time (tracked in localStorage). Set
 * NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC to the invoke.js URL from your Adsterra
 * Popunder unit. With nothing set, this renders nothing.
 *
 * Note: the actual pop fires on user interaction and Adsterra also applies its
 * own capping in the dashboard — set that to match (e.g. 1 per 30 min) as a
 * belt-and-braces backup.
 */
export default function AdsterraPopup() {
  useEffect(() => {
    const src = process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC;
    if (!src) return;

    const last = Number(localStorage.getItem(POPUP_TS_KEY) || 0);
    if (Date.now() - last < THIRTY_MIN_MS) return;

    const s = document.createElement("script");
    s.src = src.startsWith("http") || src.startsWith("//") ? src : `//${src}`;
    s.async = true;
    s.dataset.mailsiftAd = "popunder";
    document.body.appendChild(s);
    localStorage.setItem(POPUP_TS_KEY, String(Date.now()));

    return () => {
      s.remove();
    };
  }, []);

  return null;
}
