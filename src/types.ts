export type ReleaseType = "EP" | "Album" | "Single";

export type MemberId =
  | "minji"
  | "hanni"
  | "danielle"
  | "haerin"
  | "hyein"
  | "group"
  | "pharrell";

export type LyricLanguage = "org" | "rom" | "en" | "all";

export type StemId = "vocals" | "instruments" | "drums" | "bass";

export interface StemTrack {
  id: StemId;
  label: string;
  /** Path under /public, e.g. /stems/supernatural/supernatural-vocals.flac */
  src?: string;
}

/** Paths to per-language `.lrc` files under /public. */
export interface SongLrcFiles {
  org?: string;
  rom?: string;
  en?: string;
}

export interface LyricLine {
  time: number;
  text: string;
  member: MemberId;
}

export type RemixCategory = "official" | "sekai";

/** Remix variant browsable from the song selection page. */
export interface RemixItem {
  id: string;
  title: string;
  /** Where the remix is from — e.g. "AAA2024" or "sekai" (lowercase). */
  source: string;
  category: RemixCategory;
  /** Catalog song id within the same release; opens the stem player when selected. */
  songId: string;
  coverArt?: string;
  durationSec?: number;
}

export interface Song {
  id: string;
  title: string;
  durationSec: number;
  bpm: number;
  key: string;
  /** Omit to use release cover: /covers/{release.title}_album_cover.jpg */
  artwork?: string;
  /** Omit to use /stems/{releaseId}/{slug}-{stem}.flac (see stemSlug). */
  stems: StemTrack[];
  /** Pre-mixed master for fullscreen; auto-derived as {slug}-master.flac when using stem convention. */
  masterSrc?: string;
  /** When set, Download Stems (.zip) packs these paths instead of `stems`. */
  stemsZipFiles?: string[];
  /** Path under /public, e.g. /midi/supernatural/supernatural-title.mid */
  midi?: string;
  /** Filename prefix when it differs from release id (e.g. shared stems across remixes). */
  stemSlug?: string;
  lrc?: SongLrcFiles;
  /** Omit from the main song carousel; reachable via remix list only. */
  isRemix?: boolean;
  /** Remix variants associated with this base track. */
  remixes?: RemixItem[];
  /** Optional Spotify track id for metadata enrichment. */
  spotifyTrackId?: string;
}

export interface Release {
  id: string;
  title: string;
  year: number;
  type: ReleaseType;
  /** Omit to use /covers/{title}_album_cover.jpg */
  coverArt?: string;
  /** Opens when the home page card cover art is clicked. */
  spotifyUrl?: string;
  songs: Song[];
}

export interface Catalog {
  creator: {
    youtube: string;
    litLink: string;
  };
  releases: Release[];
}
