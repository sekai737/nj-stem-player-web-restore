import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const outDir = path.join(ROOT, "public", "figma");
const mapPath = path.join(__dirname, "figma-asset-urls.json");

/** Map transcript export names → public/figma paths in assets.ts */
const RENAME = {
  "home-inner.svg": "home.svg",
  "settings-inner.svg": "settings.svg",
  "play-fill.svg": "play.svg",
  "play-stroke.svg": "pause.svg",
  "pause-stroke.svg": "pause.svg",
  "icon-circle.png": "icon-circle.svg",
  "asset-d9ad41cf0d800b9366a0823a45a7f76eebcef5cc.svg": "background.svg",
  "asset-b230940bc83cd2306eaebe6e1d94bcd8d446600d.svg": "small-stars.svg",
};

const EXPECTED = [
  "home.svg",
  "settings.svg",
  "fullscreen.svg",
  "back-button.svg",
  "menu-button.svg",
  "send.svg",
  "fullscreen-play.svg",
  "vocal-icon.svg",
  "other-icon.svg",
  "bass-icon.svg",
  "drums-icon.svg",
  "now-playing.svg",
  "play.svg",
  "pause.svg",
  "previous-song.svg",
  "next-song.svg",
  "progress-bar.svg",
  "volume.svg",
  "drop-down.svg",
  "meter-text.svg",
  "stem-track.png",
  "stem-track-vocals.svg",
  "stem-track-other.svg",
  "stem-track-drums.svg",
  "stem-track-bass.svg",
  "solo-icon-default.svg",
  "solo-icon-clicked.svg",
  "mute-icon-default.svg",
  "mute-icon-clicked.svg",
  "background.svg",
  "small-stars.svg",
  "letterbox.png",
  "icon-circle.svg",
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

const map = JSON.parse(
  fs.readFileSync(mapPath, "utf8").replace(/^\uFEFF/, ""),
);
let ok = 0;
let fail = 0;
for (const [filename, url] of Object.entries(map)) {
  const targetName = RENAME[filename] ?? filename;
  const dest = path.join(outDir, targetName);
  try {
    const n = await download(url, dest);
    console.log("OK", targetName, n);
    ok++;
  } catch (e) {
    console.log("FAIL", filename, e.message);
    fail++;
  }
}
console.log(`\nDownloaded ${ok}, failed ${fail}`);
const missing = EXPECTED.filter(
  (f) => !fs.existsSync(path.join(outDir, f)),
);
if (missing.length) {
  console.log("Still missing:", missing.join(", "));
}
