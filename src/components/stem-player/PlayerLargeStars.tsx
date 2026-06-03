import { BG_ELEMENTS_FRAME } from "../../figma/backgroundElements";
import { FIGMA } from "../../figma/layout";
import PlayerBackgroundDecor from "./PlayerBackgroundDecor";

type PlayerLargeStarsProps = {
  scale: number;
  contentLeft: number;
  contentTop: number;
};

/**
 * Large ALL-STAR decor (1:66) — 1920×1080 Figma frame, same scale() as UI content.
 * Sits outside the padded overflow-hidden shell so stars are not clipped.
 */
export default function PlayerLargeStars({ scale, contentLeft, contentTop }: PlayerLargeStarsProps) {
  const frameLeft = contentLeft - FIGMA.inset.x * scale;
  const frameTop = contentTop - FIGMA.inset.y * scale;

  return (
    <div
      className="pointer-events-none absolute z-[25] overflow-visible"
      aria-hidden
      style={{
        left: frameLeft,
        top: frameTop + BG_ELEMENTS_FRAME.top * scale,
        width: BG_ELEMENTS_FRAME.width,
        height: BG_ELEMENTS_FRAME.height,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <PlayerBackgroundDecor />
    </div>
  );
}
