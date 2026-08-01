/**
 * Shared export / download helpers used by both the Mail Sorter and the Country
 * Sorter. Pure functions + tiny DOM helpers — no component state. Extracted from
 * Sorter.tsx so the two tools don't duplicate them.
 */

/** Read an uploaded file to text, expanding spreadsheets to CSV via SheetJS. */
export async function readFileToText(file: File): Promise<string> {
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

/** Human "Xh Ym" until a target timestamp (for quota-reset countdowns). */
export function formatCountdown(target: number): string {
  const ms = Math.max(0, target - Date.now());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "<1m";
}

/** Rows → CSV text (quoted, CRLF-safe). */
export function tableToCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, rows: string[][]) {
  downloadBlob(filename, new Blob([tableToCsv(rows)], { type: "text/csv;charset=utf-8" }));
}

export function downloadText(filename: string, content: string) {
  downloadBlob(filename, new Blob([content], { type: "text/plain;charset=utf-8" }));
}

/** Filesystem-safe slug for export filenames. */
export function fileSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "bucket";
}

/** Compact local timestamp, e.g. "20260801-143205". */
export function fileStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
