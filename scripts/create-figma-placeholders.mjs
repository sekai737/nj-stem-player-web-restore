import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "..", "public", "figma");

function write(name, svg) {
  const dest = path.join(out, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 200) return;
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(dest, svg.trim() + "\n", "utf8");
  console.log("placeholder", name);
}

const label = (text, w) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="28" viewBox="0 0 ${w} 28"><text x="0" y="22" fill="#fff" font-family="Jersey 10, sans-serif" font-size="24">${text}</text></svg>`;

const icon = (letter, fill = "#fff") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="4" y="26" fill="${fill}" font-family="COOL_FONT, monospace" font-size="28">${letter}</text></svg>`;

write("stem-track-vocals.svg", label("Vocals", 108));
write("stem-track-other.svg", label("Other", 95));
write("stem-track-drums.svg", label("Drums", 105));
write("stem-track-bass.svg", label("Bass", 77));
write("solo-icon-default.svg", icon("s"));
write("solo-icon-clicked.svg", icon("s", "#58fe33"));
write("mute-icon-default.svg", icon("m"));
write("mute-icon-clicked.svg", icon("m", "#f13600"));
write("other-icon.svg", label("Other", 95));
write("now-playing.svg", label("Now Playing", 140));
write("meter-text.svg", label("Meters", 76));
write("play.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="32" viewBox="0 0 28 32"><polygon points="4,2 26,16 4,30" fill="#fff"/></svg>`);
write("pause.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="32" viewBox="0 0 28 32"><rect x="4" y="2" width="8" height="28" fill="#fff"/><rect x="16" y="2" width="8" height="28" fill="#fff"/></svg>`);
write("volume.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="17" viewBox="0 0 24 17"><path d="M0 6h6l6-6v22l-6-6H0z" fill="#fff"/></svg>`);
write("send.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" viewBox="0 0 48 46"><polygon points="4,23 44,4 30,23 44,42" fill="#fff"/></svg>`);
write(
  "fullscreen-play.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="32" viewBox="0 0 28 32"><polygon points="4,2 26,16 4,30" fill="#fff"/></svg>`,
);
write("background.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c2e4fd"/><stop offset="100%" stop-color="#01acfe"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);

console.log("done");
