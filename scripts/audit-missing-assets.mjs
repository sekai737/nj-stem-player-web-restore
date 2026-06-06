import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1:")), "..");

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel.replace(/^\//, "")));
}

/** Paths referenced in figma/assets.ts */
const figmaAssets = [
  "public/figma/home.svg",
  "public/figma/settings.svg",
  "public/figma/fullscreen.svg",
  "public/figma/back-button.svg",
  "public/figma/menu-button.svg",
  "public/figma/send.svg",
  "public/figma/fullscreen-play.svg",
  "public/figma/vocal-icon.svg",
  "public/figma/other-icon.svg",
  "public/figma/bass-icon.svg",
  "public/figma/drums-icon.svg",
  "public/figma/now-playing.svg",
  "public/figma/play.svg",
  "public/figma/pause.svg",
  "public/figma/previous-song.svg",
  "public/figma/next-song.svg",
  "public/figma/progress-bar.svg",
  "public/figma/volume.svg",
  "public/figma/drop-down.svg",
  "public/figma/meter-text.svg",
  "public/figma/stem-track.png",
  "public/figma/stem-track-vocals.svg",
  "public/figma/stem-track-other.svg",
  "public/figma/stem-track-drums.svg",
  "public/figma/stem-track-bass.svg",
  "public/figma/solo-icon-default.svg",
  "public/figma/solo-icon-clicked.svg",
  "public/figma/mute-icon-default.svg",
  "public/figma/mute-icon-clicked.svg",
  "public/figma/background.svg",
  "public/figma/small-stars.svg",
  "public/figma/letterbox.png",
  "public/figma/icon-circle.svg",
  "public/figma/meters-label.svg",
];

const fonts = [
  "public/fonts/Swiss-721-Regular.woff2",
  "public/fonts/Swiss-721-Medium.woff2",
  "public/fonts/Swiss-721-Light.woff2",
  "public/fonts/NotoSansKR-Regular.woff2",
  "public/fonts/NotoSansKR-Light.woff2",
  "public/fonts/NotoSansJP-Regular.woff2",
  "public/fonts/NotoSansJP-Light.woff2",
  "public/fonts/cool-font-cloud.woff2",
  "public/fonts/cool-font-simplified.woff2",
  "public/fonts/cool-font-goop.woff2",
  "public/fonts/cool-font-pixel.woff2",
  "public/fonts/cool-font-ball.woff2",
  "public/fonts/cool-font-distorted.woff2",
  "public/fonts/cool-font-fire.woff2",
  "public/fonts/cool-font-fluid.woff2",
  "public/fonts/cool-font-regular.woff2",
  "public/fonts/cool-font-structured.woff2",
  "public/fonts/ALL-STAR.woff2",
];

const members = [
  "public/members/portrait-minji.png",
  "public/members/portrait-hanni.png",
  "public/members/portrait-danielle.png",
  "public/members/portrait-haerin.png",
  "public/members/portrait-hyein.png",
  "public/members/emoji-minji.png",
  "public/members/emoji-hanni.png",
  "public/members/emoji-danielle.png",
  "public/members/emoji-haerin.png",
  "public/members/emoji-hyein.png",
  "public/members/emoji-group.png",
  "public/members/portrait-pharrell.png",
  "public/members/pharrell-microphone.png",
  "public/members/portrait-sekai.png",
];

const missing = (label, list) => {
  const m = list.filter((p) => !exists(p));
  if (m.length) console.log(`\n## ${label} (${m.length})`);
  for (const p of m) console.log(`  - ${p}`);
  return m;
};

console.log("# Missing assets audit\n");
const all = [
  ...missing("Figma UI assets (src/figma/assets.ts)", figmaAssets),
  ...missing("Fonts (CSS / code references)", fonts),
  ...missing("Member images (src/data/members.ts)", members),
];

if (!exists("public/lyrics")) {
  console.log("\n## Lyrics directory");
  console.log("  - public/lyrics/ (entire folder — no .lrc files)");
}

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/catalog.json"), "utf8"));
const lrcPaths = [];
for (const rel of catalog.releases ?? []) {
  for (const song of rel.songs ?? []) {
    if (song.lrc) {
      for (const [lang, p] of Object.entries(song.lrc)) {
        if (p) lrcPaths.push({ song: song.id, lang, path: p.replace(/^\//, "public/") });
      }
    }
  }
}
if (lrcPaths.length) {
  const missLrc = lrcPaths.filter(({ path: p }) => !exists(p));
  if (missLrc.length) {
    console.log(`\n## Catalog LRC paths (${missLrc.length})`);
    for (const { song, lang, path: p } of missLrc) console.log(`  - ${p} (${song} ${lang})`);
    all.push(...missLrc.map((x) => x.path));
  }
} else {
  console.log("\n## Catalog LRC");
  console.log("  - No lrc fields in catalog.json (inline lyrics only)");
}

console.log(`\n---\nTotal missing referenced paths: ${all.length}`);
