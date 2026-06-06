import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { StemId } from "../../types";
import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import { clampStemVolume, usePlayerStore } from "../../store/playerStore";
import SliderKnob from "../SliderKnob";
import "./volume-control.css";

const S = FIGMA.stems;
const T = S.volumeTooltip;
const CLICK_DRAG_THRESHOLD_PX = 4;

interface VolumeControlProps {
  stemId: StemId;
  label: string;
  disabled?: boolean;
}

function volumeFromPointerX(clientX: number, rect: DOMRect): number {
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return clampStemVolume(ratio);
}

/** Figma component: Volume Box / Volume control (nodes 2:348, 3:413) */
export default function VolumeControl({ stemId, label, disabled = false }: VolumeControlProps) {
  const ch = usePlayerStore((s) => s.channels[stemId]);
  const setChannelVolume = usePlayerStore((s) => s.setChannelVolume);
  const resetChannelVolume = usePlayerStore((s) => s.resetChannelVolume);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startVol: number; moved: boolean } | null>(null);

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

  const endDrag = useCallback((pointerId: number) => {
    wrapRef.current?.releasePointerCapture(pointerId);
    dragRef.current = null;
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    wrapRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startVol: ch.volume, moved: false };
    showTooltip();
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !wrapRef.current) return;

    const deltaX = e.clientX - drag.startX;
    if (Math.abs(deltaX) >= CLICK_DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }

    const next = clampStemVolume(
      drag.startVol + (deltaX / S.sliderWidth) * S.volumeDragSensitivity,
    );
    handleChange(next);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (drag && rect && !drag.moved) {
      const target = volumeFromPointerX(e.clientX, rect);
      const blended = clampStemVolume(
        drag.startVol + (target - drag.startVol) * S.volumeClickBlend,
      );
      handleChange(blended);
    }
    endDrag(e.pointerId);
  };

  const onPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    endDrag(e.pointerId);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const step = S.volumeKeyStep;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      handleChange(ch.volume + step);
      showTooltip();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      handleChange(ch.volume - step);
      showTooltip();
    } else if (e.key === "Home") {
      e.preventDefault();
      handleChange(0);
    } else if (e.key === "End") {
      e.preventDefault();
      handleChange(1);
    }
  };

  const onDoubleClick = () => {
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
        ref={wrapRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${label} volume`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct} percent`}
        aria-disabled={disabled}
        className={`volume-control__slider-wrap relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-stroke-primary/40 ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        style={sliderVars}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
        onDoubleClick={onDoubleClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onBlur={hideTooltip}
      >
        <div
          role="status"
          aria-live="polite"
          className={`volume-control__tooltip${tooltipVisible ? " volume-control__tooltip--visible" : ""}`}
          style={{ left: tooltipLeft }}
        >
          {pct}%
        </div>

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
