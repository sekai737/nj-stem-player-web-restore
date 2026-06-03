import { readFileSync } from "node:fs";
import { mergeLyricLayers } from "../src/utils/mergeLyrics.ts";
import { parseLrc } from "../src/utils/lrcParser.ts";
import { getLyricBubbleLines, isSameLyricText, normalizeLyricText } from "../src/utils/fullscreenLyrics.ts";

const root = new URL("../public/lyrics/", import.meta.url);
const org = parseLrc(readFileSync(new URL("supernatural-org.lrc", root), "utf8"));
const rom = parseLrc(readFileSync(new URL("supernatural-rom.lrc", root), "utf8"));
const en = parseLrc(readFileSync(new URL("supernatural-en.lrc", root), "utf8"));
const merged = mergeLyricLayers(org, rom, en);
const below = { translationDisplay: "below" };

const suspects = [];
for (const line of merged) {
  const bubbles = getLyricBubbleLines(line, "all", below);
  if (bubbles.length < 2) continue;
  const latin = bubbles.filter((t) => /[a-zA-Z]/.test(t));
  if (latin.length >= 2) {
    const dupes = [];
    for (let i = 0; i < latin.length; i++) {
      for (let j = i + 1; j < latin.length; j++) {
        if (isSameLyricText(latin[i], latin[j])) dupes.push([latin[i], latin[j]]);
      }
    }
    if (dupes.length === 0) continue;
    suspects.push({
      time: line.time,
      bubbles,
      org: line.original,
      rom: line.romanized,
      en: line.translation,
    });
  }
}

console.log(`Suspects (2+ latin bubble lines): ${suspects.length}`);
for (const s of suspects.slice(0, 25)) {
  console.log("\n---", s.time);
  console.log("org:", s.org);
  console.log("rom:", s.rom);
  console.log("en:", s.en);
  console.log("bubbles:", s.bubbles);
  if (s.rom && s.en) {
    console.log("rom===en?", isSameLyricText(s.rom, s.en));
    console.log("norm rom:", normalizeLyricText(s.rom));
    console.log("norm en:", normalizeLyricText(s.en));
  }
}
