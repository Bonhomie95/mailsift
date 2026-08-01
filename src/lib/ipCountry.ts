/**
 * Offline IPv4 → country lookup (server-only).
 *
 * This is the "free IP geolocation" signal: no paid API, no runtime network
 * calls. We ship a compact binary table compiled from the public-domain RIR
 * (ARIN/RIPE/APNIC/AFRINIC/LACNIC) delegation files — see
 * `scripts/build-ip-country.mjs`. Each record is 10 bytes, sorted by start IP:
 *
 *     [ startIP: uint32 BE ][ endIP: uint32 BE ][ country: 2 ASCII bytes ]
 *
 * If the asset hasn't been generated yet, `ipToCountry` returns null and the IP
 * signal simply abstains — the Country Sorter still works on its other signals.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isCountry } from "./countries";

const REC_BYTES = 10;
const DATA_PATH = join(process.cwd(), "src", "data", "ip-country.v4.bin");

let table: Buffer | null | undefined; // undefined = not tried, null = unavailable

function load(): Buffer | null {
  if (table !== undefined) return table;
  try {
    const buf = readFileSync(DATA_PATH);
    // Guard against a partial/corrupt file.
    table = buf.length >= REC_BYTES && buf.length % REC_BYTES === 0 ? buf : null;
  } catch {
    table = null; // asset not built — signal abstains
  }
  return table;
}

/** True when the embedded IP table is present (IP geo can contribute). */
export function ipGeoAvailable(): boolean {
  return load() !== null;
}

/** Parse a dotted-quad IPv4 string to an unsigned 32-bit int, or null. */
export function ipv4ToInt(ip: string): number | null {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  let n = 0;
  for (let i = 1; i <= 4; i++) {
    const oct = Number(m[i]);
    if (oct > 255) return null;
    n = n * 256 + oct;
  }
  return n >>> 0;
}

/** ISO-3166 country for an IPv4 address, or null if unknown / table absent. */
export function ipToCountry(ip: string): string | null {
  const buf = load();
  if (!buf) return null;
  const n = ipv4ToInt(ip);
  if (n === null) return null;

  let lo = 0;
  let hi = buf.length / REC_BYTES - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const off = mid * REC_BYTES;
    const start = buf.readUInt32BE(off);
    const end = buf.readUInt32BE(off + 4);
    if (n < start) hi = mid - 1;
    else if (n > end) lo = mid + 1;
    else {
      const cc = String.fromCharCode(buf[off + 8], buf[off + 9]).toUpperCase();
      return isCountry(cc) ? cc : null;
    }
  }
  return null;
}
