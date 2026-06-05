import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const transcript =
  process.argv[2] ||
  "C:/Users/Athony/.cursor/projects/c-Users-Athony-cursor-projects-empty-window-nj-stem-player-web/agent-transcripts/c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26/c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26.jsonl";

const text = fs.readFileSync(transcript, "utf8");
const map = new Map();

// PowerShell hashtable in transcript JSON: \"file.svg\" = \"http://...\"
const psRe =
  /\\"([^"\\]+\.(?:svg|png))\\"\s*=\s*\\"(http:\/\/localhost:3845\/assets\/[^"\\]+)\\"/g;
let m;
while ((m = psRe.exec(text))) map.set(m[1], m[2]);

// Plain JSON / source strings
const plainRe =
  /"([^"]+\.(?:svg|png))"\s*=\s*"(http:\/\/localhost:3845\/assets\/[^"]+)"/g;
while ((m = plainRe.exec(text))) map.set(m[1], m[2]);

// Filename hints near asset URLs in design context exports
const urlRe = /http:\/\/localhost:3845\/assets\/[a-f0-9]+\.(?:svg|png)/g;
const urls = [...new Set(text.match(urlRe) || [])];
for (const url of urls) {
  const hash = url.split("/").pop().split(".")[0];
  if (![...map.values()].includes(url)) {
    map.set(`asset-${hash}${url.endsWith(".png") ? ".png" : ".svg"}`, url);
  }
}

console.log(JSON.stringify(Object.fromEntries(map), null, 2));
