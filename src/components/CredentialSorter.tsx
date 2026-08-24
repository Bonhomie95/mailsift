"use client";

import { useEffect, useRef, useState } from "react";
import {
  SEPARATORS,
  separatorChar,
  type SeparatorId,
  type FormatOptions,
  type FormatStats,
} from "@/lib/credentials";
import { readFileToText, downloadBlob, fileStamp } from "@/lib/exportUtils";
import Spinner from "./Spinner";

interface ConvertResult {
  preview: string;
  previewShown: number;
  stats: FormatStats;
}

type WorkerMsg =
  | { kind: "progress"; read: number; total: number; parsed: number }
  | { kind: "result"; preview: string; previewShown: number; stats: FormatStats; txtBlob: Blob }
  | { kind: "blob"; blob: Blob; format: "txt" | "csv" }
  | { kind: "error"; message: string };

const isSpreadsheet = (name: string) => /\.(xlsx|xls|xlsm|ods)$/i.test(name);

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CredentialSorter() {
  const [source, setSource] = useState<"paste" | "file">("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [sepId, setSepId] = useState<SeparatorId>("colon");
  const [customSep, setCustomSep] = useState("");
  const [lowercaseEmail, setLowercaseEmail] = useState(false);
  const [dedupe, setDedupe] = useState(true);
  const [sortByEmail, setSortByEmail] = useState(false);
  const [keepPasswordless, setKeepPasswordless] = useState(false);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ read: number; total: number; parsed: number } | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const txtBlobRef = useRef<Blob | null>(null);
  // What the worker currently holds parsed — the File or the text string — so a
  // separator/option tweak can "reformat" instantly instead of re-reading.
  const loadedRef = useRef<File | string | null>(null);

  const separator = separatorChar(sepId, customSep);

  function buildOptions(): FormatOptions {
    return { separator, lowercaseEmail, dedupe, sortByEmail, keepPasswordless };
  }

  function getWorker(): Worker {
    if (!workerRef.current) {
      const w = new Worker(new URL("../workers/credentials.worker.ts", import.meta.url));
      w.onmessage = (e: MessageEvent<WorkerMsg>) => {
        const m = e.data;
        if (m.kind === "progress") {
          setProgress({ read: m.read, total: m.total, parsed: m.parsed });
        } else if (m.kind === "result") {
          txtBlobRef.current = m.txtBlob;
          setResult({ preview: m.preview, previewShown: m.previewShown, stats: m.stats });
          setBusy(false);
          setProgress(null);
        } else if (m.kind === "blob") {
          downloadBlob(`mailsift-logins_${fileStamp()}.${m.format}`, m.blob);
        } else if (m.kind === "error") {
          setError(m.message);
          setBusy(false);
          setProgress(null);
        }
      };
      workerRef.current = w;
    }
    return workerRef.current;
  }

  useEffect(() => () => workerRef.current?.terminate(), []);

  // Mark the current output stale when the input or options change after a run,
  // so the user knows to hit Convert again (nothing recomputes on its own).
  useEffect(() => {
    if (result) setStale(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, file, sepId, customSep, lowercaseEmail, dedupe, sortByEmail, keepPasswordless]);

  function handleFile(f: File) {
    setError(null);
    setSource("file");
    setFile(f);
    setResult(null);
    setProgress(null);
    setStale(false);
    loadedRef.current = null;
  }

  function convert() {
    setError(null);
    setCopied(false);
    const opts = buildOptions();
    const w = getWorker();

    if (source === "file") {
      if (!file) return;
      setBusy(true);
      setStale(false);
      if (loadedRef.current === file) {
        w.postMessage({ kind: "reformat", options: opts });
      } else if (isSpreadsheet(file.name)) {
        // Spreadsheets can't be streamed — expand to text on the main thread,
        // then hand the text to the worker for parsing/formatting.
        setProgress(null);
        readFileToText(file)
          .then((txt) => {
            loadedRef.current = file;
            w.postMessage({ kind: "text", text: txt, options: opts });
          })
          .catch(() => {
            setBusy(false);
            setError("Could not read that file. Try CSV, TXT, or XLSX.");
          });
      } else {
        loadedRef.current = file;
        setProgress({ read: 0, total: file.size, parsed: 0 });
        w.postMessage({ kind: "file", file, options: opts });
      }
      return;
    }

    // paste
    if (!text.trim()) {
      setError("Paste some logins first, or upload a file.");
      return;
    }
    setBusy(true);
    setStale(false);
    if (loadedRef.current === text) {
      w.postMessage({ kind: "reformat", options: opts });
    } else {
      loadedRef.current = text;
      w.postMessage({ kind: "text", text, options: opts });
    }
  }

  async function copyOutput() {
    if (!txtBlobRef.current) return;
    try {
      await navigator.clipboard.writeText(await txtBlobRef.current.text());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  function downloadTxt() {
    if (txtBlobRef.current) downloadBlob(`mailsift-logins_${fileStamp()}.txt`, txtBlobRef.current);
  }

  function downloadCsvFile() {
    if (!result) return;
    getWorker().postMessage({ kind: "download", options: buildOptions(), format: "csv" });
  }

  function clearAll() {
    setText("");
    setFile(null);
    setSource("paste");
    setResult(null);
    setProgress(null);
    setStale(false);
    setError(null);
    loadedRef.current = null;
    txtBlobRef.current = null;
  }

  const stats = result?.stats ?? null;
  const sepPreviewLabel = sepId === "tab" ? "⇥ (tab)" : sepId === "space" ? "␣ (space)" : separator || "…";
  const pct = progress && progress.total ? Math.min(100, Math.round((progress.read / progress.total) * 100)) : null;
  const hasInput = source === "file" ? !!file : text.trim().length > 0;

  const convertLabel = busy
    ? pct !== null
      ? `Reading… ${pct}%`
      : "Converting…"
    : stale
    ? "↻ Re-convert"
    : "Convert";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="rounded-2xl border border-fg/10 bg-ink-800/60 p-4 backdrop-blur sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg/60">Your logins</h2>
            <span className="text-xs text-fg/40">
              {source === "file" ? "from file" : "pasted"}
            </span>
          </div>

          {source === "file" && file ? (
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
              className={`flex h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition ${
                dragOver ? "border-brand-400 bg-brand-500/10" : "border-fg/10 bg-fg/[0.02]"
              }`}
            >
              <div className="text-3xl">📄</div>
              <div className="mt-2 max-w-full truncate text-sm font-medium text-fg/90">{file.name}</div>
              <div className="mt-0.5 text-xs text-fg/40">{humanSize(file.size)}</div>
              {busy && pct !== null ? (
                <div className="mt-3 w-full max-w-xs">
                  <div className="h-2 overflow-hidden rounded-full bg-fg/10">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 text-xs text-brand-400 light:text-brand-600">
                    Reading {pct}% · {progress!.parsed.toLocaleString()} rows parsed
                  </div>
                </div>
              ) : result ? (
                <div className="mt-2 text-xs text-emerald-300 light:text-emerald-700">
                  ✓ {stats!.total.toLocaleString()} rows read · click Convert to re-run
                </div>
              ) : (
                <div className="mt-2 text-xs text-fg/40">Ready — big files stream in on Convert (kept off the main thread)</div>
              )}
            </div>
          ) : (
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
                placeholder={
                  "Paste your logins in any format…\n\njohn@acme.com:hunter2\n1042, jane@acme.com, s3cret!, 2026-01-01\nhunter2 | mike@acme.com\nid=7;support@acme.com;letmein;10.0.0.4"
                }
                className="h-56 w-full resize-none rounded-xl bg-transparent p-4 font-mono text-sm text-fg/90 outline-none placeholder:text-fg/25"
              />
            </div>
          )}

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
            <span className="ml-auto text-xs text-fg/40">CSV · TXT · XLSX</span>
          </div>

          {error && <p className="mt-3 text-sm text-red-300 light:text-red-600">{error}</p>}

          {/* Separator picker */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-fg/40">Output separator</span>
              <span className="text-xs text-fg/50">
                email{" "}
                <span className="rounded bg-brand-500/15 px-1.5 py-0.5 text-brand-400 light:text-brand-600">
                  {sepPreviewLabel}
                </span>{" "}
                password
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SEPARATORS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSepId(s.id)}
                  title={s.hint}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    sepId === s.id
                      ? "border-brand-400/60 bg-brand-500/15 text-fg/90"
                      : "border-fg/10 bg-fg/[0.03] text-fg/60 hover:bg-fg/[0.06]"
                  }`}
                >
                  {s.label}
                  <span className="ml-1.5 text-fg/40">
                    {s.id === "custom" ? "" : s.char === "\t" ? "⇥" : s.char === " " ? "␣" : s.char}
                  </span>
                </button>
              ))}
            </div>
            {sepId === "custom" && (
              <input
                value={customSep}
                onChange={(e) => setCustomSep(e.target.value)}
                placeholder="Type any separator, e.g.  ->  or  ;;"
                className="mt-2 w-full rounded-lg border border-fg/10 bg-ink-900 px-3 py-2 text-sm text-fg/90 outline-none placeholder:text-fg/25 focus:border-brand-400"
              />
            )}
          </div>

          {/* Options */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Toggle checked={dedupe} onChange={setDedupe} label="Remove duplicates" />
            <Toggle checked={sortByEmail} onChange={setSortByEmail} label="Sort A→Z by email" />
            <Toggle checked={lowercaseEmail} onChange={setLowercaseEmail} label="Lowercase emails" />
            <Toggle checked={keepPasswordless} onChange={setKeepPasswordless} label="Keep rows with no password" />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={convert}
              disabled={busy || !hasInput}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:from-brand-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy && <Spinner className="h-4 w-4" />}
              {convertLabel}
            </button>
            <button
              onClick={clearAll}
              disabled={busy || (!text && !file && !result)}
              className="rounded-xl border border-fg/15 bg-fg/5 px-5 py-3 text-sm font-medium text-fg/70 transition hover:bg-fg/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          {stale && !busy && (
            <p className="mt-2 text-center text-xs text-amber-300 light:text-amber-700">
              Options changed — click to re-convert.
            </p>
          )}
        </div>

        {/* Output */}
        <div className="rounded-2xl border border-fg/10 bg-ink-800/60 p-4 backdrop-blur sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg/60">
              Formatted {stats && stats.formatted > 0 && `· ${stats.formatted.toLocaleString()}`}
            </h2>
            {stats && stats.formatted > 0 && (
              <div className="flex items-center gap-3">
                <button onClick={copyOutput} className="text-xs text-brand-400 light:text-brand-600 hover:text-brand-400/80">
                  {copied ? "✓ Copied" : "⧉ Copy"}
                </button>
                <button onClick={downloadTxt} className="text-xs text-brand-400 light:text-brand-600 hover:text-brand-400/80" title="One email:password per line">
                  TXT
                </button>
                <button onClick={downloadCsvFile} className="text-xs text-brand-400 light:text-brand-600 hover:text-brand-400/80" title="Two columns: email, password">
                  CSV
                </button>
              </div>
            )}
          </div>

          {!stats || stats.formatted === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center text-sm text-fg/30">
              <div className="mb-2 text-3xl">🔐</div>
              {busy ? (
                <span className="text-fg/50">Working…</span>
              ) : (
                <>
                  Add logins on the left, pick a separator, then hit <strong className="text-fg/60">Convert</strong>.
                  <br className="hidden sm:block" /> Output is only{" "}
                  <code className="text-fg/50">email{sepPreviewLabel}password</code> — every other field is dropped.
                </>
              )}
            </div>
          ) : (
            <>
              <textarea
                readOnly
                value={result!.preview}
                onFocus={(e) => e.currentTarget.select()}
                className="scroll-slim h-72 w-full resize-none rounded-xl border border-fg/10 bg-ink-900/60 p-4 font-mono text-sm text-fg/90 outline-none"
              />
              {result!.previewShown < stats.formatted && (
                <p className="mt-2 text-xs text-fg/40">
                  Showing the first {result!.previewShown.toLocaleString()} of{" "}
                  {stats.formatted.toLocaleString()} rows — use Copy / TXT / CSV to get them all.
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Formatted" value={stats.formatted.toLocaleString()} tone="good" />
                <Stat label="Duplicates" value={stats.duplicates.toLocaleString()} sub={dedupe ? "removed" : "kept"} />
                <Stat label="No password" value={stats.noPassword.toLocaleString()} sub={keepPasswordless ? "kept" : "skipped"} />
                <Stat
                  label="No email"
                  value={stats.noEmailCount.toLocaleString()}
                  sub="skipped"
                  tone={stats.noEmailCount ? "warn" : undefined}
                />
              </div>

              {stats.noEmailCount > 0 && (
                <details className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-200 light:text-amber-800">
                  <summary className="cursor-pointer select-none">
                    {stats.noEmailCount.toLocaleString()} line{stats.noEmailCount === 1 ? "" : "s"} had no detectable email — click to review
                  </summary>
                  <pre className="scroll-slim mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-amber-200/80 light:text-amber-800/80">
                    {stats.noEmail.join("\n")}
                    {stats.noEmailCount > stats.noEmail.length
                      ? `\n…and ${(stats.noEmailCount - stats.noEmail.length).toLocaleString()} more`
                      : ""}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-fg/10 bg-fg/[0.02] px-3 py-2 text-sm text-fg/70 hover:bg-fg/[0.04]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-brand-500"
      />
      {label}
    </label>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "warn";
}) {
  const valueColor =
    tone === "good"
      ? "text-emerald-300 light:text-emerald-700"
      : tone === "warn"
      ? "text-amber-300 light:text-amber-700"
      : "text-fg/90";
  return (
    <div className="rounded-xl border border-fg/10 bg-fg/[0.02] p-3">
      <div className="text-[11px] uppercase tracking-wide text-fg/40">{label}</div>
      <div className={`mt-1 text-xl font-bold ${valueColor}`}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-fg/40">{sub}</div>}
    </div>
  );
}
