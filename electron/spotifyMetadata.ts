import type { TrackMetadataRequest } from "./metadataTypes.js";

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

interface SpotifyAudioFeatures {
  id: string;
  tempo: number;
  key: number;
  mode: number;
  danceability: number;
  energy: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  valence: number;
  time_signature: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  album?: {
    release_date?: string;
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function getCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string | null> {
  const creds = getCredentials();
  if (!creds) return null;

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) return null;
  const data = (await response.json()) as SpotifyTokenResponse;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function spotifyGet<T>(
  path: string,
): Promise<{ data: T | null; status: number; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    console.warn("[spotify] No access token — check SPOTIFY_CLIENT_ID/SECRET in .env");
    return { data: null, status: 0, error: "no_token" };
  }

  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const snippet = (await response.text()).slice(0, 120);
    console.warn(`[spotify] GET ${path} → HTTP ${response.status}: ${snippet}`);
    return { data: null, status: response.status, error: snippet };
  }
  return { data: (await response.json()) as T, status: response.status };
}

function releaseYearFromDate(releaseDate?: string): number | undefined {
  if (!releaseDate) return undefined;
  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

function baseTitleForSearch(title: string): string {
  return title.replace(/\s*[\(\[].*?[\)\]]\s*/g, " ").trim() || title.trim();
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function titlesMatch(expected: string, actual: string): boolean {
  const expectedNorm = normalizeTitle(baseTitleForSearch(expected));
  const actualNorm = normalizeTitle(baseTitleForSearch(actual));
  if (!expectedNorm || !actualNorm) return false;
  return actualNorm.includes(expectedNorm) || expectedNorm.includes(actualNorm);
}

function isPlaceholderDuration(catalogSec: number): boolean {
  // Many catalog rows use 200 as a template placeholder.
  return catalogSec === 200;
}

function durationMatches(catalogSec: number, spotifyMs: number): boolean {
  if (isPlaceholderDuration(catalogSec)) return true;
  const spotifySec = Math.round(spotifyMs / 1000);
  return Math.abs(spotifySec - catalogSec) <= 10;
}

async function resolveTrack(
  request: TrackMetadataRequest,
): Promise<SpotifyTrack | null> {
  if (request.spotifyTrackId) {
    const tracks = await spotifyGet<{ tracks: (SpotifyTrack | null)[] }>(
      `/tracks?ids=${encodeURIComponent(request.spotifyTrackId)}`,
    );
    return tracks.data?.tracks?.[0] ?? null;
  }

  const title = request.songTitle.replace(/"/g, "").trim();
  const album = request.releaseTitle.replace(/"/g, "").trim();
  const baseTitle = baseTitleForSearch(title);

  const queries = [
    `track:"${title}" artist:NewJeans album:"${album}"`,
    `track:"${baseTitle}" artist:NewJeans album:"${album}"`,
    `track:"${title}" artist:NewJeans`,
    `track:"${baseTitle}" artist:NewJeans`,
  ];

  for (const query of queries) {
    const search = await spotifyGet<{ tracks?: { items?: SpotifyTrack[] } }>(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
    );
    const items = search.data?.tracks?.items ?? [];
    for (const item of items) {
      if (!titlesMatch(title, item.name)) continue;
      if (!durationMatches(request.durationSec, item.duration_ms)) continue;
      return item;
    }
  }

  console.warn(
    `[spotify] No track match for "${request.songTitle}" (${request.releaseTitle})`,
  );
  return null;
}

/** Public Spotify Web API — search + track info. BPM/key need /audio-features (blocked on new dev apps). */
export async function fetchSpotifyTrackMetadata(request: TrackMetadataRequest) {
  if (!getCredentials()) {
    console.warn("[spotify] Credentials missing — copy .env.example to .env");
    return null;
  }

  const track = await resolveTrack(request);
  if (!track) return null;

  const [featuresResult, tracksResult] = await Promise.all([
    spotifyGet<{ audio_features: (SpotifyAudioFeatures | null)[] }>(
      `/audio-features?ids=${encodeURIComponent(track.id)}`,
    ),
    spotifyGet<{ tracks: (SpotifyTrack | null)[] }>(
      `/tracks?ids=${encodeURIComponent(track.id)}`,
    ),
  ]);

  const features = featuresResult.data?.audio_features?.[0] ?? null;
  const trackDetails = tracksResult.data?.tracks?.[0] ?? track;

  if (featuresResult.status === 403) {
    console.warn(
      "[spotify] /audio-features returned 403 — Spotify no longer grants BPM/key to new Developer apps. " +
        "Add real values to catalog.json (spicetify-dj-info uses Spotify Desktop's internal API, not this one).",
    );
  }

  if (!features) {
    // Still return track id + popularity/year when available; BPM/key stay empty.
    if (tracksResult.status !== 200) return null;
    return {
      spotifyTrackId: track.id,
      popularity: trackDetails.popularity,
      releaseYear:
        releaseYearFromDate(trackDetails.album?.release_date) ?? request.releaseYear,
      durationSec: Math.round(trackDetails.duration_ms / 1000),
    };
  }

  return {
    spotifyTrackId: track.id,
    tempo: features.tempo,
    keyNumber: features.key >= 0 ? features.key : undefined,
    mode: features.mode >= 0 ? features.mode : undefined,
    danceability: Math.round(features.danceability * 100),
    energy: Math.round(features.energy * 100),
    acousticness: Math.round(features.acousticness * 100),
    instrumentalness: Math.round(features.instrumentalness * 100),
    liveness: Math.round(features.liveness * 100),
    loudness: features.loudness,
    speechiness: Math.round(features.speechiness * 100),
    valence: Math.round(features.valence * 100),
    timeSignature: features.time_signature,
    popularity: trackDetails.popularity,
    releaseYear:
      releaseYearFromDate(trackDetails.album?.release_date) ?? request.releaseYear,
    durationSec: Math.round(trackDetails.duration_ms / 1000),
  };
}
