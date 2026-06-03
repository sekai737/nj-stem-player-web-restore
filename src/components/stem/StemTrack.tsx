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
      className="relative flex shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
      style={{ width: boxWidth, height: S.soloMuteHeight }}
    >
      <img
        src={icon.src}
        alt=""
        width={icon.width}
        height={icon.height}
        className="max-h-full max-w-full object-contain"
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
}: StemTrackProps) {
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleSolo = usePlayerStore((s) => s.toggleSolo);
  const ch = usePlayerStore((s) => s.channels[stemId]);
  const labelArt = stemLabelSvg[stemId];

  return (
    <div
      className="relative flex shrink-0 items-center overflow-hidden border-st border-stroke-primary shadow-pop-4"
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
        className="pointer-events-none absolute inset-0 bg-figma-stem"
        style={{ borderRadius: S.trackRadius }}
        aria-hidden
      />
      <img
        src={figmaAssets.stemTrack}
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover"
        style={{ borderRadius: S.trackRadius }}
        aria-hidden
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />

      <div
        className="relative z-10 flex shrink-0 items-center"
        style={{ width: S.labelWidth, height: S.labelHeight }}
      >
        <img
          src={labelArt.src}
          alt={ariaLabel}
          width={labelArt.width}
          height={labelArt.height}
          className="max-h-full max-w-full object-contain object-left"
          draggable={false}
        />
      </div>

      <div
        className="relative z-10 min-w-0 flex-1"
        style={{ height: S.waveformHeight }}
      >
        <StemWaveform stemId={stemId} src={src} onSeek={onSeek} disabled={disabled} />
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
