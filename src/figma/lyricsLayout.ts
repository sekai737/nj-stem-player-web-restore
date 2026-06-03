import { FIGMA } from "./layout";

/** Lyrics container (node 26:214) — sizes from Figma layout constants */
export const LYRICS_FIGMA = {
  container: {
    width: FIGMA.titleRow.lyricsWidth,
    height: 120,
    radius: 95,
    gap: 24,
    paddingX: 48,
    paddingY: 24,
  },
  /** Member Lyrics Box (node 3:54) — width is content-driven from name length */
  memberBox: {
    height: 40,
    paddingX: 24,
    paddingY: 4,
    gap: 8,
    radius: 60,
    emojiSize: 32,
    nameSize: 24,
  },
  /** Synced lyrics — node 3:45 (active 24px), preview lines 16px; line slot +4px per lyrics-plus */
  lyrics: {
    mainSize: 24,
    previewSize: 16,
    lineGap: 4,
    mainLineHeight: 28,
    previewLineHeight: 20,
  },
  /** Language options box (node 3:188) — 3 options */
  language: {
    width: 212,
    height: 40,
    outerRadius: 36,
    innerRadius: 25,
    gap: 4,
    optionWidth: 68,
    optionHeight: 40,
    paddingX: 16,
    paddingY: 14,
    fontSize: 16,
  },
  /** Same control with ALL (fullscreen conversions) — 4 × 68 + 3 × gap */
  languageWithAll: {
    width: 284,
    height: 40,
    optionWidth: 68,
  },
} as const;
