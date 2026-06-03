import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";

const { width: FRAME_W, height: FRAME_H } = FIGMA.frame;
const stars = FIGMA.smallStars;

/** Figma Stem Player frame (1:58) — gradient base + small-stars under UI. */
export default function PlayerBackground() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <img
        src={figmaAssets.background}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <img
        src={figmaAssets.smallStars}
        alt=""
        className="absolute max-w-none"
        style={{
          left: `${(stars.left / FRAME_W) * 100}%`,
          top: `${(stars.top / FRAME_H) * 100}%`,
          width: `${(stars.width / FRAME_W) * 100}%`,
          height: `${(stars.height / FRAME_H) * 100}%`,
        }}
      />
    </div>
  );
}
