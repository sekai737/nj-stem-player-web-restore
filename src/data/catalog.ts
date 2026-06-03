import raw from "./catalog.json";
import type { Catalog, Release, Song } from "../types";

export const catalog = raw as Catalog;

export function getReleases(): Release[] {
  return [...catalog.releases].sort((a, b) => b.year - a.year);
}

export function getRelease(releaseId: string): Release | undefined {
  return catalog.releases.find((r) => r.id === releaseId);
}

export function getSong(releaseId: string, songId: string): Song | undefined {
  return getRelease(releaseId)?.songs.find((s) => s.id === songId);
}

export function getSongIndex(release: Release, songId: string): number {
  return release.songs.findIndex((s) => s.id === songId);
}

export type SongLocation = { releaseId: string; songId: string };

/** Next/previous track in release order (newest→oldest), crossing releases at boundaries. */
export function getAdjacentSong(
  releaseId: string,
  songId: string,
  direction: "next" | "previous",
): SongLocation | undefined {
  const releases = getReleases();
  const releaseIndex = releases.findIndex((r) => r.id === releaseId);
  if (releaseIndex < 0) return undefined;

  const release = releases[releaseIndex]!;
  const songIndex = getSongIndex(release, songId);
  if (songIndex < 0) return undefined;

  if (direction === "next") {
    if (songIndex < release.songs.length - 1) {
      return { releaseId, songId: release.songs[songIndex + 1]!.id };
    }
    const nextRelease = releases[releaseIndex + 1];
    const first = nextRelease?.songs[0];
    if (!first) return undefined;
    return { releaseId: nextRelease.id, songId: first.id };
  }

  if (songIndex > 0) {
    return { releaseId, songId: release.songs[songIndex - 1]!.id };
  }
  const prevRelease = releases[releaseIndex - 1];
  const last = prevRelease?.songs.at(-1);
  if (!prevRelease || !last) return undefined;
  return { releaseId: prevRelease.id, songId: last.id };
}
