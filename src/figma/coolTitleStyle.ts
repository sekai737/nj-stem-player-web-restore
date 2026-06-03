/**
 * Per-glyph COOL_FONT styles for the stem player track title (Figma node 3:282 / Title 26:216).
 * Sequence matches the exported “Supernatural” lettering in Figma (12 glyphs, then repeats).
 *
 * @see public/fonts/README.md — each face needs a matching `cool-font-*.woff2` in `public/fonts/`.
 */
export const COOL_TITLE_PATTERN = [
  "Simplified",
  "Goop",
  "Pixel",
  "Pix-Outlined",
  "Distorted",
  "Goop",
  "Pixel",
  "Fire",
  "Fluid",
  "Regular",
  "Structured",
  "Cloud",
] as const;

export type CoolTitleStyle = (typeof COOL_TITLE_PATTERN)[number];

/**
 * Distinct @font-face families for the title (Figma node 3:282 — “Supernatural” reference).
 * Used for `document.fonts.load` / readiness checks so missing WOFF2s are surfaced in dev.
 */
export const COOL_TITLE_FONT_FAMILIES = [...new Set(COOL_TITLE_PATTERN)].map(
  (style) => `COOL_FONT:${style}` as const,
);

const SLUG_BY_STYLE: Record<CoolTitleStyle, string> = {
  Simplified: "simplified",
  Goop: "goop",
  Pixel: "pixel",
  "Pix-Outlined": "pix-outlined",
  Distorted: "distorted",
  Fire: "fire",
  Fluid: "fluid",
  Regular: "regular",
  Structured: "structured",
  Cloud: "cloud",
};

/** `public/fonts` path for a COOL @font-face family (dev diagnostics). */
export function coolTitleFontHrefForFamily(family: string): string {
  const style = family.slice("COOL_FONT:".length) as CoolTitleStyle;
  const slug = SLUG_BY_STYLE[style];
  return `/fonts/cool-font-${slug}.woff2`;
}

/** Grapheme-aware split so composed characters keep one style. */
export function splitTitleGlyphs(title: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(title), (s) => s.segment);
  }
  return Array.from(title);
}

export function coolTitleGlyphClassForIndex(index: number): string {
  const style = COOL_TITLE_PATTERN[index % COOL_TITLE_PATTERN.length];
  const slug = SLUG_BY_STYLE[style];
  return `title-cool-glyph title-cool-glyph--${slug}`;
}
