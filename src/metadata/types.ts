/** Normalized DJ metadata (aligned with spicetify-dj-info DjTrackInfo). */
export interface DjAnalysisFields {
  keyNumber?: number;
  mode?: number;
  tempo?: number;
  energy?: number;
  danceability?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  loudness?: number;
  speechiness?: number;
  valence?: number;
  timeSignature?: number;
  popularity?: number;
  releaseYear?: number;
}

/** Display-ready metadata for the current track. */
export interface TrackMetadata extends DjAnalysisFields {
  cacheKey: string;
  releaseId: string;
  songId: string;
  durationSec: number | null;
  keyLabel: string | null;
  bpm: number | null;
  year: number | null;
  spotifyTrackId?: string;
  source: "catalog" | "spotify" | "merged";
  isLoading: boolean;
}

export interface TrackMetadataRequest {
  releaseId: string;
  songId: string;
  releaseTitle: string;
  songTitle: string;
  releaseYear: number;
  durationSec: number;
  catalogBpm: number;
  catalogKey: string;
  spotifyTrackId?: string;
  spotifyAlbumId?: string;
}

export interface SpotifyEnrichmentPayload {
  spotifyTrackId: string;
  tempo?: number;
  keyNumber?: number;
  mode?: number;
  popularity?: number;
  releaseYear?: number;
  durationSec?: number;
  energy?: number;
  danceability?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  loudness?: number;
  speechiness?: number;
  valence?: number;
  timeSignature?: number;
}

export const METADATA_UNKNOWN = "Unknown";
