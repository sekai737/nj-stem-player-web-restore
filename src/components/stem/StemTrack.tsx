import type { MouseEvent } from "react";
import type { StemId } from "../../types";
import { figmaAssets } from "../../figma/assets";
import { muteIconSvg, soloIconSvg, stemLabelSvg } from "../../figma/stemAssets";
import { FIGMA } from "../../figma/layout";
import { usePlayerStore } from "../../store/playerStore";
import StemWaveform from "../StemWaveform";

const S = FIGMA.stems;

interface StemTrackProps {
  stemId: StemId;
  src: string;
  onSeek: (time: number) => void;
  disabled?: boolean;
  /** For accessibility only (label is rendered as SVG). */
  ariaLabel: string;
  durationSec?: number;
}

function SoloMuteButton({
  kind,
  active,
  onClick,
  disabled,
}: {
  kind: "solo" | "mute";
  active: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled: boolean;
}) {
  const isSolo = kind === "solo";
  const icon = isSolo
    ? active
      ? soloIconSvg.clicked
      : soloIconSvg.default
    : active
      ? muteIconSvg.clicked
      : muteIconSvg.default;

  const boxWidth = isSolo ? S.soloWidth : S.muteWidth;
  const title = isSolo ? "Solo" : "Mute";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className="relative flex shrink-0 items-center justify-center overflow-visible disabled:cursor-not-allowed disabled:opacity-50"
      style={{ width: boxWidth, height: S.soloMuteHeight }}
    >
      <img
        src={icon.src}
        alt=""
        className="block shrink-0 object-contain"
        style={{ width: icon.width, height: icon.height }}
        draggable={false}
      />
    </button>
  );
}

/** Figma component: Stem track (node 5:587) */
export default function StemTrack({
  stemId,
  src,
  onSeek,
  disabled = false,
  ariaLabel,
  durationSec = 0,
}: StemTrackProps) {
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleSolo = usePlayerStore((s) => s.toggleSolo);
  const ch = usePlayerStore((s) => s.channels[stemId]);
  const labelArt = stemLabelSvg[stemId];

  const labelDisplayWidth = Math.round((labelArt.width * S.labelHeight) / labelArt.height);

  return (
    <div
      className="relative flex shrink-0 items-center border-st border-stroke-primary shadow-pop-4"
      style={{
        width: S.trackWidth,
        height: S.trackHeight,
        gap: S.trackGap,
        paddingLeft: S.trackPaddingX,
        paddingRight: S.trackPaddingX,
        paddingTop: S.trackPaddingY,
        paddingBottom: S.trackPaddingY,
        borderRadius: S.trackRadius,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ borderRadius: S.trackRadius }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-figma-stem" />
        <img
          src={figmaAssets.stemTrack}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div
        className="relative z-10 flex shrink-0 items-center justify-start overflow-visible"
        style={{ width: S.labelWidth, height: S.labelHeight }}
      >
        <img
          src={labelArt.src}
          alt={ariaLabel}
          className="block shrink-0 object-left"
          style={{ height: S.labelHeight, width: labelDisplayWidth }}
          draggable={false}
        />
      </div>

      <div
        className="relative z-10 min-w-0 flex-1"
        style={{ height: S.waveformHeight }}
      >
        <StemWaveform
          stemId={stemId}
          src={src}
          onSeek={onSeek}
          disabled={disabled}
          fallbackDurationSec={durationSec}
        />
      </div>

      <div
        className="relative z-10 flex shrink-0 items-center"
        style={{ gap: S.soloMuteGap }}
      >
        <SoloMuteButton
          kind="solo"
          active={ch.solo}
          disabled={disabled}
          onClick={(e) => toggleSolo(stemId, e.shiftKey)}
        />
        <SoloMuteButton
          kind="mute"
          active={ch.muted && !ch.solo}
          disabled={disabled}
          onClick={() => toggleMute(stemId)}
        />
      </div>
    </div>
  );
}
