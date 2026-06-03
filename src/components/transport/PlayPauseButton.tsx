import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";

interface PlayPauseButtonProps {
  isPlaying: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const P = FIGMA.progress;

/** Play / Pause control (Figma play.svg / pause.svg, 20×22). */
export default function PlayPauseButton({ isPlaying, disabled = false, onClick }: PlayPauseButtonProps) {
  return (
    <button
      type="button"
      className="transport-bar__play"
      style={{ width: P.playWidth, height: P.playHeight }}
      onClick={onClick}
      disabled={disabled}
      aria-label={disabled ? "Loading" : isPlaying ? "Pause" : "Play"}
    >
      <img
        src={isPlaying ? figmaAssets.pause : figmaAssets.play}
        alt=""
        width={P.playWidth}
        height={P.playHeight}
        className="transport-bar__play-img"
        draggable={false}
      />
    </button>
  );
}
