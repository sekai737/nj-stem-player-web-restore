import {
  buildCatalogTrackMetadata,
  buildTrackMetadataRequest,
  isCatalogMetadataComplete,
} from "./catalogBaseline";
import {
  djTrackInfoFromSpotify,
  isSpotifyAnalysisComplete,
  keyLabelFromAnalysis,
} from "./djTrackInfo";
import { displayBpm, displayYear, isPlaceholderKey } from "./keyNotation";
import {
  getMemoryCached,
  getPersistedCached,
  metadataCacheKey,
  setCachedMetadata,
  type CachedTrackMetadata,
} from "./trackMetadataDb";
import type { SpotifyEnrichmentPayload, TrackMetadata, TrackMetadataRequest } from "./types";

type DjAnalysisFieldsLike = ReturnType<typeof djTrackInfoFromSpotify>;

/**
 * Merge Spotify analysis into catalog baseline.
 * Catalog is authoritative when complete (spicetify-dj-info always uses Spotify because
 * Spotify IS the source; here catalog.json is primary and Spotify fills placeholder rows only).
 */
function mergeMetadata(
  baseline: TrackMetadata,
  analysis: DjAnalysisFieldsLike,
  request: TrackMetadataRequest,
  spotifyTrackId?: string,
): TrackMetadata {
  const placeholder = isPlaceholderKey(request.catalogKey);
  const spotifyBpm = displayBpm(analysis.tempo);
  const spotifyKey = keyLabelFromAnalysis(analysis, "");

  const bpm = placeholder ? (spotifyBpm ?? null) : (baseline.bpm ?? spotifyBpm);
  const keyLabel = placeholder ? (spotifyKey ?? null) : (baseline.keyLabel ?? spotifyKey);
  const year = displayYear(analysis.releaseYear ?? baseline.year) ?? baseline.year;

  return {
    ...baseline,
    ...analysis,
    spotifyTrackId: spotifyTrackId ?? baseline.spotifyTrackId,
    bpm,
    keyLabel,
    year,
    popularity: analysis.popularity ?? baseline.popularity ?? null,
    tempo: bpm ?? undefined,
    source: spotifyTrackId ? "merged" : baseline.source,
    isLoading: false,
  };
}

async function loadCachedAnalysis(cacheKey: string): Promise<CachedTrackMetadata | null> {
  const memory = getMemoryCached(cacheKey);
  if (memory && isSpotifyAnalysisComplete(memory)) return memory;

  const persisted = await getPersistedCached(cacheKey);
  if (persisted && isSpotifyAnalysisComplete(persisted)) return persisted;
  return null;
}

async function fetchSpotifyEnrichment(
  request: TrackMetadataRequest,
): Promise<SpotifyEnrichmentPayload | null> {
  if (typeof window !== "undefined" && window.electronAPI?.fetchTrackMetadata) {
    try {
      return await window.electronAPI.fetchTrackMetadata(request);
    } catch {
      return null;
    }
  }
  return null;
}

/** spicetify-dj-info-style cache-or-fetch for the current catalog track. */
export async function resolveTrackMetadata(
  releaseId: string,
  songId: string,
  liveDurationSec?: number,
): Promise<TrackMetadata | null> {
  const baseline = buildCatalogTrackMetadata(releaseId, songId, liveDurationSec);
  if (!baseline) return null;

  const request = buildTrackMetadataRequest(releaseId, songId);
  if (!request) {
    return { ...baseline, isLoading: false };
  }

  // Catalog already has real key + BPM — do not fetch or merge Spotify (avoids wrong search matches).
  if (isCatalogMetadataComplete(request)) {
    return { ...baseline, isLoading: false };
  }

  const cacheKey = metadataCacheKey(releaseId, songId);
  const cached = await loadCachedAnalysis(cacheKey);
  if (cached) {
    return mergeMetadata(baseline, cached, request, cached.spotifyTrackId);
  }

  const spotifyPayload = await fetchSpotifyEnrichment(request);
  if (!spotifyPayload) {
    return { ...baseline, isLoading: false };
  }

  const analysis = djTrackInfoFromSpotify(spotifyPayload);
  if (!isSpotifyAnalysisComplete(analysis)) {
    return { ...baseline, isLoading: false };
  }

  const merged = mergeMetadata(baseline, analysis, request, spotifyPayload.spotifyTrackId);

  await setCachedMetadata(cacheKey, {
    ...analysis,
    spotifyTrackId: spotifyPayload.spotifyTrackId,
    cachedAt: Date.now(),
  });

  return merged;
}
