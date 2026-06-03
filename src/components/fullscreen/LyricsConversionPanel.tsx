import type { TranslationDisplay } from "../../types/lyricsPlus";
import type { SongLrcFiles } from "../../types";
import { usePlayerStore } from "../../store/playerStore";
import LanguageOptionsBox from "../LanguageOptionsBox";
import PlaybackModeToggle from "./PlaybackModeToggle";

interface LyricsConversionPanelProps {
  lrc?: SongLrcFiles;
  masterMixAvailable: boolean;
}

/** Fullscreen menu — lyrics conversions and playback options. */
export default function LyricsConversionPanel({
  lrc,
  masterMixAvailable,
}: LyricsConversionPanelProps) {
  const settings = usePlayerStore((s) => s.lyricsViewSettings);
  const setSettings = usePlayerStore((s) => s.setLyricsViewSettings);

  return (
    <aside
      className="fs-conversion-panel"
      aria-label="Fullscreen settings"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <h3 className="fs-conversion-panel__title">Playback</h3>

      <div className="fs-conversion-panel__section fs-conversion-panel__section--playback">
        <PlaybackModeToggle masterMixAvailable={masterMixAvailable} />
        {!masterMixAvailable ? (
          <p className="fs-conversion-panel__hint">Master mix not available for this track.</p>
        ) : null}
      </div>

      <h3 className="fs-conversion-panel__title">Conversions</h3>

      <div className="fs-conversion-panel__section">
        <LanguageOptionsBox lrc={lrc} includeAll fillContainer />
      </div>

      <label className="fs-conversion-panel__field">
        <span>Translation Display</span>
        <select
          value={settings.translationDisplay}
          onChange={(e) =>
            setSettings({ translationDisplay: e.target.value as TranslationDisplay })
          }
        >
          <option value="below">Below original</option>
          <option value="replace">Replace original</option>
        </select>
      </label>
    </aside>
  );
}
