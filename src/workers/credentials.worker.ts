/// <reference lib="webworker" />
/**
 * Off-main-thread engine for the Login Sorter.
 *
 * A large uploaded database export is streamed here chunk by chunk so parsing
 * never blocks the page: the UI keeps painting a progress bar and live row
 * count while this worker chews through the file. It keeps the parsed rows in
 * memory so re-applying formatting options (separator, dedupe, sort…) is instant
 * and never re-reads the file.
 */
import {
  createParseState,
  parseLinesInto,
  assemble,
  type ParseState,
  type FormatOptions,
} from "../lib/credentials";

// The last file/text we parsed lives here, so a "reformat" reuses it.
let state: ParseState | null = null;

const PREVIEW_CAP = 500; // lines shown live; full result is in the blobs.
const PROGRESS_EVERY = 20_000; // rows between progress posts while streaming.

const post = (msg: unknown, transfer?: Transferable[]) =>
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, transfer ?? []);

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data as
    | { kind: "file"; file: Blob; options: FormatOptions }
    | { kind: "text"; text: string; options: FormatOptions }
    | { kind: "reformat"; options: FormatOptions }
    | { kind: "download"; options: FormatOptions; format: "txt" | "csv" };

  try {
    if (msg.kind === "file") {
      await ingestFile(msg.file);
      emitResult(msg.options);
    } else if (msg.kind === "text") {
      state = createParseState();
      parseLinesInto(state, msg.text.split(/\r?\n/));
      emitResult(msg.options);
    } else if (msg.kind === "reformat") {
      emitResult(msg.options);
    } else if (msg.kind === "download") {
      emitDownload(msg.options, msg.format);
    }
  } catch (err) {
    post({ kind: "error", message: err instanceof Error ? err.message : "Worker failed." });
  }
};

async function ingestFile(file: Blob): Promise<void> {
  state = createParseState();
  const total = file.size;
  const reader = file.stream().getReader();
  const decoder = new TextDecoder();
  let remainder = "";
  let read = 0;
  let sinceProgress = 0;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    read += value.byteLength;
    const combined = remainder + decoder.decode(value, { stream: true });
    const parts = combined.split(/\r?\n/);
    remainder = parts.pop() ?? ""; // last piece may be a partial line
    parseLinesInto(state, parts);
    sinceProgress += parts.length;
    if (sinceProgress >= PROGRESS_EVERY) {
      post({ kind: "progress", read, total, parsed: state.rows.length });
      sinceProgress = 0;
    }
  }
  const tail = remainder + decoder.decode();
  if (tail.trim()) parseLinesInto(state, [tail]);
  post({ kind: "progress", read: total, total, parsed: state.rows.length });
}

function emitResult(options: FormatOptions): void {
  if (!state) return;
  const { lines, stats } = assemble(state, options);
  const preview = lines.slice(0, PREVIEW_CAP).join("\n");
  const txtBlob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  post({ kind: "result", preview, previewShown: Math.min(lines.length, PREVIEW_CAP), stats, txtBlob });
}

function emitDownload(options: FormatOptions, format: "txt" | "csv"): void {
  if (!state) return;
  const { lines, rows } = assemble(state, options);
  if (format === "csv") {
    const body = rows
      .map((r) => `"${r.email.replace(/"/g, '""')}","${r.password.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([`"email","password"\n${body}`], { type: "text/csv;charset=utf-8" });
    post({ kind: "blob", blob, format });
  } else {
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    post({ kind: "blob", blob, format });
  }
}
