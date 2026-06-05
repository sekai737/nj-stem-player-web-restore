import { useCallback, useState, type CSSProperties, type MouseEvent } from "react";
import type { StemId } from "../../types";
import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import { clampStemVolume, usePlayerStore } from "../../store/playerStore";
import SliderKnob from "../SliderKnob";
import "./volume-control.css";

const S = FIGMA.stems;
const T = S.volumeTooltip;

interface VolumeControlProps {
  stemId: StemId;
  label: string;
  disabled?: boolean;
}

/** Figma component: Volume Box / Volume control (nodes 2:348, 3:413) */
export default function VolumeControl({ stemId, label, disabled = false }: VolumeControlProps) {
  const ch = usePlayerStore((s) => s.channels[stemId]);
  const setChannelVolume = usePlayerStore((s) => s.setChannelVolume);
  const resetChannelVolume = usePlayerStore((s) => s.resetChannelVolume);

  const [tooltipVisible, setTooltipVisible] = useState(false);

  const pct = Math.round(ch.volume * 100);
  const knobLeft = `calc(${pct}% - ${S.sliderKnobSize / 2}px)`;
  const tooltipLeft = `${ch.volume * S.sliderWidth}px`;
  const trackTop = (S.sliderHeight - S.sliderTrackHeight) / 2;

  const sliderVars = {
    width: S.sliderWidth,
    height: S.sliderHeight,
    "--volume-tooltip-offset-y": `${T.offsetY}px`,
    "--volume-tooltip-padding-x": `${T.paddingX}px`,
    "--volume-tooltip-padding-y": `${T.paddingY}px`,
  } as CSSProperties;

  const showTooltip = () => {
    if (!disabled) setTooltipVisible(true);
  };
  const hideTooltip = () => setTooltipVisible(false);

  const handleChange = useCallback(
    (value: number) => {
      setChannelVolume(stemId, clampStemVolume(value));
    },
    [setChannelVolume, stemId],
  );

  const handleDoubleClick = (e: MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    resetChannelVolume(stemId);
  };

  return (
    <div
      className="flex shrink-0 items-center border-st border-stroke-primary bg-surface-primary"
      style={{
        width: S.volumeWidth,
        height: S.volumeHeight,
        gap: S.volumeGap,
        padding: S.volumePadding,
        borderRadius: S.volumeRadius,
      }}
    >
      <div
        className="relative shrink-0"
        style={{ width: S.volumeIconWidth, height: S.volumeIconHeight }}
      >
        <img src={figmaAssets.volume} alt="" className="size-full" />
      </div>

      <div
        className="volume-control__slider-wrap relative shrink-0"
        style={sliderVars}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        <div
          role="status"
          aria-live="polite"
          className={`volume-control__tooltip${tooltipVisible ? " volume-control__tooltip--visible" : ""}`}
          style={{ left: tooltipLeft }}
        >
          {pct}%
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          disabled={disabled}
          onChange={(e) => handleChange(Number(e.target.value) / 100)}
          onInput={(e) => handleChange(Number((e.target as HTMLInputElement).value) / 100)}
          onDoubleClick={handleDoubleClick}
          onMouseDown={showTooltip}
          className="absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={`${label} volume`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct} percent`}
        />
        <div
          className="pointer-events-none absolute left-0 bg-slider-secondary"
          style={{
            width: S.sliderWidth,
            height: S.sliderTrackHeight,
            top: trackTop,
            borderRadius: 2,
          }}
        />
        <div
          className="pointer-events-none absolute left-0 bg-slider-primary"
          style={{
            width: `${pct}%`,
            height: S.sliderTrackHeight,
            top: trackTop,
            borderRadius: 2,
          }}
        />
        <SliderKnob
          size={S.sliderKnobSize}
          className="pointer-events-none absolute"
          style={{
            top: (S.sliderHeight - S.sliderKnobSize) / 2,
            left: knobLeft,
          }}
        />
      </div>
    </div>
  );
}
