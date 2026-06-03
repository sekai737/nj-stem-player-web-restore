import type { CSSProperties, MouseEvent } from "react";
import { FIGMA } from "../figma/layout";
import { usePlayerStore } from "../store/playerStore";
import { formatTime } from "../utils/time";
import PlayPauseButton from "./transport/PlayPauseButton";
import "./transport/transport-bar.css";

interface TransportBarProps {
  duration: number;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const P = FIGMA.progress;

export default function TransportBar({
  duration,
  onSeek,
  onTogglePlay,
  disabled = false,
  className = "",
  style,
}: TransportBarProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const safeDuration = duration > 0 ? duration : 0;
  const progressPct = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

  const handleSeek = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    onSeek(Math.max(0, Math.min(next, safeDuration || 0)));
  };

  const handleScrubberDoubleClick = (e: MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled || safeDuration <= 0) return;
    onSeek(0);
  };

  return (
    <div
      className={`transport-bar flex shrink-0 items-center border-st border-stroke-primary bg-surface-primary ${className}`.trim()}
      data-node-id="26:217"
      style={{
        width: P.width,
        height: P.height,
        gap: P.gap,
        paddingLeft: P.paddingX,
        paddingRight: P.paddingX,
        paddingTop: P.paddingY,
        paddingBottom: P.paddingY,
        borderRadius: P.radius,
        ...style,
      }}
    >
      <PlayPauseButton
        isPlaying={isPlaying}
        disabled={disabled}
        onClick={() => void onTogglePlay()}
      />

      <p className="transport-time shrink-0 whitespace-nowrap text-center text-content-secondary">
        {formatTime(currentTime)}
      </p>

      <div
        className="transport-scrubber"
        style={
          {
            width: P.trackWidth,
            height: P.trackHeight,
            "--transport-track-height": `${P.trackBarHeight}px`,
            "--transport-track-radius": `${P.trackBarRadius}px`,
            "--transport-knob-radius": `${P.knobRadius}px`,
          } as CSSProperties
        }
        data-node-id="4:498"
      >
        <div className="transport-scrubber__visual" aria-hidden>
          <div className="transport-scrubber__track">
            <div className="transport-scrubber__elapsed" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="transport-scrubber__knob" style={{ left: `${progressPct}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={safeDuration || 1}
          step={0.01}
          value={Math.min(currentTime, safeDuration || 0)}
          disabled={disabled || safeDuration <= 0}
          className="transport-scrubber__input"
          aria-label="Song timeline"
          onChange={(e) => handleSeek(e.target.value)}
          onInput={(e) => handleSeek(e.currentTarget.value)}
          onDoubleClick={handleScrubberDoubleClick}
        />
      </div>

      <p className="transport-time shrink-0 whitespace-nowrap text-center text-content-secondary">
        {formatTime(safeDuration)}
      </p>
    </div>
  );
}
