import type { LyricLine } from "../types";

export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (lyrics.length === 0) return -1;
  let index = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentTime) index = i;
    else break;
  }
  return index;
}

/** Opening `[00:00.00] …` / `...` slot before the first sung line. */
function isOpeningPlaceholder(line: LyricLine): boolean {
  return line.time === 0 && /^\.{2,}$|^…$/u.test(line.text.trim());
}

/** Show member pill once the first lyric line is active (not the pre-song opening slot). */
export function shouldShowMemberLyrics(lyrics: LyricLine[], currentTime: number): boolean {
  const index = getActiveLyricIndex(lyrics, currentTime);
  if (index < 0) return false;

  const active = lyrics[index];
  if (currentTime < active.time) return false;

  if (
    lyrics.length > 1 &&
    index === 0 &&
    isOpeningPlaceholder(lyrics[0]) &&
    currentTime < lyrics[1].time
  ) {
    return false;
  }

  return true;
}

export function getActiveLyric(
  lyrics: LyricLine[],
  currentTime: number,
): LyricLine | undefined {
  const index = getActiveLyricIndex(lyrics, currentTime);
  return index >= 0 ? lyrics[index] : undefined;
}

export function getNextLyric(
  lyrics: LyricLine[],
  currentTime: number,
): LyricLine | undefined {
  const index = getActiveLyricIndex(lyrics, currentTime);
  if (index < 0) return lyrics[0];
  return lyrics[index + 1];
}
