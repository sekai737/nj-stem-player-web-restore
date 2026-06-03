/** Hangul syllables + jamo */
const HAS_HANGUL = /[\uAC00-\uD7AF\u1100-\u11FF]/;
/** Hiragana + katakana */
const HAS_KANA = /[\u3040-\u309F\u30A0-\u30FF]/;

export type LyricScriptVariant = "kr" | "jp" | null;

/** Korean/Japanese lines use Noto; Latin/English keep the base lyric font. */
export function getLyricScriptVariant(text: string): LyricScriptVariant {
  if (HAS_HANGUL.test(text)) return "kr";
  if (HAS_KANA.test(text)) return "jp";
  return null;
}

/** Appends `--kr` / `--jp` modifier to a BEM block (e.g. `lyric-line-main`). */
export function lyricLineClass(baseClass: string, text: string): string {
  const variant = getLyricScriptVariant(text);
  return variant ? `${baseClass} ${baseClass}--${variant}` : baseClass;
}
