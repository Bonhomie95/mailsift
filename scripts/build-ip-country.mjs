#!/usr/bin/env node
/**
 * Build the offline IPv4 → country table used by the Country Sorter's free
 * IP-geolocation signal (src/lib/ipCountry.ts).
 *
 * Source: the five Regional Internet Registries publish public-domain
 * "delegated-extended" statistics that map IP ranges to countries. We download
 * them, keep the IPv4 allocations, merge + sort by start IP, and pack each range
 * into a compact 10-byte record:
 *
 *     [ startIP: uint32 BE ][ endIP: uint32 BE ][ country: 2 ASCII bytes ]
 *
 * Output: src/data/ip-country.v4.bin  (~1–2 MB, server-side asset only).
 *
 * Run:  node scripts/build-ip-country.mjs
 * No API keys, no cost. Re-run periodically to refresh allocations.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RIR_URLS = [
  "https://ftp.ripe.net/pub/stats/ripencc/delegated-ripencc-extended-latest",
  "https://ftp.arin.net/pub/stats/arin/delegated-arin-extended-latest",
  "https://ftp.apnic.net/pub/stats/apnic/delegated-apnic-extended-latest",
  "https://ftp.afrinic.net/pub/stats/afrinic/delegated-afrinic-extended-latest",
  "https://ftp.lacnic.net/pub/stats/lacnic/delegated-lacnic-extended-latest",
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "ip-country.v4.bin");

function ipToInt(ip) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n > 255)) return null;
  return ((p[0] * 256 + p[1]) * 256 + p[2]) * 256 + p[3];
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function main() {
  /** @type {{start:number,end:number,cc:string}[]} */
  const ranges = [];

  for (const url of RIR_URLS) {
    process.stdout.write(`Fetching ${url} … `);
    let text;
    try {
      text = await fetchText(url);
    } catch (e) {
      console.log(`SKIP (${e.message})`);
      continue;
    }
    let kept = 0;
    for (const line of text.split("\n")) {
      if (!line || line[0] === "#") continue;
      // registry|cc|type|start|value|date|status|...
      const f = line.split("|");
      if (f.length < 7 || f[2] !== "ipv4") continue;
      const cc = f[1];
      if (!/^[A-Za-z]{2}$/.test(cc) || cc.toUpperCase() === "ZZ") continue;
      const status = f[6];
      if (status !== "allocated" && status !== "assigned") continue;
      const start = ipToInt(f[3]);
      const count = Number(f[4]);
      if (start === null || !Number.isFinite(count) || count < 1) continue;
      ranges.push({ start, end: start + count - 1, cc: cc.toUpperCase() });
      kept++;
    }
    console.log(`${kept.toLocaleString()} ranges`);
  }

  if (ranges.length === 0) {
    console.error("No ranges parsed — aborting (network blocked?).");
    process.exit(1);
  }

  ranges.sort((a, b) => a.start - b.start);

  const buf = Buffer.alloc(ranges.length * 10);
  let off = 0;
  for (const r of ranges) {
    buf.writeUInt32BE(r.start >>> 0, off);
    buf.writeUInt32BE(r.end >>> 0, off + 4);
    buf[off + 8] = r.cc.charCodeAt(0);
    buf[off + 9] = r.cc.charCodeAt(1);
    off += 10;
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, buf);
  console.log(
    `\nWrote ${OUT}\n${ranges.length.toLocaleString()} ranges · ${(buf.length / 1024 / 1024).toFixed(2)} MB`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
