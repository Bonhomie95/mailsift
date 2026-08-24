"use client";

import { useEffect, useState } from "react";
import Sorter from "./Sorter";
import CountrySorter from "./CountrySorter";
import CredentialSorter from "./CredentialSorter";
import Spinner from "./Spinner";

type Tab = "mail" | "country" | "login";

const TABS: { id: Tab; label: string; icon: string; blurb: string }[] = [
  { id: "mail", label: "Mail Sorter", icon: "📬", blurb: "Sort by mail provider & registrar" },
  { id: "country", label: "Country Sorter", icon: "🌍", blurb: "Sort by country, timezone & best send time" },
  { id: "login", label: "Login Sorter", icon: "🔐", blurb: "Reformat email + password lists to email:password" },
];

export default function SorterTabs() {
  const [tab, setTab] = useState<Tab>("mail");
  // Until the client has mounted, the tools can't be interacted with, so we show
  // a loading spinner. On the server (and the first client paint) this renders,
  // then swaps to the live tool once React hydrates — giving users a visible
  // "loading" cue during the JS download/parse.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Sorter mode"
          className="inline-flex rounded-xl border border-fg/10 bg-fg/[0.03] p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              disabled={!mounted}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
                tab === t.id
                  ? "bg-gradient-to-r from-brand-500 to-indigo-500 text-white shadow-lg shadow-brand-500/20"
                  : "text-fg/50 hover:text-fg/80"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-fg/40">{active.blurb}</p>
      </div>

      {!mounted ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-fg/10 bg-ink-800/60 text-fg/40 backdrop-blur">
          <Spinner className="h-7 w-7 text-brand-400 light:text-brand-600" />
          <span className="text-sm">Loading {active.label}…</span>
        </div>
      ) : tab === "mail" ? (
        <Sorter />
      ) : tab === "country" ? (
        <CountrySorter />
      ) : (
        <CredentialSorter />
      )}
    </div>
  );
}
