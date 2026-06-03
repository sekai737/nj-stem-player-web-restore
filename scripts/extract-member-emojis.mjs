import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "members");
fs.mkdirSync(outDir, { recursive: true });

const pairs = [
  ["minji", "members-lyrics-minji.svg"],
  ["hanni", "members-lyrics-hanni.svg"],
];

for (const [id, file] of pairs) {
  const svg = fs.readFileSync(path.join(root, "public", "figma", file), "utf8");
  const match = svg.match(/xlink:href="data:image\/png;base64,([^"]+)"/);
  if (!match) {
    console.error(`No embedded PNG in ${file}`);
    process.exitCode = 1;
    continue;
  }
  const out = path.join(outDir, `emoji-${id}.png`);
  fs.writeFileSync(out, Buffer.from(match[1], "base64"));
  console.log(`Wrote ${out} (${fs.statSync(out).size} bytes)`);
}
