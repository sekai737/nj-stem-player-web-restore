import { usePlayerStore } from "../../store/playerStore";
import "./playback-mode-toggle.css";

interface PlaybackModeToggleProps {
  masterMixAvailable: boolean;
}

/** Stems vs master mix — segmented control (matches language options box). */
export default function PlaybackModeToggle({ masterMixAvailable }: PlaybackModeToggleProps) {
  const useStems = usePlayerStore((s) => s.fullscreenUseStems);
  const setUseStems = usePlayerStore((s) => s.setFullscreenUseStems);

  return (
    <div
      role="group"
      aria-label="Playback source"
      className="playback-mode-toggle"
    >
      <button
        type="button"
        className={`playback-mode-toggle__option${
          useStems ? " playback-mode-toggle__option--selected lang-label-selected" : " lang-label-default"
        }`}
        aria-pressed={useStems}
        onClick={() => setUseStems(true)}
      >
        Stems
      </button>
      <button
        type="button"
        className={`playback-mode-toggle__option${
          !useStems
            ? " playback-mode-toggle__option--selected lang-label-selected"
            : " lang-label-default"
        }`}
        aria-pressed={!useStems}
        disabled={!masterMixAvailable}
        title={masterMixAvailable ? undefined : "Master mix not available for this track"}
        onClick={() => {
          if (!masterMixAvailable) return;
          setUseStems(false);
        }}
      >
        Master
      </button>
    </div>
  );
}
