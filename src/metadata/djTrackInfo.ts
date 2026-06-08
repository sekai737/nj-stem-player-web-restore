import { keyModeToLabel } from "./keyNotation";
import type { DjAnalysisFields, SpotifyEnrichmentPayload } from "./types";

/** Port of spicetify-dj-info `DjTrackInfo.fromQueries`. */
export function djTrackInfoFromSpotify(payload: SpotifyEnrichmentPayload): DjAnalysisFields {
  return {
    keyNumber: payload.keyNumber,
    mode: payload.mode,
    tempo: payload.tempo != null ? Math.round(payload.tempo) : undefined,
    energy: payload.energy != null ? Math.round(payload.energy) : undefined,
    danceability: payload.danceability != null ? Math.round(payload.danceability) : undefined,
    acousticness: payload.acousticness != null ? Math.round(payload.acousticness) : undefined,
    instrumentalness:
      payload.instrumentalness != null ? Math.round(payload.instrumentalness) : undefined,
    liveness: payload.liveness != null ? Math.round(payload.liveness) : undefined,
    loudness:
      payload.loudness != null
        ? Math.round(10 * Number.parseFloat(String(payload.loudness))) / 10
        : undefined,
    speechiness: payload.speechiness != null ? Math.round(payload.speechiness) : undefined,
    valence: payload.valence != null ? Math.round(payload.valence) : undefined,
    timeSignature: payload.timeSignature,
    popularity: payload.popularity,
    releaseYear: payload.releaseYear,
  };
}

export function keyLabelFromAnalysis(fields: DjAnalysisFields, fallbackKey: string): string | null {
  if (
    fields.keyNumber != null &&
    fields.mode != null &&
    fields.keyNumber >= 0 &&
    fields.keyNumber <= 11
  ) {
    const label = keyModeToLabel(fields.keyNumber, fields.mode);
    if (label) return label;
  }
  return fallbackKey.trim() || null;
}

export function isSpotifyAnalysisComplete(fields: DjAnalysisFields): boolean {
  return (
    fields.acousticness != null &&
    !Number.isNaN(fields.acousticness) &&
    fields.tempo != null &&
    fields.tempo > 0
  );
}
