import fs from "fs";
import path from "path";

const TRANSCRIPT =
  "C:\\Users\\Athony\\.cursor\\projects\\c-Users-Athony-cursor-projects-empty-window-nj-stem-player-web\\agent-transcripts\\c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26\\c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26.jsonl";
const OUT_ROOT =
  "C:\\Users\\Athony\\.cursor\\projects\\empty-window\\nj-stem-player-web";

const PATH_MARKERS = [
  "C:\\Users\\Athony\\.cursor\\projects\\empty-window\\nj-stem-player-web",
  "C:/Users/Athony/.cursor/projects/empty-window/nj-stem-player-web",
  "e:\\1 - Work\\NJ Stem Player\\nj-stem-player-web",
  "E:/1 - Work/NJ Stem Player/nj-stem-player-web",
];

function normalizePath(raw) {
  let p = String(raw).replace(/\\/g, "/");
  for (const marker of PATH_MARKERS) {
    const m = marker.replace(/\\/g, "/");
    if (p.toLowerCase().startsWith(m.toLowerCase())) {
      return p.slice(m.length).replace(/^\/+/, "");
    }
  }
  const idx = p.toLowerCase().indexOf("nj-stem-player-web/");
  if (idx >= 0) return p.slice(idx + "nj-stem-player-web/".length);
  // Transcript sometimes uses paths relative to project root (no prefix).
  if (/^(src|public|scripts|lrc-builder|docs|fonts-source)\//i.test(p)) {
    return p;
  }
  if (/^(package\.json|vite\.config|tsconfig|index\.html|README\.md|\.gitignore|postcss|tailwind)/i.test(p)) {
    return p;
  }
  return null;
}

function applyStrReplace(content, oldStr, newStr, rel) {
  if (content.includes(oldStr)) return content.replace(oldStr, newStr);
  const oldN = oldStr.replace(/\r\n/g, "\n");
  const cN = content.replace(/\r\n/g, "\n");
  if (cN.includes(oldN)) return cN.replace(oldN, newStr.replace(/\r\n/g, "\n"));
  console.warn(`WARN: StrReplace miss: ${rel}`);
  return content;
}

const files = new Map();
let writeCount = 0;
let replaceCount = 0;
let skipped = 0;

for (const line of fs.readFileSync(TRANSCRIPT, "utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    continue;
  }
  const content = row?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const block of content) {
    if (block?.type !== "tool_use") continue;
    const name = block.name;
    const inp = block.input ?? {};
    const rawPath = inp.path;
    if (!rawPath) continue;
    const rel = normalizePath(rawPath);
    if (!rel) {
      skipped++;
      continue;
    }
    const key = rel.replace(/\\/g, "/");

    if (name === "Write") {
      if (inp.contents == null) continue;
      files.set(key, inp.contents);
      writeCount++;
    } else if (name === "StrReplace") {
      const { old_string: oldStr, new_string: newStr } = inp;
      if (oldStr == null || newStr == null) continue;
      if (!files.has(key)) {
        console.warn(`WARN: StrReplace before Write: ${key}`);
        continue;
      }
      files.set(key, applyStrReplace(files.get(key), oldStr, newStr, key));
      replaceCount++;
    }
  }
}

fs.mkdirSync(OUT_ROOT, { recursive: true });
let written = 0;
for (const [rel, text] of [...files.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const out = path.join(OUT_ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, text, "utf8");
  written++;
}

console.log(`Writes: ${writeCount}, StrReplaces: ${replaceCount}, skipped: ${skipped}, files: ${written}`);
console.log("Paths:", [...files.keys()].sort().join("\n"));
