import type { Song } from "../types";

/** Pre-mixed master path (first `stemsZipFiles` entry when present). */
export function getSongMasterSrc(song: Song): string | undefined {
  return song.stemsZipFiles?.[0];
}

export function songHasMasterMix(song: Song): boolean {
  return Boolean(getSongMasterSrc(song));
}
