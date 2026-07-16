"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const KEY = "mailsift-theme";

/**
 * Dark/light switch. The initial theme is applied by an inline script in
 * layout.tsx (before paint) to avoid a flash; this component just keeps the
 * button in sync and persists the choice.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode — theme just won't persist */
    }
  }

  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="rounded-lg border border-fg/15 bg-fg/5 px-2 py-1 text-sm hover:bg-fg/10"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
