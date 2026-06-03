import type {
  LyricsDisplayMode,
  LyricsViewSettings,
  LyricLineVisualState,
  MergedLyricLine,
} from "../types/lyricsPlus";

const PAUSE_RE = /^[♪…\.]+$/u;

export function isPauseLine(text: string | undefined): boolean {
  if (!text) return true;
  const t = text.trim();
  return t === "" || PAUSE_RE.test(t);
}

export function getActiveMergedLyricIndex(lines: MergedLyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1;
  let index = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.time <= currentTime) index = i;
    else break;
  }
  return index;
}

/** lyrics-plus SyncedLyricsPage window: lines before/after active (skip pause lines in count). */
export function getVisibleLyricWindow(
  lines: MergedLyricLine[],
  activeIndex: number,
  linesBefore: number,
  linesAfter: number,
): { lines: MergedLyricLine[]; activeWindowIndex: number } {
  if (activeIndex < 0 || lines.length === 0) {
    return { lines: [], activeWindowIndex: 0 };
  }

  let start = activeIndex;
  if (linesBefore > 0) {
    let visibleBefore = 0;
    const targetBefore = linesBefore + 1;
    while (start > 0 && visibleBefore < targetBefore) {
      start--;
      if (!isPauseLine(lines[start]?.original)) visibleBefore++;
    }
  }

  let end = activeIndex;
  let visibleAfter = 0;
  const targetAfter = linesAfter + 1;
  while (end < lines.length - 1 && visibleAfter < targetAfter) {
    end++;
    if (!isPauseLine(lines[end]?.original)) visibleAfter++;
  }

  return {
    lines: lines.slice(start, end + 1),
    activeWindowIndex: activeIndex - start,
  };
}

export function getLyricDistance(index: number, activeIndex: number): number {
  return index - activeIndex;
}

export function getLyricLineVisualState(
  distance: number,
  fadeBlur: boolean,
): LyricLineVisualState {
  if (distance === 0) return "active";
  if (!fadeBlur) return distance === 1 ? "nearby" : "far";

  const abs = Math.abs(distance);
  if (abs === 1) return "nearby";
  if (abs >= 2) return "hidden";
  return "far";
}

/** lyrics-plus: primary line vs secondary (below-origin) from stream + originalText. */
export function resolveLyricLineDisplay(
  line: MergedLyricLine,
  settings: LyricsViewSettings,
): { primary: string; secondary?: string } {
  const org = line.original?.trim() ?? "";
  const rom = line.romanized?.trim();
  const en =
    settings.translationProvider !== "none" ? line.translation?.trim() : undefined;
  const showBelow = settings.translationDisplay === "below";

  let stream = org;
  let originalText = org;

  if (settings.convert && rom) {
    stream = rom;
    originalText = org;
  } else {
    switch (settings.displayMode) {
      case "romanized":
        stream = rom ?? org;
        originalText = org;
        break;
      case "translated":
        stream = en ?? org;
        originalText = org;
        break;
      case "original-plus-romanized":
        if (showBelow && org && rom) {
          return { primary: org, secondary: rom };
        }
        stream = org;
        break;
      case "original-plus-translation":
        if (showBelow && org && en) {
          return { primary: org, secondary: en };
        }
        stream = org;
        break;
      case "original-plus-romanized-plus-translation": {
        if (showBelow) {
          const parts = [rom, en].filter(Boolean);
          return parts.length ? { primary: org, secondary: parts.join("\n") } : { primary: org };
        }
        stream = org;
        break;
      }
      default:
        stream = org;
    }
  }

  if (settings.translationDisplay === "replace" && en) {
    return { primary: en };
  }

  if (showBelow && originalText && stream && normalizeCompare(originalText) !== normalizeCompare(stream)) {
    return { primary: originalText, secondary: stream };
  }

  if (showBelow && en && normalizeCompare(stream) === normalizeCompare(org)) {
    return { primary: org, secondary: en };
  }

  return { primary: stream || org };
}

function normalizeCompare(text: string): string {
  return text.replace(/\s+/g, "");
}

export function displayModeLabel(mode: LyricsDisplayMode): string {
  switch (mode) {
    case "original":
      return "ORG";
    case "romanized":
      return "Romaji";
    case "translated":
      return "EN";
    case "original-plus-romanized":
      return "ORG + ROM";
    case "original-plus-translation":
      return "ORG + EN";
    case "original-plus-romanized-plus-translation":
      return "ORG + ROM + EN";
    default:
      return "ORG";
  }
}

export function applyLanguageTab(mode: "org" | "rom" | "en"): Partial<LyricsViewSettings> {
  switch (mode) {
    case "rom":
      return { displayMode: "romanized", convert: true, translationProvider: "local" };
    case "en":
      return {
        displayMode: "translated",
        convert: false,
        translationProvider: "local",
        translationDisplay: "replace",
      };
    default:
      return { displayMode: "original", convert: false };
  }
}
