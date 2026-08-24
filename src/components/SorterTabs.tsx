"use client";

import { useState } from "react";
import Sorter from "./Sorter";
import CountrySorter from "./CountrySorter";
import CredentialSorter from "./CredentialSorter";

type Tab = "mail" | "country" | "login";

const TABS: { id: Tab; label: string; icon: string; blurb: string }[] = [
  { id: "mail", label: "Mail Sorter", icon: "📬", blurb: "Sort by mail provider & registrar" },
  { id: "country", label: "Country Sorter", icon: "🌍", blurb: "Sort by country, timezone & best send time" },
  { id: "login", label: "Login Sorter", icon: "🔐", blurb: "Reformat email + password lists to email:password" },
];

export default function SorterTabs() {
  const [tab, setTab] = useState<Tab>("mail");
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
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
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

      {tab === "mail" ? <Sorter /> : tab === "country" ? <CountrySorter /> : <CredentialSorter />}
    </div>
  );
}
