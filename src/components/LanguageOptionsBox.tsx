import "./language-options.css";
import { LYRICS_FIGMA } from "../figma/lyricsLayout";
import type { LyricLanguage, SongLrcFiles } from "../types";
import { usePlayerStore } from "../store/playerStore";

const LANG_OPTIONS: { id: LyricLanguage; label: string }[] = [
  { id: "org", label: "ORG" },
  { id: "rom", label: "ROM" },
  { id: "en", label: "EN" },
];

const ALL_OPTION: { id: LyricLanguage; label: string } = { id: "all", label: "ALL" };

const L = LYRICS_FIGMA.language;
const L4 = LYRICS_FIGMA.languageWithAll;

interface LanguageOptionsBoxProps {
  lrc?: SongLrcFiles;
  /** Fullscreen conversions — ORG / ROM / EN / ALL */
  includeAll?: boolean;
  /** Fill parent width (conversions panel) instead of fixed Figma width */
  fillContainer?: boolean;
}

export default function LanguageOptionsBox({
  lrc,
  includeAll = false,
  fillContainer = false,
}: LanguageOptionsBoxProps) {
  const lyricLanguage = usePlayerStore((s) => s.lyricLanguage);
  const setLyricLanguage = usePlayerStore((s) => s.setLyricLanguage);

  const options = includeAll ? [...LANG_OPTIONS, ALL_OPTION] : LANG_OPTIONS;
  const boxWidth = includeAll ? L4.width : L.width;
  const boxHeight = includeAll ? L4.height : L.height;

  return (
    <div
      role="tablist"
      aria-label="Lyrics language"
      className={`language-options-box ${includeAll ? "language-options-box--with-all" : ""}${fillContainer ? " language-options-box--fill" : ""}`}
      style={fillContainer ? { height: boxHeight } : { width: boxWidth, height: boxHeight }}
    >
      {options.map((opt) => {
        const available = opt.id === "all" ? true : Boolean(lrc?.[opt.id]);
        const selected = lyricLanguage === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-disabled={!available}
            disabled={!available}
            title={available ? undefined : `${opt.label} LRC not configured`}
            className={`language-options-box__option ${
              selected ? "language-options-box__option--selected lang-label-selected" : "lang-label-default"
            }`}
            onClick={() => {
              if (!available) return;
              setLyricLanguage(opt.id);
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
