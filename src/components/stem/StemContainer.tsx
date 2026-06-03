import type { StemTrack } from "../../types";
import { FIGMA } from "../../figma/layout";
import StemRow from "./StemRow";

const S = FIGMA.stems;

interface StemContainerProps {
  stems: StemTrack[];
  onSeek: (time: number) => void;
  disabled?: boolean;
}

/** Figma frame: Stem container (node 2:400) — 1495×608, 4 rows × 128px + 32px gaps */
export default function StemContainer({ stems, onSeek, disabled = false }: StemContainerProps) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: S.width,
        height: S.height,
        gap: S.rowGap,
      }}
    >
      {stems.map((stem) => (
        <StemRow key={stem.id} stem={stem} onSeek={onSeek} disabled={disabled} />
      ))}
    </div>
  );
}
