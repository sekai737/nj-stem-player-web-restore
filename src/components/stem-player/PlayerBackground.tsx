import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";

const { width: FRAME_W, height: FRAME_H } = FIGMA.frame;
const stars = FIGMA.smallStars;

/**
 * Small-stars overlay inside the 1920px player shell.
 * z-0 keeps it above the fixed gradient + decor (shell is its own context) but
 * under the main UI content (z-[1]).
 */
export default function PlayerBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
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
