"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseText } from "@/lib/parse";
import { useSingleTab } from "@/lib/useSingleTab";
import { useSessionQuota, FREE_SESSION_LIMIT } from "@/lib/useSessionQuota";

interface Result {
  domain: string;
  providerId: string;
  provider: string;
  category: string;
  color: string;
  matchedBy: "domain" | "mx" | "ns" | "none";
  matchedPattern?: string;
  evidence?: string;
  confidence?: "high" | "medium" | "none";
  hasSpf?: boolean;
  hasDmarc?: boolean;
  mx: string[];
  ns: string[];
}

interface HistoryEntry {
  id: string;
  ts: number;
  count: number;
  top: string;
  topColor: string;
  results: Result[];
  text: string;
}

const RESUME_KEY = "mailsift-last-sort";
const RESUME_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24h

interface RegInfo {
  registrarId: string;
  registrar: string;
  registrarRaw: string | null;
  color: string;
}

interface Bucket {
  id: string;
  label: string;
  color: string;
  domains: string[];
}

type Dimension = "provider" | "registrar";

const CHUNK = 1000; // domains per streaming request (keeps each under the timeout)
const REG_CHUNK = 250;
const HISTORY_KEY = "mailsift-history";
const HISTORY_MAX = 8;

async function readFileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const isSheet = /\.(xlsx|xls|xlsm|ods)$/.test(name);
  if (!isSheet) return file.text();
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames) parts.push(XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]));
  return parts.join("\n");
}

function formatCountdown(target: number): string {
  const ms = Math.max(0, target - Date.now());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "<1m";
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Sorter() {
  const { blocked } = useSingleTab();
  const quota = useSessionQuota();

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [dimension, setDimension] = useState<Dimension>("provider");
  const [regByDomain, setRegByDomain] = useState<Record<string, RegInfo>>({});
  const [regBusy, setRegBusy] = useState(false);
  const [regProgress, setRegProgress] = useState<{ done: number; total: number } | null>(null);
  const [restoredNote, setRestoredNote] = useState<string | null>(null);
  const [bucketFilter, setBucketFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deliverability, setDeliverability] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Restore the previous sort on load so a refresh doesn't lose a big run.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESUME_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        text: string;
        results: Result[];
        regByDomain: Record<string, RegInfo>;
        dimension: Dimension;
        ts: number;
      };
      if (!saved.results?.length || Date.now() - saved.ts > RESUME_MAX_AGE_MS) return;
      setText(saved.text || "");
      setResults(saved.results);
      setRegByDomain(saved.regByDomain || {});
      setDimension(saved.dimension || "provider");
      setRestoredNote(
        `Restored your last sort of ${saved.results.length.toLocaleString()} domains from ${new Date(
          saved.ts
        ).toLocaleString()}.`
      );
    } catch {
      /* ignore corrupt/oversized state */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load recent-sorts history once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function pushHistory(res: Result[], srcText: string) {
    if (!res.length) return;
    const counts = new Map<string, { n: number; color: string }>();
    for (const r of res) {
      const c = counts.get(r.provider) ?? { n: 0, color: r.color };
      c.n++;
      counts.set(r.provider, c);
    }
    const top = [...counts.entries()].sort((a, b) => b[1].n - a[1].n)[0];
    const entry: HistoryEntry = {
      id: Math.random().toString(36).slice(2),
      ts: Date.now(),
      count: res.length,
      top: top?.[0] ?? "—",
      topColor: top?.[1].color ?? "#6d5efc",
      results: res,
      text: srcText,
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, HISTORY_MAX);
      // Trim oldest entries until it fits in localStorage.
      for (let keep = next.length; keep >= 1; keep--) {
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, keep)));
          return next.slice(0, keep);
        } catch {
          /* too big — try fewer */
        }
      }
      return next;
    });
  }

  function restoreHistory(entry: HistoryEntry) {
    setText(entry.text);
    setResults(entry.results);
    setRegByDomain({});
    setDimension("provider");
    setActiveBucket(null);
    setShowHistory(false);
    setRestoredNote(`Loaded a sort of ${entry.count.toLocaleString()} domains from ${new Date(entry.ts).toLocaleString()}.`);
  }

  function persistSort(res: Result[], reg: Record<string, RegInfo>, dim: Dimension, srcText: string) {
    try {
      localStorage.setItem(
        RESUME_KEY,
        JSON.stringify({ text: srcText, results: res, regByDomain: reg, dimension: dim, ts: Date.now() })
      );
    } catch {
      // Likely over the storage quota on a very large sort — skip silently.
    }
  }

  const parsed = useMemo(() => parseText(text), [text]);
  const resultByDomain = useMemo(() => {
    const m: Record<string, Result> = {};
    for (const r of results) m[r.domain] = r;
    return m;
  }, [results]);

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    for (const r of results) {
      let id: string, label: string, color: string;
      if (dimension === "provider") {
        id = r.providerId;
        label = r.provider;
        color = r.color;
      } else {
        const reg = regByDomain[r.domain];
        if (!reg) continue; // registrar not loaded yet
        id = reg.registrarId;
        label = reg.registrar;
        color = reg.color;
      }
      let b = map.get(id);
      if (!b) {
        b = { id, label, color, domains: [] };
        map.set(id, b);
      }
      b.domains.push(r.domain);
    }
    return [...map.values()].sort((a, b) => b.domains.length - a.domains.length);
  }, [results, dimension, regByDomain]);

  const sortedCount = useMemo(
    () => buckets.reduce((n, b) => n + b.domains.length, 0),
    [buckets]
  );

  // Filter the bucket list by label (handy when there are dozens of providers).
  const visibleBuckets = useMemo(() => {
    const q = bucketFilter.trim().toLowerCase();
    if (!q) return buckets;
    return buckets.filter((b) => b.label.toLowerCase().includes(q));
  }, [buckets, bucketFilter]);

  // Analytics for the Insights panel.
  const insights = useMemo(() => {
    if (!results.length) return null;
    let mx = 0,
      ns = 0,
      none = 0,
      noMail = 0,
      spf = 0,
      dmarc = 0,
      delivChecked = 0;
    for (const r of results) {
      if (r.matchedBy === "mx" || r.matchedBy === "domain") mx++;
      else if (r.matchedBy === "ns") ns++;
      else none++;
      if (r.providerId === "__no_mail__") noMail++;
      if (r.hasSpf !== undefined || r.hasDmarc !== undefined) {
        delivChecked++;
        if (r.hasSpf) spf++;
        if (r.hasDmarc) dmarc++;
      }
    }
    const top = buckets[0];
    const bigThree = results.filter((r) =>
      ["google-workspace", "microsoft-365"].includes(r.providerId)
    ).length;
    const inputTokens = parsed.total;
    return {
      inputTokens,
      unique: results.length,
      dedupPct: inputTokens ? Math.round((1 - results.length / inputTokens) * 100) : 0,
      providerCount: buckets.length,
      top,
      topPct: top && sortedCount ? Math.round((top.domains.length / sortedCount) * 100) : 0,
      mx,
      ns,
      matchedPct: results.length ? Math.round(((mx + ns) / results.length) * 100) : 0,
      none,
      noMail,
      bigThreePct: results.length ? Math.round((bigThree / results.length) * 100) : 0,
      delivChecked,
      spfPct: delivChecked ? Math.round((spf / delivChecked) * 100) : 0,
      dmarcPct: delivChecked ? Math.round((dmarc / delivChecked) * 100) : 0,
    };
  }, [results, buckets, sortedCount, parsed.total]);

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    try {
      const content = await readFileToText(file);
      setText((prev) => (prev ? prev + "\n" + content : content));
    } catch {
      setError("Could not read that file. Try CSV, TXT, or XLSX.");
    }
  }

  async function fetchRegistrars(domains: string[]) {
    const missing = domains.filter((d) => !regByDomain[d]);
    if (missing.length === 0) return;
    setRegBusy(true);
    setRegProgress({ done: 0, total: missing.length });
    const acc: Record<string, RegInfo> = {};
    try {
      for (let i = 0; i < missing.length; i += REG_CHUNK) {
        const slice = missing.slice(i, i + REG_CHUNK);
        const res = await fetch("/api/registrar", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ domains: slice }),
        });
        if (!res.ok) throw new Error("Registrar lookup failed.");
        const j = (await res.json()) as { results: (RegInfo & { domain: string })[] };
        for (const row of j.results)
          acc[row.domain] = {
            registrarId: row.registrarId,
            registrar: row.registrar,
            registrarRaw: row.registrarRaw,
            color: row.color,
          };
        setRegByDomain((prev) => ({ ...prev, ...acc }));
        setRegProgress({ done: Math.min(i + REG_CHUNK, missing.length), total: missing.length });
      }
      // Update the saved session so registrar data survives a refresh too.
      persistSort(results, { ...regByDomain, ...acc }, "registrar", text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registrar lookup failed.");
    } finally {
      setRegBusy(false);
      setRegProgress(null);
    }
  }

  function switchDimension(next: Dimension) {
    setDimension(next);
    setActiveBucket(null);
    if (next === "registrar" && results.length) fetchRegistrars(results.map((r) => r.domain));
  }

  async function runSort() {
    setError(null);
    if (blocked) {
      setError("MailSift is already open in another tab. Close it to sort here.");
      return;
    }
    const domains = parsed.domains;
    if (domains.length === 0) {
      setError("No valid domains or emails found. Paste a list or upload a file.");
      return;
    }
    if (domains.length > quota.remaining) {
      setError(
        `That's ${domains.length.toLocaleString()} domains but you only have ${quota.remaining.toLocaleString()} left this session (free limit ${FREE_SESSION_LIMIT.toLocaleString()}).`
      );
      return;
    }

    setBusy(true);
    setResults([]);
    setRegByDomain({});
    setActiveBucket(null);
    setProgress({ done: 0, total: domains.length });

    const collected: Result[] = [];
    // Repaint at most ~every 70ms so results appear one-by-one as they stream
    // in, without thrashing React on huge lists.
    let lastFlush = 0;
    const flush = (force = false) => {
      const now = performance.now();
      if (force || now - lastFlush >= 70) {
        setResults([...collected]);
        lastFlush = now;
      }
    };

    try {
      for (let i = 0; i < domains.length; i += CHUNK) {
        const slice = domains.slice(i, i + CHUNK);
        const res = await fetch("/api/sort", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ domains: slice, deliverability }),
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Server error (${res.status}).`);
        }

        // Read NDJSON: one result per line, painted as it streams in.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            let obj: Result & { done?: boolean };
            try {
              obj = JSON.parse(line);
            } catch {
              continue;
            }
            if (obj.done) continue; // summary marker
            collected.push(obj);
            setProgress({ done: collected.length, total: domains.length });
            flush();
          }
        }
        flush(true); // ensure this chunk is fully painted
      }
      quota.add(domains.length);
      setRestoredNote(null);
      persistSort(collected, regByDomain, dimension, text);
      pushHistory(collected, text);
      if (dimension === "registrar") fetchRegistrars(collected.map((r) => r.domain));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function exportAll() {
    const rows: string[][] = [
      ["input", "domain", "mail_provider", "confidence", "matched_by", "matched_pattern", "spf", "dmarc", "mx", "ns", "registrar"],
    ];
    for (const r of results) {
      const reg = regByDomain[r.domain];
      // One row per original input (full email, never truncated).
      for (const input of originalsFor(r.domain)) {
        rows.push([
          input,
          r.domain,
          r.provider,
          r.confidence ?? "",
          r.matchedBy,
          r.matchedPattern ?? "",
          r.hasSpf === undefined ? "" : r.hasSpf ? "yes" : "no",
          r.hasDmarc === undefined ? "" : r.hasDmarc ? "yes" : "no",
          r.mx.join(" | "),
          r.ns.join(" | "),
          reg?.registrar ?? "",
        ]);
      }
    }
    downloadCsv("mailsift-all.csv", rows);
  }

  // Expand a domain back to the exact emails/domains the user entered for it
  // (never truncated). Falls back to the domain if it was entered bare.
  function originalsFor(domain: string): string[] {
    const o = parsed.originals[domain];
    return o && o.length ? o : [domain];
  }

  function exportBucket(b: Bucket) {
    const rows: string[][] = [["input", "domain", "mail_provider", "registrar", "mx", "ns"]];
    for (const domain of b.domains) {
      const r = resultByDomain[domain];
      const reg = regByDomain[domain];
      for (const input of originalsFor(domain)) {
        rows.push([input, domain, r?.provider ?? "", reg?.registrar ?? "", r?.mx.join(" | ") ?? "", r?.ns.join(" | ") ?? ""]);
      }
    }
    downloadCsv(`mailsift-${b.id.replace(/[^a-z0-9]+/gi, "-")}.csv`, rows);
  }

  function downloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Download exactly what the user submitted (their raw input, untouched).
  function downloadInput() {
    downloadText("mailsift-input.txt", text);
  }

  // Emails-only exports (just the addresses, one per line — no other columns).
  function exportEmailsAll() {
    downloadText("mailsift-emails.txt", results.flatMap((r) => originalsFor(r.domain)).join("\n"));
  }
  function exportBucketEmails(b: Bucket) {
    downloadText(
      `mailsift-${b.id.replace(/[^a-z0-9]+/gi, "-")}-emails.txt`,
      b.domains.flatMap((d) => originalsFor(d)).join("\n")
    );
  }

  // Professional export: an .xlsx workbook with a Summary sheet + all results.
  async function exportXlsx() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const summary = [[dimLabel, "Count", "Share %"]];
    for (const b of buckets)
      summary.push([b.label, String(b.domains.length), String(sortedCount ? Math.round((b.domains.length / sortedCount) * 100) : 0)]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

    const rows = [["input", "domain", "mail_provider", "confidence", "matched_by", "matched_pattern", "spf", "dmarc", "mx", "ns", "registrar"]];
    for (const r of results) {
      const reg = regByDomain[r.domain];
      for (const input of originalsFor(r.domain)) {
        rows.push([
          input, r.domain, r.provider, r.confidence ?? "", r.matchedBy, r.matchedPattern ?? "",
          r.hasSpf === undefined ? "" : r.hasSpf ? "yes" : "no",
          r.hasDmarc === undefined ? "" : r.hasDmarc ? "yes" : "no",
          r.mx.join(" | "), r.ns.join(" | "), reg?.registrar ?? "",
        ]);
      }
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Results");
    XLSX.writeFile(wb, "mailsift-report.xlsx");
  }

  async function copyBucketDomains(b: Bucket) {
    // Copy the full emails/domains the user entered — not truncated to domains.
    const lines = b.domains.flatMap((d) => originalsFor(d));
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedId(b.id);
      setTimeout(() => setCopiedId((c) => (c === b.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  const shown = activeBucket ? buckets.find((b) => b.id === activeBucket) : null;
  const dimLabel = dimension === "provider" ? "Providers" : "Registrars";

  // Live quota: while sorting, count down as domains resolve (committed at the end).
  const liveDone = busy && progress ? progress.done : 0;
  const liveUsed = Math.min(quota.limit, quota.used + liveDone);
  const liveRemaining = Math.max(0, quota.remaining - liveDone);

  return (
    <div className="space-y-6">
      {blocked && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          ⚠️ MailSift is already open in another tab. On the free plan you can only sort in one tab at
          a time. Close the other tab, then reload here.
        </div>
      )}

      {restoredNote && (
        <div className="flex items-center justify-between rounded-xl border border-brand-400/30 bg-brand-500/10 px-4 py-2.5 text-sm text-brand-400">
          <span>↩ {restoredNote}</span>
          <button
            onClick={() => {
              localStorage.removeItem(RESUME_KEY);
              setResults([]);
              setRegByDomain({});
              setText("");
              setRestoredNote(null);
            }}
            className="text-xs text-white/50 hover:text-white/80"
          >
            Clear
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-ink-800/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="text-xs font-medium text-white/60 hover:text-white/90"
            >
              🕘 Recent sorts ({history.length}) {showHistory ? "▾" : "▸"}
            </button>
            {showHistory && (
              <button
                onClick={() => {
                  localStorage.removeItem(HISTORY_KEY);
                  setHistory([]);
                }}
                className="ml-auto text-xs text-white/40 hover:text-white/70"
              >
                Clear history
              </button>
            )}
          </div>
          {showHistory && (
            <div className="mt-2 flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => restoreHistory(h)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.07]"
                  title={new Date(h.ts).toLocaleString()}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: h.topColor }} />
                  {h.count.toLocaleString()} domains · top {h.top}
                  <span className="text-white/30">{new Date(h.ts).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Input */}
        <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">Your list</h2>
            <span className="text-xs text-white/40">
              {parsed.domains.length.toLocaleString()} unique · {parsed.invalid} skipped
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`relative rounded-xl border-2 border-dashed transition ${
              dragOver ? "border-brand-400 bg-brand-500/10" : "border-white/10"
            }`}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Paste domains or emails here...\n\njoseph@bonhomieinc.dev, acme.com; example.org\nfoo.io  bar.net"}
              className="h-56 w-full resize-none rounded-xl bg-transparent p-4 text-sm text-white/90 outline-none placeholder:text-white/25"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              📎 Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.tsv,.xls,.xlsx,.xlsm,.ods,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            {text && (
              <button
                onClick={downloadInput}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                ⬇ Download input
              </button>
            )}
            {fileName && <span className="text-xs text-white/40">Loaded: {fileName}</span>}
            {text && (
              <button
                onClick={() => {
                  setText("");
                  setFileName(null);
                }}
                className="text-xs text-white/40 hover:text-white/70"
              >
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-white/40">
              CSV · TXT · XLSX · commas, semicolons, spaces, new lines
            </span>
          </div>

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={deliverability}
              onChange={(e) => setDeliverability(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-500"
            />
            Also check <strong className="text-white/80">SPF &amp; DMARC</strong> deliverability (a little slower)
          </label>

          <button
            onClick={runSort}
            disabled={busy || blocked || parsed.domains.length === 0}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:from-brand-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy
              ? progress
                ? `Sorting… ${progress.done.toLocaleString()} / ${progress.total.toLocaleString()}`
                : "Sorting…"
              : `Sort ${parsed.domains.length.toLocaleString()} domain${parsed.domains.length === 1 ? "" : "s"}`}
          </button>

          {progress && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

          <div className="mt-4 flex items-center justify-between text-xs text-white/40">
            <span className={busy ? "text-brand-400" : ""}>
              {liveUsed.toLocaleString()} / {quota.limit.toLocaleString()} used
              {quota.resetAt && <> · resets in {formatCountdown(quota.resetAt)}</>}
            </span>
            <span className={busy ? "text-brand-400" : ""}>{liveRemaining.toLocaleString()} left · 20k / 6h</span>
          </div>
        </div>

        {/* Results summary */}
        <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
              {dimLabel} {sortedCount > 0 && `· ${sortedCount.toLocaleString()}`}
            </h2>
            {results.length > 0 && (
              <div className="flex items-center gap-3">
                <button onClick={exportAll} className="text-xs text-brand-400 hover:text-brand-400/80">
                  ⬇ CSV
                </button>
                <button onClick={exportXlsx} className="text-xs text-brand-400 hover:text-brand-400/80">
                  ⬇ XLSX
                </button>
              </div>
            )}
          </div>

          {/* Dimension toggle */}
          <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-xs">
            {(["provider", "registrar"] as Dimension[]).map((d) => (
              <button
                key={d}
                onClick={() => switchDimension(d)}
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  dimension === d ? "bg-brand-500 text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {d === "provider" ? "Mail provider" : "Registrar"}
              </button>
            ))}
          </div>

          {results.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-white/30">
              <div className="mb-2 text-3xl">🗂️</div>
              Sorted {dimLabel.toLowerCase()} will appear here, each in its own bucket.
            </div>
          ) : dimension === "registrar" && regBusy && buckets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-white/40">
              <div className="mb-2 text-2xl">🔎</div>
              Looking up registrars via RDAP…
              {regProgress && (
                <span className="mt-1 text-xs text-white/30">
                  {regProgress.done.toLocaleString()} / {regProgress.total.toLocaleString()}
                </span>
              )}
            </div>
          ) : (
            <>
              {dimension === "registrar" && regBusy && regProgress && (
                <div className="mb-3 text-xs text-white/40">
                  Loading registrars… {regProgress.done.toLocaleString()} / {regProgress.total.toLocaleString()}
                </div>
              )}
              {buckets.length > 6 && (
                <input
                  value={bucketFilter}
                  onChange={(e) => setBucketFilter(e.target.value)}
                  placeholder={`Filter ${dimLabel.toLowerCase()}…`}
                  className="mb-3 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-white/80 outline-none placeholder:text-white/25 focus:border-brand-400"
                />
              )}
              <div className="scroll-slim max-h-[400px] space-y-2 overflow-y-auto pr-1">
                {visibleBuckets.length === 0 && (
                  <p className="py-4 text-center text-xs text-white/30">No {dimLabel.toLowerCase()} match “{bucketFilter}”.</p>
                )}
                {visibleBuckets.map((b) => {
                  const pct = sortedCount ? Math.round((b.domains.length / sortedCount) * 100) : 0;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setActiveBucket(activeBucket === b.id ? null : b.id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                        activeBucket === b.id
                          ? "border-brand-400/60 bg-brand-500/10"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                        <span className="truncate text-sm font-medium text-white/90">{b.label}</span>
                        <span className="ml-auto text-sm font-semibold text-white/90">
                          {b.domains.length.toLocaleString()}
                        </span>
                        <span className="w-10 text-right text-xs text-white/40">{pct}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: b.color }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="animate-fade-up rounded-2xl border border-white/10 bg-ink-800/60 p-5 backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/60">Insights</h2>
          <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
            <DistributionDonut buckets={buckets} total={sortedCount} label={dimLabel} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              <Stat label="Unique domains" value={insights.unique.toLocaleString()} sub={`${insights.dedupPct}% dedup from ${insights.inputTokens.toLocaleString()}`} />
              <Stat label={dimLabel} value={insights.providerCount.toLocaleString()} sub="distinct buckets" />
              <Stat label="Top provider" value={insights.top ? `${insights.topPct}%` : "—"} sub={insights.top?.label ?? ""} accent={insights.top?.color} />
              <Stat label="Matched" value={`${insights.matchedPct}%`} sub={`${insights.mx.toLocaleString()} MX · ${insights.ns.toLocaleString()} NS`} />
              <Stat label="Google + MS" value={`${insights.bigThreePct}%`} sub="on the big two" />
              <Stat label="No mail" value={insights.noMail.toLocaleString()} sub="no MX record" />
              {insights.delivChecked > 0 && (
                <>
                  <Stat label="Has SPF" value={`${insights.spfPct}%`} sub={`of ${insights.delivChecked.toLocaleString()} checked`} />
                  <Stat label="Has DMARC" value={`${insights.dmarcPct}%`} sub={`of ${insights.delivChecked.toLocaleString()} checked`} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drill-down for a selected bucket */}
      {shown && (
        <div className="animate-fade-up rounded-2xl border border-white/10 bg-ink-800/60 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: shown.color }} />
              {shown.label} · {shown.domains.length.toLocaleString()}
            </h3>
            <div className="flex items-center gap-3">
              <button onClick={() => copyBucketDomains(shown)} className="text-xs text-brand-400 hover:text-brand-400/80">
                {copiedId === shown.id ? "✓ Copied" : "⧉ Copy domains"}
              </button>
              <button onClick={() => exportBucket(shown)} className="text-xs text-brand-400 hover:text-brand-400/80">
                ⬇ Export this bucket
              </button>
            </div>
          </div>
          <div className="scroll-slim max-h-72 overflow-y-auto rounded-lg border border-white/5">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-ink-700/90 text-xs uppercase text-white/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Email / domain</th>
                  <th className="px-3 py-2 font-medium">Domain</th>
                  <th className="px-3 py-2 font-medium">Mail provider</th>
                  <th className="px-3 py-2 font-medium">Registrar</th>
                  {deliverability && <th className="px-3 py-2 font-medium">SPF · DMARC</th>}
                  <th className="px-3 py-2 font-medium">Why it matched</th>
                </tr>
              </thead>
              <tbody>
                {shown.domains.flatMap((domain) => {
                  const r = resultByDomain[domain];
                  const reg = regByDomain[domain];
                  const conf = r?.confidence ?? "none";
                  const confColor =
                    conf === "high"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : conf === "medium"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-white/10 text-white/40";
                  // One row per original input — show the full email, never truncated.
                  return originalsFor(domain).map((input, idx) => (
                    <tr key={domain + ":" + idx} className="border-t border-white/5">
                      <td className="px-3 py-2 text-white/90">{input}</td>
                      <td className="px-3 py-2 text-white/40">{domain}</td>
                      <td className="px-3 py-2 text-white/60">{r?.provider ?? "—"}</td>
                      <td className="px-3 py-2 text-white/60">{reg?.registrar ?? "—"}</td>
                      {deliverability && (
                        <td className="px-3 py-2 text-xs">
                          <span className={r?.hasSpf ? "text-emerald-300" : "text-white/30"}>SPF {r?.hasSpf ? "✓" : "✗"}</span>
                          <span className="mx-1 text-white/20">·</span>
                          <span className={r?.hasDmarc ? "text-emerald-300" : "text-white/30"}>DMARC {r?.hasDmarc ? "✓" : "✗"}</span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-xs">
                        {r?.matchedPattern ? (
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded px-1.5 py-0.5 uppercase ${confColor}`}>{conf}</span>
                            <span className="text-white/50">
                              {r.matchedBy} contains
                              <code className="ml-1 rounded bg-white/10 px-1 text-white/70">
                                {r.matchedPattern}
                              </code>
                            </span>
                            {r.evidence && <span className="text-white/30">({r.evidence})</span>}
                          </span>
                        ) : (
                          <span className="text-white/30">
                            {(r?.matchedBy === "ns" ? r?.ns : r?.mx)?.slice(0, 1).join(", ") || "no records"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DistributionDonut({
  buckets,
  total,
  label,
}: {
  buckets: Bucket[];
  total: number;
  label: string;
}) {
  const size = 132;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const safeTotal = total || 1;

  // Top 6 buckets; roll the rest into "Other".
  const top = buckets.slice(0, 6);
  const otherCount = buckets.slice(6).reduce((n, b) => n + b.domains.length, 0);
  const segments = [
    ...top.map((b) => ({ label: b.label, value: b.domains.length, color: b.color })),
    ...(otherCount ? [{ label: "Other", value: otherCount, color: "#5a5a72" }] : []),
  ];

  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} distribution`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          {segments.map((s, i) => {
            const dash = (s.value / safeTotal) * circ;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" className="fill-white/90" style={{ fontSize: 22, fontWeight: 700 }}>
          {total.toLocaleString()}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-white/40" style={{ fontSize: 9 }}>
          domains
        </text>
      </svg>
      <div className="space-y-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="max-w-[140px] truncate">{s.label}</span>
            <span className="ml-auto text-white/40">{Math.round((s.value / safeTotal) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xl font-bold text-white/90">
        {accent && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />}
        {value}
      </div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-white/40">{sub}</div>}
    </div>
  );
}
