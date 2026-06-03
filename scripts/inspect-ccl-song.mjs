#!/usr/bin/env node
/** Quick CCL section probe: node scripts/inspect-ccl-song.mjs <ccl-url> */

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/inspect-ccl-song.mjs <ccl-url>");
  process.exit(1);
}

const COLOR_MAP = {
  "#5d83f5": "Minji",
  "#eb5ea4": "Hanni",
  "#f7f55e": "Danielle",
  "#7cde68": "Haerin",
  "#975aed": "Hyein",
  "#828282": "Group",
};

const page = await (await fetch(url)).text();
const match = page.match(/<div class="card-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/article/i);
if (!match) {
  console.error("No .card-body found");
  process.exit(1);
}

const html = match[1];
const labels = ["Romanization", "Hangul", "Translation", "Credits"];
const hits = labels
  .map((label) => ({ label, idx: html.indexOf(`>${label}<`) }))
  .filter((h) => h.idx >= 0)
  .sort((a, b) => a.idx - b.idx);

for (const section of ["romanized", "original", "english"]) {
  const key =
    section === "romanized" ? "Romanization" : section === "original" ? "Hangul" : "Translation";
  const start = hits.find((h) => h.label === key)?.idx ?? -1;
  const endHit = hits.find((h) => h.idx > start && h.label !== key);
  const chunk = start >= 0 ? html.slice(start, endHit?.idx ?? html.length) : "";
  const lines = (chunk.match(/<br\s*\/?>/gi) ?? []).length + (chunk.match(/<p/gi) ?? []).length;
  const colors = [...new Set([...(chunk.matchAll(/color:\s*(#[0-9a-f]{6})/gi) ?? [])].map((m) => m[1].toLowerCase()))];
  const members = colors.map((c) => COLOR_MAP[c] ?? `?${c}`);
  console.log(`${key}: ~${lines} breaks, colors=${colors.join(", ")} → ${members.join(", ")}`);
}
