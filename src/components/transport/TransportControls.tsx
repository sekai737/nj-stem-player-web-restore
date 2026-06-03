import type { CSSProperties } from "react";
import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import FigmaIconButton from "../stem-player/FigmaIconButton";
import TransportBar from "../TransportBar";

interface TransportControlsProps {
  duration: number;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const ROW = FIGMA.transportRow;
const ICON = ROW.songNavIcon;

/** Figma Frame 113:107 — Previous Song, progress bar, Next Song. */
export default function TransportControls({
  duration,
  onSeek,
  onTogglePlay,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  disabled = false,
  className = "",
  style,
}: TransportControlsProps) {
  return (
    <div
      className={`flex shrink-0 items-center ${className}`.trim()}
      data-node-id="113:107"
      style={{
        width: ROW.width,
        height: ROW.height,
        gap: ROW.gap,
        ...style,
      }}
    >
      <FigmaIconButton
        label="Previous song"
        src={figmaAssets.previousSong}
        size={ICON}
        disabled={disabled || !hasPrevious}
        onClick={onPrevious}
        data-node-id="113:94"
      />
      <TransportBar
        duration={duration}
        onSeek={onSeek}
        onTogglePlay={onTogglePlay}
        disabled={disabled}
      />
      <FigmaIconButton
        label="Next song"
        src={figmaAssets.nextSong}
        size={ICON}
        disabled={disabled || !hasNext}
        onClick={onNext}
        data-node-id="113:100"
      />
    </div>
  );
}
