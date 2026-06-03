/** Hangul syllables + jamo */
const HAS_HANGUL = /[\uAC00-\uD7AF\u1100-\u11FF]/;
/** Hiragana + katakana */
const HAS_KANA = /[\u3040-\u309F\u30A0-\u30FF]/;

export type FullscreenLyricFontVariant = "kr" | "jp" | "regular";

/** Pick Noto face for a fullscreen lyric bubble line from its script. */
export function getFullscreenLyricFontVariant(text: string): FullscreenLyricFontVariant {
  if (HAS_HANGUL.test(text)) return "kr";
  if (HAS_KANA.test(text)) return "jp";
  return "regular";
}

export function fullscreenLyricFontClass(variant: FullscreenLyricFontVariant): string {
  return `fs-lyric-bubble__line--${variant}`;
}
