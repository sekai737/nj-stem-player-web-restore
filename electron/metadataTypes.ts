/** Shared with renderer metadata module — keep fields in sync with src/metadata/types.ts */
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
