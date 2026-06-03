import type { FullscreenLyricMode } from "../../utils/fullscreenLyrics";

const MODES: { id: FullscreenLyricMode; label: string }[] = [
  { id: "org", label: "ORG" },
  { id: "rom", label: "ROM" },
  { id: "en", label: "EN" },
  { id: "all", label: "ALL" },
];

interface FullscreenLyricTabsProps {
  mode: FullscreenLyricMode;
  onChange: (mode: FullscreenLyricMode) => void;
}

export default function FullscreenLyricTabs({ mode, onChange }: FullscreenLyricTabsProps) {
  return (
    <div className="fs-lyric-tabs" role="tablist" aria-label="Lyric display mode">
      {MODES.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={mode === opt.id}
          className={`fs-lyric-tabs__btn ${mode === opt.id ? "fs-lyric-tabs__btn--active" : ""}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
