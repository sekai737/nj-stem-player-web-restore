import raw from "./catalog.json";
import type { Catalog, Release, RemixCategory, RemixItem, Song } from "../types";
import { enrichSong } from "../utils/stemPaths";

export const catalog = raw as Catalog;

const enrichedSongCache = new Map<string, Song>();

/** Default cover filename: `{title}_album_cover.jpg` under /public/covers. */
export function albumCoverPath(title: string): string {
  return `/covers/${encodeURIComponent(`${title}_album_cover.jpg`)}`;
}

export function getReleaseCoverArt(release: Release): string {
  return release.coverArt ?? albumCoverPath(release.title);
}

export function getSongArtwork(song: Song, release: Release): string {
  return song.artwork ?? getReleaseCoverArt(release);
}

export function getRemixCoverArt(remix: RemixItem, release: Release): string {
  return remix.coverArt ?? getReleaseCoverArt(release);
}

export function getReleases(): Release[] {
  return [...catalog.releases].sort((a, b) => b.year - a.year);
}

export function getRelease(releaseId: string): Release | undefined {
  return catalog.releases.find((r) => r.id === releaseId);
}

export function getSong(releaseId: string, songId: string): Song | undefined {
  const cacheKey = `${releaseId}/${songId}`;
  const cached = enrichedSongCache.get(cacheKey);
  if (cached) return cached;

  const song = getRelease(releaseId)?.songs.find((s) => s.id === songId);
  if (!song) return undefined;

  const enriched = enrichSong(releaseId, song);
  enrichedSongCache.set(cacheKey, enriched);
  return enriched;
}

/** Base tracks shown in the song carousel (excludes remix-only entries). */
export function getSelectableSongs(release: Release): Song[] {
  return release.songs.filter((song) => !song.isRemix);
}

export function getRemixesForSong(releaseId: string, songId: string): RemixItem[] {
  return getSong(releaseId, songId)?.remixes ?? [];
}

export function groupRemixesByCategory(
  remixes: RemixItem[],
): Record<RemixCategory, RemixItem[]> {
  return {
    official: remixes.filter((remix) => remix.category === "official"),
    sekai: remixes.filter((remix) => remix.category === "sekai"),
  };
}

export function findParentSongForRemix(release: Release, songId: string): Song | undefined {
  return release.songs.find((song) => song.remixes?.some((remix) => remix.songId === songId));
}

/** Remix order matches RemixSection: official, then sekai. */
export function getOrderedRemixes(releaseId: string, parentSongId: string): RemixItem[] {
  const { official, sekai } = groupRemixesByCategory(getRemixesForSong(releaseId, parentSongId));
  return [...official, ...sekai];
}

export function getSongIndex(release: Release, songId: string): number {
  const songs = getSelectableSongs(release);
  const directIndex = songs.findIndex((s) => s.id === songId);
  if (directIndex >= 0) return directIndex;

  const parentSong = findParentSongForRemix(release, songId);
  if (!parentSong) return -1;
  return songs.findIndex((s) => s.id === parentSong.id);
}

export type SongLocation = { releaseId: string; songId: string };

function getAdjacentRemixSong(
  releaseId: string,
  parentSongId: string,
  songId: string,
  direction: "next" | "previous",
): SongLocation | undefined {
  const { official, sekai } = groupRemixesByCategory(getRemixesForSong(releaseId, parentSongId));
  const officialIndex = official.findIndex((remix) => remix.songId === songId);
  const sekaiIndex = sekai.findIndex((remix) => remix.songId === songId);

  if (officialIndex >= 0) {
    if (direction === "next") {
      const nextOfficial = official[officialIndex + 1];
      if (nextOfficial) return { releaseId, songId: nextOfficial.songId };
      const firstSekai = sekai[0];
      return firstSekai ? { releaseId, songId: firstSekai.songId } : undefined;
    }
    const prevOfficial = official[officialIndex - 1];
    return prevOfficial ? { releaseId, songId: prevOfficial.songId } : undefined;
  }

  if (sekaiIndex >= 0) {
    if (direction === "next") {
      const nextSekai = sekai[sekaiIndex + 1];
      return nextSekai ? { releaseId, songId: nextSekai.songId } : undefined;
    }
    if (sekaiIndex > 0) {
      return { releaseId, songId: sekai[sekaiIndex - 1]!.songId };
    }
    const lastOfficial = official.at(-1);
    return lastOfficial ? { releaseId, songId: lastOfficial.songId } : undefined;
  }

  return undefined;
}

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
  const parentSong = findParentSongForRemix(release, songId);
  if (parentSong) {
    return getAdjacentRemixSong(releaseId, parentSong.id, songId, direction);
  }

  const songs = getSelectableSongs(release);
  const songIndex = getSongIndex(release, songId);
  if (songIndex < 0) return undefined;

  if (direction === "next") {
    if (songIndex < songs.length - 1) {
      return { releaseId, songId: songs[songIndex + 1]!.id };
    }
    const nextRelease = releases[releaseIndex + 1];
    const first = nextRelease ? getSelectableSongs(nextRelease)[0] : undefined;
    if (!first) return undefined;
    return { releaseId: nextRelease.id, songId: first.id };
  }

  if (songIndex > 0) {
    return { releaseId, songId: songs[songIndex - 1]!.id };
  }
  const prevRelease = releases[releaseIndex - 1];
  const prevSongs = prevRelease ? getSelectableSongs(prevRelease) : [];
  const last = prevSongs.at(-1);
  if (!prevRelease || !last) return undefined;
  return { releaseId: prevRelease.id, songId: last.id };
}
