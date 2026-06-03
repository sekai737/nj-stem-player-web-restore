/**
 * Generates short silent MP3 placeholders so the mixer UI can load stems locally.
 * Replace these with your real separated stems when ready.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "stems", "demo");

// Minimal valid MP3 frame (silent-ish stub) — browsers may still fail decode;
// prefer replacing with real MP3 exports from your DAW.
const stub = Buffer.from(
  "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVV",
  "base64",
);

const files = ["vocals.mp3", "instruments.mp3", "drums.mp3", "bass.mp3"];

await mkdir(outDir, { recursive: true });
for (const name of files) {
  await writeFile(join(outDir, name), stub);
  console.log("wrote", name);
}

console.log("\nAdd real stem MP3s to public/stems/<song-id>/ and update catalog.json paths.");
