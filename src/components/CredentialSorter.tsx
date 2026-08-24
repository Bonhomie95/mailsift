"use client";

import { useMemo, useRef, useState } from "react";
import {
  SEPARATORS,
  separatorChar,
  formatCredentials,
  type SeparatorId,
} from "@/lib/credentials";
import {
  readFileToText,
  downloadText,
  downloadCsv,
  fileStamp,
} from "@/lib/exportUtils";

export default function CredentialSorter() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [sepId, setSepId] = useState<SeparatorId>("colon");
  const [customSep, setCustomSep] = useState("");
  const [lowercaseEmail, setLowercaseEmail] = useState(false);
  const [dedupe, setDedupe] = useState(true);
  const [sortByEmail, setSortByEmail] = useState(false);
  const [keepPasswordless, setKeepPasswordless] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const separator = separatorChar(sepId, customSep);

  const result = useMemo(
    () =>
      formatCredentials(text, {
        separator,
        lowercaseEmail,
        dedupe,
        sortByEmail,
        keepPasswordless,
      }),
    [text, separator, lowercaseEmail, dedupe, sortByEmail, keepPasswordless]
  );

  const output = result.lines.join("\n");

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

  async function copyOutput() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  function downloadTxt() {
    if (!output) return;
    downloadText(`mailsift-logins_${fileStamp()}.txt`, output);
  }

  function downloadCsvFile() {
    if (!result.rows.length) return;
    const rows: string[][] = [["email", "password"]];
    for (const r of result.rows) rows.push([r.email, r.password]);
    downloadCsv(`mailsift-logins_${fileStamp()}.csv`, rows);
  }

  function clearAll() {
    setText("");
    setFileName(null);
    setError(null);
  }

  const sepPreviewLabel = sepId === "tab" ? "⇥ (tab)" : sepId === "space" ? "␣ (space)" : separator || "…";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="rounded-2xl border border-fg/10 bg-ink-800/60 p-4 backdrop-blur sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg/60">Your logins</h2>
            <span className="text-xs text-fg/40">
              {result.total.toLocaleString()} row{result.total === 1 ? "" : "s"}
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
              placeholder={
                "Paste your logins in any format…\n\njohn@acme.com:hunter2\njane@acme.com, s3cret!\nmike@acme.com | pa:ss:word\nsupport@acme.com\tletmein"
              }
              className="h-56 w-full resize-none rounded-xl bg-transparent p-4 font-mono text-sm text-fg/90 outline-none placeholder:text-fg/25"
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
            {fileName && <span className="text-xs text-fg/40">Loaded: {fileName}</span>}
            {text && (
              <button onClick={clearAll} className="text-xs text-fg/40 hover:text-fg/70">
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-fg/40">CSV · TXT · XLSX</span>
          </div>

          {error && <p className="mt-3 text-sm text-red-300 light:text-red-600">{error}</p>}

          {/* Separator picker */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-fg/40">Output separator</span>
              <span className="text-xs text-fg/50">
                email <span className="rounded bg-brand-500/15 px-1.5 py-0.5 text-brand-400 light:text-brand-600">{sepPreviewLabel}</span> password
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
                  <span className="ml-1.5 text-fg/40">{s.id === "custom" ? "" : s.char === "\t" ? "⇥" : s.char === " " ? "␣" : s.char}</span>
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
        </div>

        {/* Output */}
        <div className="rounded-2xl border border-fg/10 bg-ink-800/60 p-4 backdrop-blur sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg/60">
              Formatted {result.formatted > 0 && `· ${result.formatted.toLocaleString()}`}
            </h2>
            {result.formatted > 0 && (
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

          {result.formatted === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center text-sm text-fg/30">
              <div className="mb-2 text-3xl">🔐</div>
              Paste any email + password list on the left. It comes back here as clean
              <br className="hidden sm:block" /> <code className="text-fg/50">email{sepPreviewLabel}password</code> rows.
            </div>
          ) : (
            <textarea
              readOnly
              value={output}
              onFocus={(e) => e.currentTarget.select()}
              className="scroll-slim h-72 w-full resize-none rounded-xl border border-fg/10 bg-ink-900/60 p-4 font-mono text-sm text-fg/90 outline-none"
            />
          )}

          {/* Report */}
          {result.total > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Formatted" value={result.formatted.toLocaleString()} tone="good" />
              <Stat label="Duplicates" value={result.duplicates.toLocaleString()} sub={dedupe ? "removed" : "kept"} />
              <Stat label="No password" value={result.noPassword.toLocaleString()} sub={keepPasswordless ? "kept" : "skipped"} />
              <Stat label="No email" value={result.noEmail.length.toLocaleString()} sub="skipped" tone={result.noEmail.length ? "warn" : undefined} />
            </div>
          )}

          {result.noEmail.length > 0 && (
            <details className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-200 light:text-amber-800">
              <summary className="cursor-pointer select-none">
                {result.noEmail.length.toLocaleString()} line{result.noEmail.length === 1 ? "" : "s"} had no detectable email — click to review
              </summary>
              <pre className="scroll-slim mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-amber-200/80 light:text-amber-800/80">
                {result.noEmail.slice(0, 200).join("\n")}
                {result.noEmail.length > 200 ? `\n…and ${(result.noEmail.length - 200).toLocaleString()} more` : ""}
              </pre>
            </details>
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
