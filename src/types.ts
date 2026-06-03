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
  src: string;
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

export interface Song {
  id: string;
  title: string;
  durationSec: number;
  bpm: number;
  key: string;
  artwork: string;
  stems: StemTrack[];
  /** When set, Download Stems (.zip) packs these files; `[0]` is the pre-mixed master for fullscreen. */
  stemsZipFiles?: string[];
  /** Path under /public, e.g. /midi/supernatural/supernatural-title.mid */
  midi?: string;
  lrc?: SongLrcFiles;
}

export interface Release {
  id: string;
  title: string;
  year: number;
  type: ReleaseType;
  coverArt: string;
  songs: Song[];
}

export interface Catalog {
  creator: {
    twitter: string;
    linktree: string;
  };
  releases: Release[];
}
