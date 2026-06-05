import type { CSSProperties, MouseEvent } from "react";
import SliderKnob from "../SliderKnob";
import { figmaAssets } from "../../figma/assets";
import { FIGMA_FULLSCREEN as FS } from "../../figma/fullscreenLayout";
import { usePlayerStore } from "../../store/playerStore";
import "./fullscreen-volume-slider.css";

const V = FS.volume;

export default function FullscreenVolumeSlider() {
  const volume = usePlayerStore((s) => s.masterVolume);
  const muted = usePlayerStore((s) => s.masterMuted);
  const setMasterVolume = usePlayerStore((s) => s.setMasterVolume);
  const resetMasterVolume = usePlayerStore((s) => s.resetMasterVolume);
  const toggleMasterMute = usePlayerStore((s) => s.toggleMasterMute);

  const handleDoubleClick = (e: MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    resetMasterVolume();
  };

  const pct = Math.round(volume * 100);
  const fillPct = muted ? 0 : pct;
  const thumbCenterY = V.trackHeight - (fillPct / 100) * V.trackHeight;

  const volumeVars = {
    "--fs-volume-design-w": `${V.width}px`,
    "--fs-volume-design-h": `${V.height}px`,
    "--fs-volume-offset-top": `${V.offsetTop}px`,
    "--fs-volume-padding-x": `${V.paddingX}px`,
    "--fs-volume-padding-y": `${V.paddingY}px`,
    "--fs-volume-gap": `${V.gap}px`,
    "--fs-volume-radius": `${V.radius}px`,
    "--fs-volume-label-size": `${V.labelSize}px`,
    "--fs-volume-label-height": `${V.labelHeight}px`,
    "--fs-volume-track-width": `${V.trackWidth}px`,
    "--fs-volume-track-height": `${V.trackHeight}px`,
    "--fs-volume-track-radius": `${V.trackRadius}px`,
    "--fs-volume-thumb-size": `${V.thumbSize}px`,
    "--fs-volume-icon-width": `${V.iconWidth}px`,
    "--fs-volume-icon-height": `${V.iconHeight}px`,
  } as CSSProperties;

  return (
    <aside
      className="fs-volume"
      style={volumeVars}
      aria-label="Master volume"
      data-node-id="120:241"
    >
      <div className="fs-volume__scale">
        <span className="fs-volume__label" data-node-id="120:240">
          {muted ? "Muted" : `${pct} %`}
        </span>

        <div className="fs-volume__track-wrap" data-node-id="120:238">
          <div className="fs-volume__track" aria-hidden data-node-id="120:235" />
          <div
            className="fs-volume__fill"
            style={{ height: `${fillPct}%` }}
            aria-hidden
            data-node-id="120:236"
          />
          <div
            className="fs-volume__thumb"
            style={{ top: thumbCenterY }}
            aria-hidden
            data-node-id="120:234"
          >
            <SliderKnob size={V.thumbSize} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={pct}
            className="fs-volume__input"
            aria-label="Master volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={`${pct} percent`}
            onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
            onInput={(e) => setMasterVolume(Number(e.currentTarget.value) / 100)}
            onDoubleClick={handleDoubleClick}
          />
        </div>

        <button
          type="button"
          className="fs-volume__mute"
          onClick={toggleMasterMute}
          aria-label={muted ? "Unmute" : "Mute"}
          data-node-id="120:228"
        >
          <img
            src={figmaAssets.volume}
            alt=""
            width={V.iconWidth}
            height={V.iconHeight}
            draggable={false}
          />
        </button>
      </div>
    </aside>
  );
}
