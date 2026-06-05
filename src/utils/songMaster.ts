import type { Song } from "../types";
import { resolveSongMasterSrc } from "./stemPaths";

/** Pre-mixed master path for fullscreen playback. */
export function getSongMasterSrc(song: Song, releaseId?: string): string | undefined {
  if (song.masterSrc) return song.masterSrc;
  if (releaseId) return resolveSongMasterSrc(releaseId, song);
  return song.stemsZipFiles?.[0];
}

export function songHasMasterMix(song: Song): boolean {
  return Boolean(getSongMasterSrc(song));
}
