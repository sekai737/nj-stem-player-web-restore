/** Hangul syllables + jamo */
const HAS_HANGUL = /[\uAC00-\uD7AF\u1100-\u11FF]/;
/** Hiragana + katakana */
const HAS_KANA = /[\u3040-\u309F\u30A0-\u30FF]/;
/** CJK unified ideographs (hanja / kanji) */
const HAS_CJK = /[\u4E00-\u9FFF]/;

export type LyricScriptRun = "kr" | "jp" | "latin";

export type LyricScriptVariant = "kr" | "jp" | null;

function classifyChar(ch: string, hasHangul: boolean, hasKana: boolean): LyricScriptRun {
  if (HAS_HANGUL.test(ch)) return "kr";
  if (HAS_KANA.test(ch)) return "jp";
  if (HAS_CJK.test(ch)) {
    if (hasKana && !hasHangul) return "jp";
    if (hasHangul) return "kr";
  }
  return "latin";
}

/** Split lyric text so Noto applies only to Korean/Japanese runs; Latin keeps Swiss. */
export function splitLyricScriptRuns(text: string): { script: LyricScriptRun; text: string }[] {
  if (!text) return [];

  const hasHangul = HAS_HANGUL.test(text);
  const hasKana = HAS_KANA.test(text);

  const runs: { script: LyricScriptRun; text: string }[] = [];
  let current = "";
  let currentScript: LyricScriptRun = "latin";

  for (const ch of text) {
    const script = classifyChar(ch, hasHangul, hasKana);
    if (!current) {
      current = ch;
      currentScript = script;
      continue;
    }
    if (script === currentScript) {
      current += ch;
    } else {
      runs.push({ script: currentScript, text: current });
      current = ch;
      currentScript = script;
    }
  }

  if (current) runs.push({ script: currentScript, text: current });
  return runs;
}

export function lyricRunClass(script: LyricScriptRun): string {
  if (script === "kr") return "lyric-run lyric-run--kr";
  if (script === "jp") return "lyric-run lyric-run--jp";
  return "lyric-run lyric-run--latin";
}
