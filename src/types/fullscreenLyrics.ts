import type { MemberId } from "../types";

export type LyricsDisplayMode =
  | "original"
  | "romanized"
  | "translated"
  | "original-plus-romanized"
  | "original-plus-translation"
  | "original-plus-romanized-plus-translation";

export type TranslationDisplay = "hidden" | "below-origin" | "above-origin" | "replace-origin";

export type TranslationProvider = "none" | "local";
export type LanguageOverride = "off" | "ko" | "ja" | "en" | "mixed";

export interface MergedLyricLine {
  id: string;
  /** Seconds — aligned with player `currentTime`. */
  time: number;
  startTimeMs: number;
  original?: string;
  romanized?: string;
  translation?: string;
  member: MemberId;
}

export type LyricLineVisualState = "active" | "nearby" | "far";

export interface FullscreenLyricsSettings {
  translationProvider: TranslationProvider;
  translationDisplay: TranslationDisplay;
  languageOverride: LanguageOverride;
  displayMode: LyricsDisplayMode;
}

export const DEFAULT_FULLSCREEN_LYRICS_SETTINGS: FullscreenLyricsSettings = {
  translationProvider: "local",
  translationDisplay: "below-origin",
  languageOverride: "off",
  displayMode: "original-plus-romanized",
};
