import type { StemId, StemTrack as StemTrackData } from "../../types";
import { FIGMA } from "../../figma/layout";
import StemTrack from "./StemTrack";
import VolumeControl from "./VolumeControl";

const S = FIGMA.stems;

interface StemRowProps {
  stem: StemTrackData;
  onSeek: (time: number) => void;
  disabled?: boolean;
  durationSec?: number;
}

/** Figma frame: Stem Row (node 2:282) — 1495×128 */
export default function StemRow({
  stem,
  onSeek,
  disabled = false,
  durationSec = 0,
}: StemRowProps) {
  const stemId = stem.id as StemId;

  return (
    <div
      className="flex shrink-0 items-center"
      style={{
        width: S.rowWidth,
        height: S.rowHeight,
        gap: S.rowGap,
      }}
    >
      <StemTrack
        stemId={stemId}
        src={stem.src!}
        onSeek={onSeek}
        disabled={disabled}
        ariaLabel={stem.label}
        durationSec={durationSec}
      />
      <VolumeControl stemId={stemId} label={stem.label} disabled={disabled} />
    </div>
  );
}
