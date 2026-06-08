import { getRelease, getSong } from "../data/catalog";
import { parseCatalogKey, isPlaceholderKey } from "./keyNotation";
import { metadataCacheKey } from "./trackMetadataDb";
import type { TrackMetadata, TrackMetadataRequest } from "./types";

export function buildTrackMetadataRequest(
  releaseId: string,
  songId: string,
): TrackMetadataRequest | null {
  const release = getRelease(releaseId);
  const song = getSong(releaseId, songId);
  if (!release || !song) return null;

  const albumMatch = release.spotifyUrl?.match(/album\/([A-Za-z0-9]+)/);

  return {
    releaseId,
    songId,
    releaseTitle: release.title,
    songTitle: song.title,
    releaseYear: release.year,
    durationSec: song.durationSec,
    catalogBpm: song.bpm,
    catalogKey: song.key,
    spotifyTrackId: song.spotifyTrackId,
    spotifyAlbumId: albumMatch?.[1],
  };
}

/** Real catalog values — not template rows with em-dash key. */
export function isCatalogMetadataComplete(request: TrackMetadataRequest): boolean {
  return !isPlaceholderKey(request.catalogKey) && request.catalogBpm > 0;
}

export function buildCatalogTrackMetadata(
  releaseId: string,
  songId: string,
  liveDurationSec?: number,
): TrackMetadata | null {
  const request = buildTrackMetadataRequest(releaseId, songId);
  if (!request) return null;

  const parsedKey = parseCatalogKey(request.catalogKey);
  const placeholder = isPlaceholderKey(request.catalogKey);

  return {
    cacheKey: metadataCacheKey(releaseId, songId),
    releaseId,
    songId,
    durationSec: liveDurationSec ?? request.durationSec,
    keyLabel: placeholder ? null : request.catalogKey,
    bpm: placeholder ? null : request.catalogBpm,
    year: request.releaseYear,
    popularity: null as number | null,
    keyNumber: parsedKey?.key,
    mode: parsedKey?.mode,
    tempo: placeholder ? undefined : request.catalogBpm,
    source: "catalog",
    isLoading: true,
  };
}
