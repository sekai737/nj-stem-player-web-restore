import type { LyricLanguage } from "../types";
import type { MergedLyricLine, TranslationDisplay } from "../types/lyricsPlus";

export type FullscreenLyricMode = "org" | "rom" | "en" | "all";

export interface LyricBubbleDisplayOptions {
  translationDisplay: TranslationDisplay;
}

/** Standard song playback timecode (`mm:ss`, or `h:mm:ss` when hours are present). */
export function formatLyricTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Loose match for lyric dedupe — letters/digits only after NFKD (handles
 * ASCII vs curly quotes, NBSP, punctuation, etc.).
 */
export function normalizeLyricText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function isSameLyricText(a: string, b: string): boolean {
  const na = normalizeLyricText(a);
  const nb = normalizeLyricText(b);
  return na.length > 0 && na === nb;
}

function distinctLayers(...layers: (string | undefined)[]): string[] {
  const out: string[] = [];
  for (const layer of layers) {
    const text = layer?.trim();
    if (!text) continue;
    if (out.some((existing) => isSameLyricText(existing, text))) continue;
    out.push(text);
  }
  return out;
}

/** Original on top; only romanization/translation lines that differ from org and each other. */
function belowOriginal(org: string | undefined, ...layers: (string | undefined)[]): string[] {
  const original = org?.trim();
  const below: string[] = [];

  for (const layer of layers) {
    const text = layer?.trim();
    if (!text) continue;
    if (original && isSameLyricText(original, text)) continue;
    if (below.some((existing) => isSameLyricText(existing, text))) continue;
    below.push(text);
  }

  if (!original) return below;
  if (below.length === 0) return [original];
  return [original, ...below];
}

function conversionLayersForLanguage(
  language: LyricLanguage,
  rom: string | undefined,
  en: string | undefined,
): (string | undefined)[] {
  switch (language) {
    case "rom":
      return [rom];
    case "en":
      return [en];
    case "all":
      return [rom, en];
    default:
      return [];
  }
}

/** Chat bubble lines: original first; conversions follow per language + display mode. */
export function getLyricBubbleLines(
  line: MergedLyricLine,
  language: LyricLanguage,
  options: LyricBubbleDisplayOptions,
): string[] {
  const org = line.original?.trim();
  const rom = line.romanized?.trim();
  const en = line.translation?.trim();
  const showBelow = options.translationDisplay === "below";

  if (language === "org") {
    return org ? [org] : [];
  }

  const layers = conversionLayersForLanguage(language, rom, en);

  if (showBelow) {
    return belowOriginal(org, ...layers);
  }

  const conversions = distinctLayers(...layers);
  if (conversions.length > 0) return conversions;
  return org ? [org] : [];
}
