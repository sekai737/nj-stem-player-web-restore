import type { LyricLine, SongLrcFiles } from "../types";
import type { MergedLyricLine } from "../types/lyricsPlus";
import { isPauseLine } from "./lyricsDisplay";

const TIME_EPS = 0.05;

/** True if at least one layer has real lyric text (not `...` / ♪ pause slots). */
export function hasDisplayableLyricContent(line: MergedLyricLine): boolean {
  return [line.original, line.romanized, line.translation].some(
    (text) => Boolean(text?.trim()) && !isPauseLine(text),
  );
}

function findAtTime(lines: LyricLine[], time: number): LyricLine | undefined {
  return lines.find((l) => Math.abs(l.time - time) < TIME_EPS);
}

/** Merge org / rom / en `.lrc` layers by timestamp (lyrics-plus pre-authored layers). */
export function mergeLyricLayers(
  org: LyricLine[],
  rom: LyricLine[],
  en: LyricLine[],
): MergedLyricLine[] {
  const times = new Set<number>();
  for (const line of [...org, ...rom, ...en]) {
    times.add(line.time);
  }

  return [...times]
    .sort((a, b) => a - b)
    .map((time) => {
      const o = findAtTime(org, time);
      const r = findAtTime(rom, time);
      const e = findAtTime(en, time);
      const member = o?.member ?? r?.member ?? e?.member ?? "group";
      return {
        id: `lyric-${Math.round(time * 1000)}`,
        time,
        startTimeMs: Math.round(time * 1000),
        original: o?.text,
        romanized: r?.text,
        translation: e?.text,
        member,
      };
    })
    .filter(hasDisplayableLyricContent);
}

export function hasLyricLayers(lrc?: SongLrcFiles): boolean {
  return Boolean(lrc && (lrc.org || lrc.rom || lrc.en));
}
