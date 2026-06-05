import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TRANSCRIPT =
  process.argv[2] ||
  "C:/Users/Athony/.cursor/projects/c-Users-Athony-cursor-projects-empty-window-nj-stem-player-web/agent-transcripts/c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26/c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26.jsonl";

const filter = process.argv[3] || "public/figma/";

const PATH_MARKERS = [
  ROOT.replace(/\\/g, "/"),
  "g:/1 - work/nj stem player",
  "e:/1 - work/nj stem player",
  "C:/Users/Athony/.cursor/projects/empty-window/nj-stem-player-web",
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
  if (/^(public|src)\//i.test(p)) return p;
  return null;
}

const files = new Map();
for (const line of fs.readFileSync(TRANSCRIPT, "utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    continue;
  }
  for (const block of row?.message?.content || []) {
    if (block?.type !== "tool_use" || block.name !== "Write") continue;
    const rel = normalizePath(block.input?.path);
    if (!rel || !rel.replace(/\\/g, "/").includes(filter)) continue;
    files.set(rel.replace(/\\/g, "/"), block.input.contents);
  }
}

let written = 0;
for (const [rel, contents] of files) {
  const dest = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, contents, "utf8");
  console.log("Wrote", rel, contents.length);
  written++;
}
console.log(`\n${written} file(s) under *${filter}*`);
