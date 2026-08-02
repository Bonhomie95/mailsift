"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseText } from "@/lib/parse";
import { useSingleTab } from "@/lib/useSingleTab";
import { useSessionQuota, FREE_SESSION_LIMIT } from "@/lib/useSessionQuota";
import type { CountryResult, CountrySignal } from "@/lib/types";
import {
  countryName,
  countryColor,
  isoToFlag,
  localTimeFor,
  sendWindowFor,
  MULTI_TZ,
  type SendRating,
} from "@/lib/countries";
import {
  readFileToText,
  formatCountdown,
  tableToCsv,
  downloadCsv,
  downloadBlob,
  downloadText,
  fileSlug,
  fileStamp,
} from "@/lib/exportUtils";

interface Bucket {
  id: string;
  iso: string | null;
  label: string;
  color: string;
  domains: string[];
}

const CHUNK = 1000;
const RESUME_KEY = "mailsift-last-country-sort";
const RESUME_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24h
const UNKNOWN_ID = "__unknown_country__";

const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: "input", label: "Email / input" },
  { key: "domain", label: "Domain" },
  { key: "country", label: "Country" },
  { key: "iso", label: "ISO code" },
  { key: "confidence", label: "Confidence" },
  { key: "matched_by", label: "Matched by" },
  { key: "local_time", label: "Local time" },
  { key: "send_window", label: "Send window" },
  { key: "mx", label: "MX records" },
  { key: "ns", label: "NS records" },
];
const DEFAULT_EXPORT_COLS = ["input", "domain", "country", "iso", "confidence", "local_time"];

const RATING_STYLE: Record<SendRating, string> = {
  prime: "bg-emerald-500/15 text-emerald-300 light:text-emerald-700",
  good: "bg-sky-500/15 text-sky-300 light:text-sky-700",
  ok: "bg-amber-500/15 text-amber-300 light:text-amber-700",
  off: "bg-fg/10 text-fg/40",
};

export default function CountrySorter() {
  const { blocked } = useSingleTab();
  const quota = useSessionQuota("country");

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<CountryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [useGeo, setUseGeo] = useState(false);
  const [bucketFilter, setBucketFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedBuckets, setSelectedBuckets] = useState<Set<string>>(new Set());
  const [zipping, setZipping] = useState(false);
  const [dlFormat, setDlFormat] = useState<"csv" | "txt" | "xlsx">("csv");
  const [exportCols, setExportCols] = useState<string[]>(DEFAULT_EXPORT_COLS);
  const [showExportCols, setShowExportCols] = useState(false);
  const [sortSummary, setSortSummary] = useState<{ count: number; ms: number } | null>(null);
  const [restoredNote, setRestoredNote] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const drilldownRef = useRef<HTMLDivElement>(null);

  // Live clock so local times & send windows stay current while the tab is open.
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Restore the previous country sort so a refresh doesn't lose a big run.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESUME_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { text: string; results: CountryResult[]; ts: number };
      if (!saved.results?.length || Date.now() - saved.ts > RESUME_MAX_AGE_MS) return;
      setText(saved.text || "");
      setResults(saved.results);
      setRestoredNote(
        `Restored your last country sort of ${saved.results.length.toLocaleString()} domains from ${new Date(
          saved.ts
        ).toLocaleString()}.`
      );
    } catch {
      /* ignore corrupt state */
    }
  }, []);

  function persist(res: CountryResult[], srcText: string) {
    try {
      localStorage.setItem(RESUME_KEY, JSON.stringify({ text: srcText, results: res, ts: Date.now() }));
    } catch {
      /* over quota on a huge sort — skip */
    }
  }

  const parsed = useMemo(() => parseText(text), [text]);
  const resultByDomain = useMemo(() => {
    const m: Record<string, CountryResult> = {};
    for (const r of results) m[r.domain] = r;
    return m;
  }, [results]);

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    for (const r of results) {
      const id = r.country ?? UNKNOWN_ID;
      let b = map.get(id);
      if (!b) {
        b = {
          id,
          iso: r.country,
          label: r.country ? `${isoToFlag(r.country)} ${countryName(r.country)}` : "🏳️ Unknown country",
          color: r.country ? countryColor(r.country) : "#8a8aa0",
          domains: [],
        };
        map.set(id, b);
      }
      b.domains.push(r.domain);
    }
    // Real countries first (by size), Unknown always last.
    return [...map.values()].sort((a, b) => {
      if (a.id === UNKNOWN_ID) return 1;
      if (b.id === UNKNOWN_ID) return -1;
      return b.domains.length - a.domains.length;
    });
  }, [results]);

  const sortedCount = useMemo(() => buckets.reduce((n, b) => n + b.domains.length, 0), [buckets]);

  const visibleBuckets = useMemo(() => {
    const q = bucketFilter.trim().toLowerCase();
    if (!q) return buckets;
    return buckets.filter((b) => b.label.toLowerCase().includes(q) || (b.iso ?? "").toLowerCase().includes(q));
  }, [buckets, bucketFilter]);

  const originalsFor = (domain: string): string[] => {
    const o = parsed.originals[domain];
    return o && o.length ? o : [domain];
  };

  // Insights: coverage + how many leads are reachable right now.
  const insights = useMemo(() => {
    if (!results.length) return null;
    let unknown = 0;
    let reachable = 0; // in business hours right now
    for (const r of results) {
      if (!r.country) {
        unknown++;
        continue;
      }
      const rating = sendWindowFor(localTimeFor(r.country, new Date(nowTick))).rating;
      if (rating !== "off") reachable++;
    }
    const top = buckets.find((b) => b.id !== UNKNOWN_ID);
    return {
      unique: results.length,
      countries: buckets.filter((b) => b.id !== UNKNOWN_ID).length,
      top,
      topPct: top && sortedCount ? Math.round((top.domains.length / sortedCount) * 100) : 0,
      identifiedPct: results.length ? Math.round(((results.length - unknown) / results.length) * 100) : 0,
      unknown,
      reachable,
      reachablePct: results.length ? Math.round((reachable / results.length) * 100) : 0,
    };
  }, [results, buckets, sortedCount, nowTick]);

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

  const exceedsQuota = !busy && parsed.domains.length > quota.remaining;

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
    setActiveBucket(null);
    setSelectedBuckets(new Set());
    setSortSummary(null);
    setProgress({ done: 0, total: domains.length });
    const startedAt = performance.now();

    const collected: CountryResult[] = [];
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
        const res = await fetch("/api/country", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ domains: slice, geo: useGeo }),
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Server error (${res.status}).`);
        }
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
            let obj: CountryResult & { done?: boolean };
            try {
              obj = JSON.parse(line);
            } catch {
              continue;
            }
            if (obj.done) continue;
            collected.push(obj);
            setProgress({ done: collected.length, total: domains.length });
            flush();
          }
        }
        flush(true);
      }
      quota.add(domains.length);
      setRestoredNote(null);
      setSortSummary({ count: collected.length, ms: performance.now() - startedAt });
      persist(collected, text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  // --- Exports ---
  function cellValue(key: string, r: CountryResult, input: string): string {
    const info = r.country ? localTimeFor(r.country, new Date(nowTick)) : null;
    switch (key) {
      case "input": return input;
      case "domain": return r.domain;
      case "country": return r.country ? countryName(r.country) : "Unknown";
      case "iso": return r.country ?? "";
      case "confidence": return r.confidence;
      case "matched_by": return r.matchedBy;
      case "local_time": return info ? `${info.time} ${info.offset}` : "";
      case "send_window": return r.country ? sendWindowFor(info).label : "";
      case "mx": return r.mx.join(" | ");
      case "ns": return r.ns.join(" | ");
      default: return "";
    }
  }

  function buildTable(source: CountryResult[]): string[][] {
    const selected = exportCols.length ? exportCols : ["input"];
    const cols = EXPORT_COLUMNS.filter((c) => selected.includes(c.key)).map((c) => c.key);
    const rows: string[][] = [cols];
    for (const r of source) {
      for (const input of originalsFor(r.domain)) rows.push(cols.map((c) => cellValue(c, r, input)));
    }
    return rows;
  }

  function exportAll() {
    downloadCsv("mailsift-countries.csv", buildTable(results));
  }
  function exportEmailsAll() {
    downloadText("mailsift-country-emails.txt", results.flatMap((r) => originalsFor(r.domain)).join("\n"));
  }
  async function exportXlsx() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const summary = [["Country", "ISO", "Count", "Share %"]];
    for (const b of buckets)
      summary.push([
        b.label.replace(/^\S+\s/, ""),
        b.iso ?? "",
        String(b.domains.length),
        String(sortedCount ? Math.round((b.domains.length / sortedCount) * 100) : 0),
      ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Countries");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buildTable(results)), "Results");
    XLSX.writeFile(wb, "mailsift-country-report.xlsx");
  }

  async function bucketFile(b: Bucket): Promise<{ content: string | Uint8Array; ext: string }> {
    const source = b.domains.map((d) => resultByDomain[d]).filter(Boolean);
    if (dlFormat === "txt") return { content: source.flatMap((r) => originalsFor(r.domain)).join("\n"), ext: "txt" };
    if (dlFormat === "xlsx") {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buildTable(source)), "Results");
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
      return { content: new Uint8Array(out), ext: "xlsx" };
    }
    return { content: tableToCsv(buildTable(source)), ext: "csv" };
  }

  const bucketBase = (b: Bucket) => (b.iso ? `${b.iso}-${fileSlug(countryName(b.iso))}` : "unknown-country");

  async function downloadBuckets(list: Bucket[]) {
    if (list.length === 0) return;
    setZipping(true);
    try {
      if (list.length === 1) {
        const { content, ext } = await bucketFile(list[0]);
        const blob =
          typeof content === "string"
            ? new Blob([content], { type: ext === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8" })
            : new Blob([content as BlobPart], { type: "application/octet-stream" });
        downloadBlob(`mailsift_${bucketBase(list[0])}_${fileStamp()}.${ext}`, blob);
        return;
      }
      const { createZip } = await import("@/lib/zip");
      const seen = new Map<string, number>();
      const files = [];
      for (const b of list) {
        const { content, ext } = await bucketFile(b);
        let name = `${bucketBase(b)}.${ext}`;
        const n = seen.get(name) ?? 0;
        seen.set(name, n + 1);
        if (n) name = `${bucketBase(b)}-${n}.${ext}`;
        files.push({ name, content });
      }
      downloadBlob(`mailsift_countries_${fileStamp()}.zip`, createZip(files));
    } finally {
      setZipping(false);
    }
  }

  async function copyBucketEmails(b: Bucket) {
    const lines = b.domains.flatMap((d) => originalsFor(d));
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedId(b.id);
      setTimeout(() => setCopiedId((c) => (c === b.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  useEffect(() => {
    if (!activeBucket) return;
    const t = setTimeout(() => drilldownRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
    return () => clearTimeout(t);
  }, [activeBucket]);

  function toggleBucketSelect(id: string) {
    setSelectedBuckets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    const ids = visibleBuckets.map((b) => b.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedBuckets.has(id));
    setSelectedBuckets(allSelected ? new Set() : new Set(ids));
  }
  function clearAll() {
    localStorage.removeItem(RESUME_KEY);
    setResults([]);
    setText("");
    setFileName(null);
    setActiveBucket(null);
    setRestoredNote(null);
    setError(null);
  }

  const shown = activeBucket ? buckets.find((b) => b.id === activeBucket) : null;
  const liveDone = busy && progress ? progress.done : 0;
  const liveUsed = Math.min(quota.limit, quota.used + liveDone);
  const liveRemaining = Math.max(0, quota.remaining - liveDone);
  const selectedVisibleCount = visibleBuckets.filter((b) => selectedBuckets.has(b.id)).length;
  const allVisibleSelected = visibleBuckets.length > 0 && selectedVisibleCount === visibleBuckets.length;

  return (
    <div className="space-y-6">
      {blocked && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 light:text-amber-800">
          ⚠️ MailSift is already open in another tab. On the free plan you can only sort in one tab at a time.
        </div>
      )}

      {restoredNote && (
        <div className="flex items-center justify-between rounded-xl border border-brand-400/30 bg-brand-500/10 px-4 py-2.5 text-sm text-brand-400 light:text-brand-600">
          <span>↩ {restoredNote}</span>
          <button onClick={clearAll} className="text-xs text-fg/50 hover:text-fg/80">Clear</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Input */}
        <div className="rounded-2xl border border-fg/10 bg-ink-800/60 p-4 backdrop-blur sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg/60">Your leads</h2>
            <span className="text-xs text-fg/40">
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
              dragOver ? "border-brand-400 bg-brand-500/10" : "border-fg/10"
            }`}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !busy && !exceedsQuota) {
                  e.preventDefault();
                  runSort();
                }
              }}
              placeholder={"Paste your leads (emails or domains)...\n\nboss@bmw.de, info@orange.fr\nsales@acme.co.uk; hello@empresa.com.br"}
              className="h-56 w-full resize-none rounded-xl bg-transparent p-4 text-sm text-fg/90 outline-none placeholder:text-fg/25"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-fg/15 bg-fg/5 px-3 py-2 text-sm text-fg/80 hover:bg-fg/10"
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
                onClick={() => downloadText("mailsift-input.txt", text)}
                className="rounded-lg border border-fg/15 bg-fg/5 px-3 py-2 text-sm text-fg/80 hover:bg-fg/10"
              >
                ⬇ Download input
              </button>
            )}
            {fileName && <span className="text-xs text-fg/40">Loaded: {fileName}</span>}
            {text && (
              <button
                onClick={() => {
                  setText("");
                  setFileName(null);
                }}
                className="text-xs text-fg/40 hover:text-fg/70"
              >
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-fg/40">CSV · TXT · XLSX</span>
          </div>

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-fg/60">
            <input
              type="checkbox"
              checked={useGeo}
              onChange={(e) => setUseGeo(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-500"
            />
            Also use <strong className="text-fg/80">IP geolocation</strong> for generic domains (.com/.net) — offline, no cost (a little slower)
          </label>

          {exceedsQuota && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200 light:text-amber-800">
              ⚠️ That&rsquo;s {parsed.domains.length.toLocaleString()} domains, but you only have{" "}
              <strong>{quota.remaining.toLocaleString()}</strong> left in this 3-hour window
              {quota.resetAt && <> (resets in {formatCountdown(quota.resetAt)})</>}.
            </div>
          )}

          <button
            onClick={runSort}
            disabled={busy || blocked || parsed.domains.length === 0 || exceedsQuota}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:from-brand-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy
              ? progress
                ? `Sorting… ${progress.done.toLocaleString()} / ${progress.total.toLocaleString()}`
                : "Sorting…"
              : exceedsQuota
              ? `Too many — ${(parsed.domains.length - quota.remaining).toLocaleString()} over your limit`
              : `Sort ${parsed.domains.length.toLocaleString()} lead${parsed.domains.length === 1 ? "" : "s"} by country`}
          </button>

          {progress && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-fg/10">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-300 light:text-red-600">{error}</p>}

          {sortSummary && !busy && !error && (
            <p className="animate-fade-up mt-3 text-sm text-emerald-300 light:text-emerald-700">
              ✓ Sorted {sortSummary.count.toLocaleString()} lead{sortSummary.count === 1 ? "" : "s"} in{" "}
              {(sortSummary.ms / 1000).toFixed(1)}s
            </p>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-fg/40">
            <span className={busy ? "text-brand-400 light:text-brand-600" : ""}>
              {liveUsed.toLocaleString()} / {quota.limit.toLocaleString()} used
              {quota.resetAt && <> · resets in {formatCountdown(quota.resetAt)}</>}
            </span>
            <span className={busy ? "text-brand-400 light:text-brand-600" : ""}>{liveRemaining.toLocaleString()} left · 750k / 1h</span>
          </div>

          {(results.length > 0 || text) && (
            <button onClick={clearAll} className="mt-2 text-[11px] text-fg/30 hover:text-fg/60">
              🧹 Clear saved results
            </button>
          )}
        </div>

        {/* Country buckets */}
        <div className="rounded-2xl border border-fg/10 bg-ink-800/60 p-4 backdrop-blur sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg/60">
              Countries {sortedCount > 0 && `· ${sortedCount.toLocaleString()}`}
            </h2>
            {results.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase text-fg/30">Export</span>
                <button onClick={exportEmailsAll} className="text-xs text-brand-400 light:text-brand-600 hover:text-brand-400/80" title="Just the email addresses, one per line">Emails</button>
                <button onClick={exportAll} className="text-xs text-brand-400 light:text-brand-600 hover:text-brand-400/80" title="CSV table with the columns you pick below">CSV</button>
                <button onClick={exportXlsx} className="text-xs text-brand-400 light:text-brand-600 hover:text-brand-400/80" title="Excel workbook: Countries + Results">XLSX</button>
                <button
                  onClick={() => setShowExportCols((s) => !s)}
                  className={`text-xs ${showExportCols ? "text-fg/80" : "text-fg/40"} hover:text-fg/80`}
                >
                  Columns ▾
                </button>
              </div>
            )}
          </div>

          {results.length > 0 && showExportCols && (
            <div className="mb-4 rounded-xl border border-fg/10 bg-fg/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] uppercase text-fg/40">Columns for CSV / XLSX</span>
                <div className="flex gap-2 text-[11px]">
                  <button onClick={() => setExportCols(EXPORT_COLUMNS.map((c) => c.key))} className="text-brand-400 light:text-brand-600 hover:text-brand-400/80">All</button>
                  <button onClick={() => setExportCols(["input"])} className="text-brand-400 light:text-brand-600 hover:text-brand-400/80">Email only</button>
                  <button onClick={() => setExportCols(DEFAULT_EXPORT_COLS)} className="text-fg/40 hover:text-fg/70">Reset</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {EXPORT_COLUMNS.map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-1.5 text-xs text-fg/70">
                    <input
                      type="checkbox"
                      checked={exportCols.includes(c.key)}
                      onChange={(e) =>
                        setExportCols((prev) => (e.target.checked ? [...prev, c.key] : prev.filter((k) => k !== c.key)))
                      }
                      className="h-3.5 w-3.5 accent-brand-500"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-fg/30">
              <div className="mb-2 text-3xl">🌍</div>
              Your leads sorted by country — with local time & the best moment to email — will appear here.
            </div>
          ) : (
            <>
              {buckets.length > 6 && (
                <input
                  value={bucketFilter}
                  onChange={(e) => setBucketFilter(e.target.value)}
                  placeholder="Filter countries…"
                  className="mb-3 w-full rounded-lg border border-fg/10 bg-ink-900 px-3 py-1.5 text-xs text-fg/80 outline-none placeholder:text-fg/25 focus:border-brand-400"
                />
              )}

              {visibleBuckets.length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-fg/50">
                  <label className="flex cursor-pointer items-center gap-1.5" title="Select every country">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedVisibleCount > 0 && !allVisibleSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 accent-brand-500"
                    />
                    Select all
                  </label>
                  <div className="inline-flex overflow-hidden rounded-md border border-fg/10" title="Format for downloads">
                    {(["csv", "txt", "xlsx"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setDlFormat(f)}
                        className={`px-1.5 py-0.5 text-[10px] uppercase transition ${
                          dlFormat === f ? "bg-brand-500 text-white" : "text-fg/40 hover:text-fg/70"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => downloadBuckets(visibleBuckets.filter((b) => selectedBuckets.has(b.id)))}
                    disabled={selectedVisibleCount === 0 || zipping}
                    className="ml-auto rounded-md bg-brand-500/90 px-2.5 py-1 font-medium text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-fg/10 disabled:text-fg/30"
                  >
                    {zipping ? "Preparing…" : `⬇ Download ${selectedVisibleCount || ""} selected${selectedVisibleCount > 1 ? " (.zip)" : ""}`}
                  </button>
                </div>
              )}

              <div className="scroll-slim max-h-[400px] space-y-2 overflow-y-auto pr-1">
                {visibleBuckets.length === 0 && (
                  <p className="py-4 text-center text-xs text-fg/30">No countries match “{bucketFilter}”.</p>
                )}
                {visibleBuckets.map((b) => {
                  const pct = sortedCount ? Math.round((b.domains.length / sortedCount) * 100) : 0;
                  const isSel = selectedBuckets.has(b.id);
                  const info = b.iso ? localTimeFor(b.iso, new Date(nowTick)) : null;
                  const win = b.iso ? sendWindowFor(info) : null;
                  return (
                    <div
                      key={b.id}
                      className={`rounded-xl border px-3 py-2.5 transition ${
                        activeBucket === b.id
                          ? "border-brand-400/60 bg-brand-500/10"
                          : isSel
                          ? "border-brand-400/30 bg-brand-500/[0.06]"
                          : "border-fg/10 bg-fg/[0.03] hover:bg-fg/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleBucketSelect(b.id)}
                          className="h-3.5 w-3.5 shrink-0 accent-brand-500"
                          title="Select for multi-download"
                        />
                        <button
                          onClick={() => setActiveBucket(activeBucket === b.id ? null : b.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="truncate text-sm font-medium text-fg/90">{b.label}</span>
                          {info && (
                            <span
                              className={`ml-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] ${RATING_STYLE[win!.rating]}`}
                              title={`Local time ${info.time} (${info.offset}) · ${win!.label}`}
                            >
                              🕐 {info.time}
                            </span>
                          )}
                          <span className="ml-auto text-sm font-semibold text-fg/90">{b.domains.length.toLocaleString()}</span>
                          <span className="w-10 text-right text-xs text-fg/40">{pct}%</span>
                        </button>
                        <button
                          onClick={() => downloadBuckets([b])}
                          title={`Download ${b.label}`}
                          aria-label={`Download ${b.label}`}
                          className="shrink-0 rounded p-1 text-fg/40 hover:bg-fg/10 hover:text-brand-400 light:text-brand-600"
                        >
                          ⬇
                        </button>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fg/10">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: b.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="animate-fade-up grid grid-cols-2 gap-3 rounded-2xl border border-fg/10 bg-ink-800/60 p-4 backdrop-blur sm:grid-cols-3 sm:p-5 lg:grid-cols-5">
          <Stat label="Leads" value={insights.unique.toLocaleString()} sub="unique domains" />
          <Stat label="Countries" value={insights.countries.toLocaleString()} sub="distinct" />
          <Stat
            label="Top country"
            value={insights.top ? `${insights.topPct}%` : "—"}
            sub={insights.top?.label ?? ""}
            accent={insights.top?.color}
          />
          <Stat label="Identified" value={`${insights.identifiedPct}%`} sub={`${insights.unknown.toLocaleString()} unknown`} />
          <Stat label="Reachable now" value={`${insights.reachablePct}%`} sub="in business hours" />
        </div>
      )}

      {/* Drill-down */}
      {shown && (
        <div ref={drilldownRef} className="animate-fade-up rounded-2xl border border-fg/10 bg-ink-800/60 p-4 backdrop-blur sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-fg/90">
              {shown.label} · {shown.domains.length.toLocaleString()}
              {shown.iso && <CountryClock iso={shown.iso} now={nowTick} />}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => copyBucketEmails(shown)} className="text-xs text-brand-400 light:text-brand-600 hover:text-brand-400/80">
                {copiedId === shown.id ? "✓ Copied" : "⧉ Copy emails"}
              </button>
              <button onClick={() => downloadBuckets([shown])} className="text-xs text-brand-400 light:text-brand-600 hover:text-brand-400/80" title="Download this country">
                ⬇ Download
              </button>
            </div>
          </div>
          <div className="scroll-slim max-h-72 overflow-auto rounded-lg border border-fg/5">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 bg-ink-700/90 text-xs uppercase text-fg/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Email / domain</th>
                  <th className="px-3 py-2 font-medium">Domain</th>
                  <th className="px-3 py-2 font-medium">Local time</th>
                  <th className="px-3 py-2 font-medium">Send window</th>
                  <th className="px-3 py-2 font-medium">Why this country</th>
                </tr>
              </thead>
              <tbody>
                {shown.domains.flatMap((domain) => {
                  const r = resultByDomain[domain];
                  const info = shown.iso ? localTimeFor(shown.iso, new Date(nowTick)) : null;
                  const win = shown.iso ? sendWindowFor(info) : null;
                  const conf = r?.confidence ?? "none";
                  const confColor =
                    conf === "high"
                      ? "bg-emerald-500/15 text-emerald-300 light:text-emerald-700"
                      : conf === "medium"
                      ? "bg-amber-500/15 text-amber-300 light:text-amber-700"
                      : "bg-fg/10 text-fg/40";
                  return originalsFor(domain).map((input, idx) => (
                    <tr key={domain + ":" + idx} className="border-t border-fg/5">
                      <td className="px-3 py-2 text-fg/90">{input}</td>
                      <td className="px-3 py-2 text-fg/40">{domain}</td>
                      <td className="px-3 py-2 text-fg/70">{info ? `${info.time} ${info.offset}` : "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        {win ? <span className={`rounded px-1.5 py-0.5 ${RATING_STYLE[win.rating]}`}>{win.label}</span> : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded px-1.5 py-0.5 uppercase ${confColor}`}>{conf}</span>
                          <SignalTrail signals={r?.signals ?? []} winner={r?.country ?? null} />
                        </span>
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

function CountryClock({ iso, now }: { iso: string; now: number }) {
  const info = localTimeFor(iso, new Date(now));
  if (!info) return null;
  const multi = MULTI_TZ[iso];
  return (
    <span className="rounded-full border border-fg/10 bg-fg/[0.04] px-2 py-0.5 text-xs font-normal text-fg/60">
      🕐 {info.weekday} {info.time} · {info.offset}
      {multi && multi > 1 ? ` · spans ${multi} zones` : ""}
    </span>
  );
}

function SignalTrail({ signals, winner }: { signals: CountrySignal[]; winner: string | null }) {
  if (!signals.length) return <span className="text-fg/30">no country signal</span>;
  const LABEL: Record<CountrySignal["source"], string> = {
    cctld: "ccTLD",
    provider: "provider",
    ip: "IP geo",
    host: "host TLD",
  };
  return (
    <span className="flex flex-wrap items-center gap-1">
      {signals.map((s, i) => (
        <span
          key={i}
          className={`rounded px-1 text-fg/60 ${s.country === winner ? "bg-brand-500/15" : "bg-fg/5"}`}
          title={s.evidence}
        >
          {LABEL[s.source]}→{isoToFlag(s.country)}
        </span>
      ))}
    </span>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-fg/10 bg-fg/[0.02] p-3">
      <div className="text-[11px] uppercase tracking-wide text-fg/40">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xl font-bold text-fg/90">
        {accent && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />}
        {value}
      </div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-fg/40">{sub}</div>}
    </div>
  );
}
