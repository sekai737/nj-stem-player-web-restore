import {
  COOL_TITLE_FONT_STYLES,
  coolTitleGlyphClassForIndex,
  coolTitleGlyphClassForStyle,
  resolveTitleGlyphClass,
  splitTitleGlyphs,
  type CoolTitleStyle,
} from "./coolTitleStyle";
import { displayStemPlayerTitle, displayTrackTitle } from "../utils/displayTrackTitle";

const FIXED_SUPERNATURAL_DISPLAY_TITLE = "Supernatural";

/** Bump when title font slots change (invalidates cached glyph classes). */
const ASSIGNMENT_CACHE_VERSION = 2;

const assignmentCache = new Map<string, string[]>();

/** Figma “Supernatural” lettering — fixed per-glyph pattern, never randomized. */
export function isFixedSupernaturalTitle(title: string): boolean {
  return displayTrackTitle(title) === FIXED_SUPERNATURAL_DISPLAY_TITLE;
}

function hashTitleSeed(title: string): number {
  let h = 2166136261;
  for (let i = 0; i < title.length; i++) {
    h ^= title.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandomizedStyle(
  fonts: readonly CoolTitleStyle[],
  prev: CoolTitleStyle | null,
  usage: Map<CoolTitleStyle, number>,
  rand: () => number,
): CoolTitleStyle {
  const minUsage = Math.min(...fonts.map((f) => usage.get(f) ?? 0));

  let pool = fonts.filter((f) => (usage.get(f) ?? 0) <= minUsage + 1);
  if (prev && pool.length > 1) {
    const withoutPrev = pool.filter((f) => f !== prev);
    if (withoutPrev.length > 0) pool = withoutPrev;
  }

  const weights = pool.map((f) => 1 / (1 + (usage.get(f) ?? 0)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rand() * total;

  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!;
  }

  return pool[pool.length - 1]!;
}

function buildRandomizedStyles(title: string, glyphCount: number): CoolTitleStyle[] {
  const rand = createSeededRandom(hashTitleSeed(title));
  const usage = new Map<CoolTitleStyle, number>(
    COOL_TITLE_FONT_STYLES.map((style) => [style, 0]),
  );

  const styles: CoolTitleStyle[] = [];
  let prev: CoolTitleStyle | null = null;

  for (let i = 0; i < glyphCount; i++) {
    const style = pickRandomizedStyle(COOL_TITLE_FONT_STYLES, prev, usage, rand);
    styles.push(style);
    usage.set(style, (usage.get(style) ?? 0) + 1);
    prev = style;
  }

  return styles;
}

function cacheKey(displayTitle: string): string {
  return `${ASSIGNMENT_CACHE_VERSION}:${displayTitle}`;
}

/** Deterministic per-title glyph class list (cached). */
export function getTitleGlyphClasses(title: string): string[] {
  const displayTitle = displayStemPlayerTitle(title);
  const key = cacheKey(displayTitle);
  const cached = assignmentCache.get(key);
  if (cached) return cached;

  const glyphs = splitTitleGlyphs(displayTitle);

  const classes = (
    isFixedSupernaturalTitle(title)
      ? glyphs.map((_, index) => coolTitleGlyphClassForIndex(index))
      : buildRandomizedStyles(displayTitle, glyphs.length).map((style) =>
          coolTitleGlyphClassForStyle(style),
        )
  ).map(resolveTitleGlyphClass);

  assignmentCache.set(key, classes);
  return classes;
}

/** Grapheme split paired with deterministic glyph classes for rendering. */
export function getTitleGlyphRenderData(title: string): { glyph: string; className: string }[] {
  const displayTitle = displayStemPlayerTitle(title);
  const glyphs = splitTitleGlyphs(displayTitle);
  const classes = getTitleGlyphClasses(title);

  return glyphs.map((glyph, index) => ({
    glyph,
    className: classes[index] ?? coolTitleGlyphClassForIndex(index),
  }));
}
