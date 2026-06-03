import type { MemberId } from "../types";

/** lyrics-plus `translate:display-mode` */
export type TranslationDisplay = "below" | "replace";

export type TranslationProvider = "none" | "local";

export type LanguageOverride = "off" | "ko" | "ja" | "en" | "mixed";

/** lyrics-plus display / conversion modes (pre-authored LRC layers). */
export type LyricsDisplayMode =
  | "original"
  | "romanized"
  | "translated"
  | "original-plus-romanized"
  | "original-plus-translation"
  | "original-plus-romanized-plus-translation";

export interface MergedLyricLine {
  id: string;
  time: number;
  startTimeMs: number;
  original?: string;
  romanized?: string;
  translation?: string;
  member: MemberId;
}

export type LyricLineVisualState = "active" | "nearby" | "far" | "hidden";

export interface LyricsViewSettings {
  translationProvider: TranslationProvider;
  translationDisplay: TranslationDisplay;
  languageOverride: LanguageOverride;
  displayMode: LyricsDisplayMode;
  /** lyrics-plus `translate` — show romanized stream when available. */
  convert: boolean;
  /** Number of lyric lines to preview before the active line (lyrics-plus `lines-before`). */
  linesBefore: number;
  /** Number of lyric lines to preview after the active line (lyrics-plus `lines-after`). */
  linesAfter: number;
  fadeBlur: boolean;
  showPerformers: boolean;
}

export const DEFAULT_LYRICS_VIEW_SETTINGS: LyricsViewSettings = {
  translationProvider: "local",
  translationDisplay: "below",
  languageOverride: "off",
  displayMode: "original",
  convert: false,
  linesBefore: 0,
  linesAfter: 2,
  fadeBlur: true,
  showPerformers: true,
};
